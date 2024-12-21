/**
 * Enhanced Ball Physics Module
 * Optimized for performance and accuracy
 */

import { memoize } from 'lodash-es';
import { 
    calculateReynoldsNumber,
    calculateDragCoefficient,
    calculateMagnusCoefficient,
    calculateLiftCoefficient,
    calculateAerodynamicForces
} from './ball-aerodynamics.js';
import { TRACKMAN_CLUB_DATA } from '../data/trackman-data.js';
import { WorkerPool } from '../utils/worker-pool.js';
import os from 'os-browserify';
import gpgpu from '../utils/gpgpu.js';
import advancedCache from '../utils/advanced-cache.js';

// Constants for physics calculations
const CONSTANTS = {
    GRAVITY: 9.81,                    // m/s²
    AIR_DENSITY_SEA_LEVEL: 1.225,     // kg/m³
    BALL_MASS: 0.0459,               // kg
    BALL_DIAMETER: 0.0427,           // m
    BALL_AREA: Math.PI * 0.0427 * 0.0427 / 4,
    TIME_STEP: 0.001,                // seconds
    MAX_TIME: 15,                    // seconds
    WIND_GRADIENT_FACTOR: 0.15,      // wind increase per meter height
    TEMPERATURE_FACTOR: 0.00348,     // density change per °C
    PRESSURE_FACTOR: 0.0000120,      // density change per Pa
    HUMIDITY_FACTOR: 0.00367         // density change per % RH
};

// Create a worker pool for parallel calculations
const workerPool = new WorkerPool(os.cpus().length);

// Memoize expensive calculations
const calculateAirDensity = memoize((temperature, pressure, humidity, altitude) => {
    const baseRho = CONSTANTS.AIR_DENSITY_SEA_LEVEL;
    const tempEffect = 1 - CONSTANTS.TEMPERATURE_FACTOR * (temperature - 15);
    const pressureEffect = 1 + CONSTANTS.PRESSURE_FACTOR * (pressure - 101325);
    const humidityEffect = 1 - CONSTANTS.HUMIDITY_FACTOR * (humidity / 100);
    const altitudeEffect = Math.exp(-altitude / 7400);
    
    return baseRho * tempEffect * pressureEffect * humidityEffect * altitudeEffect;
}, (...args) => args.join('|'));

// Optimize wind calculations using TypedArrays
const calculateWindEffect = (height, baseSpeed, direction) => {
    const speed = baseSpeed * (1 + height * CONSTANTS.WIND_GRADIENT_FACTOR);
    return new Float32Array([
        speed * Math.cos(direction * Math.PI / 180),
        0,
        speed * Math.sin(direction * Math.PI / 180)
    ]);
};

// Use TypedArrays for position and velocity
class BallState {
    constructor() {
        this.position = new Float32Array(3);
        this.velocity = new Float32Array(3);
        this.acceleration = new Float32Array(3);
        this.forces = new Float32Array(3);
        this.time = 0;
    }

    clone() {
        const newState = new BallState();
        newState.position.set(this.position);
        newState.velocity.set(this.velocity);
        newState.acceleration.set(this.acceleration);
        newState.forces.set(this.forces);
        newState.time = this.time;
        return newState;
    }
}

class BallPhysics {
    constructor() {
        this.initialized = false;
        this.cache = new Map(); // Local cache for non-GPU calculations
        this.initialize();
    }

    /**
     * Initialize physics engine
     */
    async initialize() {
        if (this.initialized) return;
        
        // Initialize GPGPU
        gpgpu.initialize();
        this.initialized = true;
    }

