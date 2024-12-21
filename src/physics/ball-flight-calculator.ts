import { 
    BallState, 
    Vector3D, 
    InitialConditions,
    EnvironmentalConditions, 
    ClubData,
    AerodynamicCoefficients 
} from '../types/physics';

const { calculateAirDensity } = require('../utils/environmental-utils');
const { 
    calculateSpinDecay, 
    calculateGearEffect, 
    calculateLaunchVariation, 
    calculateSpinVariation 
} = require('../utils/spin-utils');

export class BallFlightCalculator {
    private readonly GRAVITY: number = 32.174;  // ft/s²
    private readonly BALL_MASS: number = 0.1012;  // lb
    private readonly BALL_RADIUS: number = 0.0684;  // ft (1.68 inches)
    private readonly BALL_CROSS_SECTION: number;
    private readonly GROUND_EFFECT_HEIGHT: number = 3;  // ft
    private readonly MAX_GROUND_EFFECT: number = 0.2;   // maximum 20% lift increase
    private readonly WIND_GRADIENT_POWER: number = 0.143;  // Power law exponent
    private readonly REFERENCE_HEIGHT: number = 6;  // ft
    private readonly DRAG_COEFFICIENT_BASE: number = 0.25;
    private readonly LIFT_COEFFICIENT_BASE: number = 0.15;
    private readonly FORCE_SCALING_FACTOR: number = 0.003;  // Base force scaling
    private readonly MIN_BOUNCE_HEIGHT: number = 0.1;  // Minimum bounce height in feet
    private readonly BOUNCE_ENERGY_LOSS: number = 0.3;  // 30% energy loss on bounce
    private readonly ROLL_FRICTION: number = 0.2;  // Rolling friction coefficient
    private readonly DISTANCE_SCALING: number = 0.85;  // Distance scaling
    private readonly WIND_FORCE_MULTIPLIER: number = 0.4; // Wind effect multiplier
    private readonly ALTITUDE_EFFECT_MULTIPLIER: number = 1.1; // Altitude effect multiplier

    constructor() {
        this.BALL_CROSS_SECTION = Math.PI * this.BALL_RADIUS * this.BALL_RADIUS;
    }

    private calculateAerodynamicCoefficients(
        velocity: number,
        spinRate: number,
        airDensity: number
    ): AerodynamicCoefficients {
        const reynolds = (velocity * this.BALL_RADIUS * 2) / (1.46e-5 / airDensity);
        const spinFactor = (spinRate * Math.PI / 30) * (this.BALL_RADIUS * 2) / velocity;
        
        let dragCoeff = this.DRAG_COEFFICIENT_BASE;
        if (reynolds < 40000) {
            dragCoeff = 0.4;
        } else if (reynolds < 100000) {
            dragCoeff = this.DRAG_COEFFICIENT_BASE + (0.15 * (100000 - reynolds) / 60000);
        }

        dragCoeff += 0.1 * Math.min(spinFactor / 0.1, 1);
        const liftCoeff = Math.min(spinFactor * this.LIFT_COEFFICIENT_BASE, 0.3);

        return { dragCoeff, liftCoeff };
    }

    private calculateGroundEffect(height: number): number {
        if (height > this.GROUND_EFFECT_HEIGHT) return 0;
        
        const normalizedHeight = height / this.GROUND_EFFECT_HEIGHT;
        return this.MAX_GROUND_EFFECT * (1 - Math.exp(-2 * (1 - normalizedHeight)));
    }