    /**
     * Calculate ball trajectory
     * @param {Object} params - Initial conditions and environment
     * @returns {Object} Trajectory data and analytics
     */
    async calculateTrajectory(params) {
        const cacheKey = JSON.stringify(params);
        const cached = advancedCache.get(cacheKey);
        if (cached) return cached;

        // Validate input parameters
        if (!this.validateInputs(params)) {
            throw new Error('Invalid input parameters');
        }

        const {
            initialVelocity,
            launchAngle,
            spinRate,
            temperature = 20,
            pressure = 101325,
            humidity = 50,
            altitude = 0,
            windSpeed = 0,
            windDirection = 0,
            clubData = null
        } = params;

        // Initialize physics parameters
        const dt = 0.001; // Reduced time step for better accuracy
        const maxTime = 15; // Maximum simulation time in seconds
        const g = 9.81; // Gravitational acceleration in m/s²

        // Calculate air density based on environmental conditions
        const airDensity = calculateAirDensity({
            temperature,
            pressure,
            humidity,
            altitude
        });

        // Pre-allocate arrays for better performance
        const maxSteps = Math.ceil(maxTime / dt);
        const positions = new Array(maxSteps);
        const velocities = new Array(maxSteps);
        const times = new Array(maxSteps);
        let stepCount = 0;

        // Initial conditions (convert to SI units)
        const initialVelocityMS = initialVelocity * 0.44704; // mph to m/s
        let pos = new Float32Array([0, 0, 0]); // [x, y, z]
        let vel = new Float32Array([
            initialVelocityMS * Math.cos(launchAngle * Math.PI / 180),
            initialVelocityMS * Math.sin(launchAngle * Math.PI / 180),
            0
        ]);

        // Time integration loop
        let t = 0;
        let maxHeight = 0;
        let landed = false;

        while (t < maxTime && !landed) {
            // Store current state
            positions[stepCount] = new Float32Array(pos);
            velocities[stepCount] = new Float32Array(vel);
            times[stepCount] = t;
            stepCount++;

            // Update max height
            maxHeight = Math.max(maxHeight, pos[1]);

            // Calculate wind effect
            const windVel = calculateWindEffect(pos[1], windSpeed * 0.44704, windDirection);

            // Calculate relative velocity (including wind)
            const relVel = new Float32Array([
                vel[0] - windVel[0],
                vel[1] - windVel[1],
                vel[2] - windVel[2]
            ]);
            const speed = Math.sqrt(relVel[0] * relVel[0] + relVel[1] * relVel[1] + relVel[2] * relVel[2]);

            // Calculate aerodynamic forces
            const aeroForces = calculateAerodynamicForces({
                velocity: speed,
                spinRate: spinRate,
                airDensity: airDensity,
                launchAngle: Math.atan2(relVel[1], Math.sqrt(relVel[0] * relVel[0] + relVel[2] * relVel[2])) * 180 / Math.PI
            });

            // Calculate force components
            const dragMag = aeroForces.dragForce / speed;
            const liftMag = aeroForces.liftForce;

            const totalForce = new Float32Array([
                -dragMag * relVel[0] - liftMag * relVel[1],
                -dragMag * relVel[1] + liftMag * relVel[0] - g,
                -dragMag * relVel[2]
            ]);

            // Update velocity (4th order Runge-Kutta)
            const k1 = new Float32Array(totalForce.map(f => f * dt));
            const k2 = new Float32Array(totalForce.map(f => f * dt * 0.5));
            const k3 = new Float32Array(totalForce.map(f => f * dt * 0.5));
            const k4 = new Float32Array(totalForce.map(f => f * dt));

            vel[0] += (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]) / 6;
            vel[1] += (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]) / 6;
            vel[2] += (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]) / 6;

            // Update position
            pos[0] += vel[0] * dt;
            pos[1] += vel[1] * dt;
            pos[2] += vel[2] * dt;

            // Check if ball has landed
            if (pos[1] <= 0 && vel[1] < 0) {
                landed = true;
                const fraction = -pos[1] / vel[1];
                pos[0] += vel[0] * fraction;
                pos[2] += vel[2] * fraction;
                pos[1] = 0;
            }

            t += dt;
        }

        // Trim arrays to actual size
        const finalPositions = positions.slice(0, stepCount);
        const finalVelocities = velocities.slice(0, stepCount);
        const finalTimes = times.slice(0, stepCount);

        // Calculate final results
        const results = {
            carryDistance: Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]) * 1.0936, // Convert to yards
            maxHeight: maxHeight * 1.0936, // Convert to yards
            flightTime: t,
            finalVelocity: Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2]) * 2.23694, // Convert to mph
            trajectory: {
                positions: finalPositions,
                velocities: finalVelocities,
                times: finalTimes
            }
        };

        // Validate results
        if (isNaN(results.carryDistance) || isNaN(results.maxHeight) || 
            isNaN(results.flightTime) || isNaN(results.finalVelocity)) {
            throw new Error('Invalid physics calculation results');
        }

        // Calculate analytics if clubData is provided
        if (clubData) {
            const analytics = {
                efficiency: this.calculateEfficiency(results, clubData),
                dispersion: this.calculateDispersion(finalPositions),
                environmentalImpact: this.calculateEnvironmentalImpact(params),
                powerMetrics: this.calculatePowerMetrics(results, clubData),
                consistency: this.calculateConsistency(finalPositions)
            };

            const output = {
                trajectory: finalPositions,
                results,
                analytics,
                metadata: {
                    timestamp: new Date().toISOString(),
                    conditions: {
                        temperature,
                        pressure,
                        humidity,
                        altitude,
                        windSpeed,
                        windDirection
                    }
                }
            };

            // Cache the results
            advancedCache.set(cacheKey, output);

            return output;
        }

        return results;
    }

    /**
     * Validate input parameters
     * @param {Object} params - Input parameters
     * @returns {boolean} True if inputs are valid
     */
    validateInputs(params) {
        const {
            initialVelocity,
            launchAngle,
            spinRate,
            temperature = 20,
            pressure = 101325,
            humidity = 50,
            altitude = 0,
            windSpeed = 0,
            windDirection = 0
        } = params;

        // Check for required parameters
        if (typeof initialVelocity !== 'number' || isNaN(initialVelocity) || initialVelocity <= 0) {
            return false;
        }
        if (typeof launchAngle !== 'number' || isNaN(launchAngle) || launchAngle < -90 || launchAngle > 90) {
            return false;
        }
        if (typeof spinRate !== 'number' || isNaN(spinRate) || spinRate < 0) {
            return false;
        }

        // Check environmental parameters
        if (typeof temperature !== 'number' || isNaN(temperature) || temperature < -50 || temperature > 50) {
            return false;
        }
        if (typeof pressure !== 'number' || isNaN(pressure) || pressure < 80000 || pressure > 120000) {
            return false;
        }
        if (typeof humidity !== 'number' || isNaN(humidity) || humidity < 0 || humidity > 100) {
            return false;
        }
        if (typeof altitude !== 'number' || isNaN(altitude) || altitude < 0 || altitude > 5000) {
            return false;
        }
        if (typeof windSpeed !== 'number' || isNaN(windSpeed) || windSpeed < 0 || windSpeed > 100) {
            return false;
        }
        if (typeof windDirection !== 'number' || isNaN(windDirection) || windDirection < 0 || windDirection > 360) {
            return false;
        }

        return true;
    }

    /**
     * Helper functions for analytics
     */
    calculateEfficiency(results, clubData) {
        return {
            carryEfficiency: results.carryDistance / (clubData.carryDistance * 1.09361),
            heightEfficiency: results.maxHeight / (clubData.maxHeight * 1.09361),
            overallEfficiency: (
                results.carryDistance / (clubData.carryDistance * 1.09361) +
                results.maxHeight / (clubData.maxHeight * 1.09361)
            ) / 2
        };
    }

    calculateDispersion(trajectory) {
        const maxLateral = Math.max(...trajectory.map(p => Math.abs(p.z)));
        const maxHeight = Math.max(...trajectory.map(p => p.y));
        return {
            lateral: maxLateral,
            vertical: maxHeight,
            ratio: maxLateral / maxHeight
        };
    }

    calculateEnvironmentalImpact(params) {
        return {
            densityFactor: calculateAirDensity(
                params.temperature,
                params.pressure,
                params.humidity,
                params.altitude
            ) / CONSTANTS.AIR_DENSITY_SEA_LEVEL,
            windEffect: params.windSpeed * CONSTANTS.WIND_GRADIENT_FACTOR,
            altitudeEffect: Math.exp(-params.altitude / 7400)
        };
    }

    calculatePowerMetrics(results, clubData) {
        return {
            initialPower: clubData.ballSpeed * clubData.ballSpeed * 0.5,
            finalPower: results.finalVelocity * results.finalVelocity * 0.5,
            powerRetention: (results.finalVelocity * results.finalVelocity) / (clubData.ballSpeed * clubData.ballSpeed)
        };
    }

    calculateConsistency(trajectory) {
        const intervals = 10;
        const segmentSize = Math.floor(trajectory.length / intervals);
        const segments = [];

        for (let i = 0; i < intervals; i++) {
            const start = i * segmentSize;
            const end = start + segmentSize;
            const segment = trajectory.slice(start, end);
            segments.push({
                averageHeight: segment.reduce((sum, p) => sum + p.y, 0) / segment.length,
                averageSpeed: Math.sqrt(
                    segment.reduce((sum, p, j, arr) => {
                        if (j === 0) return sum;
                        const dt = arr[j].time - arr[j-1].time;
                        const dx = arr[j].x - arr[j-1].x;
                        const dy = arr[j].y - arr[j-1].y;
                        const dz = arr[j].z - arr[j-1].z;
                        return sum + Math.sqrt(dx*dx + dy*dy + dz*dz) / dt;
                    }, 0) / (segment.length - 1)
                )
            });
        }

        return {
            heightConsistency: 1 - Math.sqrt(
                segments.reduce((sum, s) => sum + Math.pow(s.averageHeight - segments[0].averageHeight, 2), 0) / intervals
            ) / segments[0].averageHeight,
            speedConsistency: 1 - Math.sqrt(
                segments.reduce((sum, s) => sum + Math.pow(s.averageSpeed - segments[0].averageSpeed, 2), 0) / intervals
            ) / segments[0].averageSpeed
        };
    }
}

const ballPhysics = new BallPhysics();

// Export both the class and singleton instance
export { BallPhysics, ballPhysics as default };