    public calculateForces(
        state: BallState, 
        conditions: EnvironmentalConditions, 
        airDensity: number
    ): Vector3D {
        // Convert wind direction to radians (0° is tailwind, 180° is headwind)
        const windRad = conditions.windDirection * Math.PI / 180;
        
        // Calculate wind effect with height gradient
        const heightFactor = Math.pow(
            Math.max(state.position.y, 0.1) / this.REFERENCE_HEIGHT, 
            this.WIND_GRADIENT_POWER
        );
        const effectiveWindSpeed = conditions.windSpeed * heightFactor * this.WIND_FORCE_MULTIPLIER;
        
        // Calculate wind components
        // For headwind (180°), wind opposes motion, increasing relative speed
        // For tailwind (0°), wind assists motion, decreasing relative speed
        const windX = effectiveWindSpeed * Math.cos(windRad);
        const windZ = effectiveWindSpeed * Math.sin(windRad);

        // Calculate relative velocity (ball velocity relative to wind)
        const relativeVelocity: Vector3D = {
            x: state.velocity.x - windX,  // Subtract wind for correct relative motion
            y: state.velocity.y,
            z: state.velocity.z - windZ
        };

        const relativeSpeed = Math.sqrt(
            relativeVelocity.x * relativeVelocity.x +
            relativeVelocity.y * relativeVelocity.y +
            relativeVelocity.z * relativeVelocity.z
        );

        if (relativeSpeed === 0) return { x: 0, y: 0, z: 0 };

        // Calculate aerodynamic coefficients
        const { dragCoeff, liftCoeff } = this.calculateAerodynamicCoefficients(
            relativeSpeed,
            state.spin,
            airDensity
        );

        // Calculate drag and lift forces
        const dragMag = this.FORCE_SCALING_FACTOR * airDensity * this.BALL_CROSS_SECTION * 
                       dragCoeff * relativeSpeed * relativeSpeed;
        const liftMag = this.FORCE_SCALING_FACTOR * airDensity * this.BALL_CROSS_SECTION * 
                       liftCoeff * relativeSpeed * state.spin / 5400;

        // Apply ground effect
        const groundEffect = this.calculateGroundEffect(state.position.y);
        
        // Calculate wind effect
        // For headwind (180°), windFactor is -1, opposing motion
        // For tailwind (0°), windFactor is +1, assisting motion
        const windFactor = Math.cos(windRad);  // +1 for tailwind, -1 for headwind
        const dragScaling = 1 + (windFactor * this.WIND_FORCE_MULTIPLIER);

        // Calculate total forces with wind effect
        const totalDragX = -dragMag * dragScaling * relativeVelocity.x / relativeSpeed;
        const totalDragY = -dragMag * relativeVelocity.y / relativeSpeed;
        const totalDragZ = -dragMag * relativeVelocity.z / relativeSpeed;

        return {
            x: totalDragX,
            y: (totalDragY + liftMag) * (1 + groundEffect),
            z: totalDragZ
        };
    }

    public calculateTrajectory(
        initialConditions: InitialConditions,
        environmentalConditions: EnvironmentalConditions,
        clubData: ClubData,
        timeStep: number = 0.001
    ): BallState[] {
        const adjustedInitialConditions = this.applyClubEffects(initialConditions, clubData);
        const airDensity = calculateAirDensity(
            environmentalConditions.temperature,
            environmentalConditions.pressure,
            environmentalConditions.humidity,
            environmentalConditions.elevation
        );
        
        // Apply altitude effect to initial velocity
        const altitudeEffect = 1 + (environmentalConditions.elevation / 5280) * 
                             (this.ALTITUDE_EFFECT_MULTIPLIER - 1);
        
        const trajectory: BallState[] = [];
        let state: BallState = {
            position: { x: 0, y: 0, z: 0 },
            velocity: {
                x: adjustedInitialConditions.velocity.x * this.DISTANCE_SCALING * altitudeEffect,
                y: adjustedInitialConditions.velocity.y * this.DISTANCE_SCALING * altitudeEffect,
                z: adjustedInitialConditions.velocity.z * this.DISTANCE_SCALING * altitudeEffect
            },
            spin: adjustedInitialConditions.spinRate,
            time: 0
        };

        trajectory.push({ ...state });

        // Flight phase
        while (state.position.y >= 0 && state.time < 15) {
            state = this.calculateNextState(state, environmentalConditions, airDensity, timeStep);
            if (state.position.y >= 0) {
                trajectory.push({ ...state });
            }
        }

        // Interpolate to find exact ground impact point
        const lastState = trajectory[trajectory.length - 1];
        const impactTime = lastState.time - (lastState.position.y / lastState.velocity.y);
        const impactState = this.calculateNextState(
            lastState,
            environmentalConditions,
            airDensity,
            impactTime - lastState.time
        );
        impactState.position.y = 0;
        trajectory.push(impactState);

        // Ground phase
        const groundPhase = this.calculateGroundPhase(
            impactState, 
            environmentalConditions
        );
        trajectory.push(...groundPhase);

        return trajectory;
    }

    private calculateNextState(
        currentState: BallState,
        conditions: EnvironmentalConditions,
        airDensity: number,
        timeStep: number
    ): BallState {
        const forces = this.calculateForces(currentState, conditions, airDensity);
        
        const acceleration: Vector3D = {
            x: forces.x / this.BALL_MASS,
            y: forces.y / this.BALL_MASS - this.GRAVITY,
            z: forces.z / this.BALL_MASS
        };

        return {
            position: {
                x: currentState.position.x + currentState.velocity.x * timeStep + 0.5 * acceleration.x * timeStep * timeStep,
                y: currentState.position.y + currentState.velocity.y * timeStep + 0.5 * acceleration.y * timeStep * timeStep,
                z: currentState.position.z + currentState.velocity.z * timeStep + 0.5 * acceleration.z * timeStep * timeStep
            },
            velocity: {
                x: currentState.velocity.x + acceleration.x * timeStep,
                y: currentState.velocity.y + acceleration.y * timeStep,
                z: currentState.velocity.z + acceleration.z * timeStep
            },
            spin: calculateSpinDecay(currentState.spin, airDensity, timeStep),
            time: currentState.time + timeStep
        };
    }

    private applyClubEffects(
        initialConditions: InitialConditions,
        clubData: ClubData
    ): InitialConditions {
        const launchVariation = calculateLaunchVariation(clubData);
        const spinVariation = calculateSpinVariation(clubData);
        const gearEffect = calculateGearEffect(clubData.impact || 'center');
        
        return {
            velocity: {
                ...initialConditions.velocity,
                y: initialConditions.velocity.y * (1 + launchVariation)
            },
            spinRate: initialConditions.spinRate * 
                     (1 + spinVariation) * 
                     (1 + gearEffect.spinEffect)
        };
    }

    private calculateGroundPhase(
        finalState: BallState,
        conditions: EnvironmentalConditions
    ): BallState[] {
        const groundPhase: BallState[] = [];
        const COR = (conditions.groundHardness || 0.7) * 0.8; // Reduced coefficient of restitution
        
        // First bounce
        let bounceState: BallState = {
            ...finalState,
            position: { ...finalState.position, y: this.MIN_BOUNCE_HEIGHT },
            velocity: {
                x: finalState.velocity.x * (1 - this.BOUNCE_ENERGY_LOSS),
                y: Math.abs(finalState.velocity.y) * COR,
                z: finalState.velocity.z * (1 - this.BOUNCE_ENERGY_LOSS)
            }
        };
        groundPhase.push(bounceState);

        // Calculate roll phase
        const initialRollSpeed = Math.sqrt(
            bounceState.velocity.x * bounceState.velocity.x +
            bounceState.velocity.z * bounceState.velocity.z
        );
        const rollDistance = this.calculateRollDistance(bounceState, conditions);
        const rollTime = rollDistance / Math.max(1, initialRollSpeed);
        const timeStep = rollTime / 5;

        // Add intermediate roll states
        for (let i = 1; i <= 5; i++) {
            const t = i * timeStep;
            const speedFactor = Math.exp(-this.ROLL_FRICTION * t);
            const rollState: BallState = {
                position: {
                    x: bounceState.position.x + (bounceState.velocity.x * t * speedFactor),
                    y: 0,
                    z: bounceState.position.z + (bounceState.velocity.z * t * speedFactor)
                },
                velocity: {
                    x: bounceState.velocity.x * speedFactor,
                    y: 0,
                    z: bounceState.velocity.z * speedFactor
                },
                spin: 0,
                time: bounceState.time + t
            };
            groundPhase.push(rollState);
        }

        return groundPhase;
    }

    private calculateRollDistance(
        state: BallState,
        conditions: EnvironmentalConditions
    ): number {
        const initialSpeed = Math.sqrt(
            state.velocity.x * state.velocity.x +
            state.velocity.z * state.velocity.z
        );
        const hardnessFactor = conditions.groundHardness || 0.7;
        
        // Use energy-based approach for roll distance with scaling
        return (initialSpeed * initialSpeed) / 
               (2 * this.GRAVITY * this.ROLL_FRICTION) * 
               hardnessFactor * 
               this.DISTANCE_SCALING;
    }
}

// For CommonJS compatibility
module.exports = { BallFlightCalculator };
