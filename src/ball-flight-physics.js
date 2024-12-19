import { PGA_CLUB_DATA } from './club-data.js';

class BallFlightCalculator {
    constructor() {
        // Physical constants
        this.GRAVITY = 32.174;  // ft/s²
        this.AIR_DENSITY_SEA_LEVEL = 0.0765;  // lb/ft³
        this.BALL_MASS = 0.1012;  // lb
        this.BALL_RADIUS = 0.0684;  // ft (1.68 inches)
        this.BALL_CROSS_SECTION = Math.PI * this.BALL_RADIUS * this.BALL_RADIUS;  // ft²
        
        // Ground effect constants
        this.GROUND_EFFECT_HEIGHT = 3;  // ft
        this.MAX_GROUND_EFFECT = 0.2;   // maximum 20% lift increase
        
        // Wind gradient constants
        this.WIND_GRADIENT_POWER = 0.143;  // Power law exponent for wind gradient
        this.REFERENCE_HEIGHT = 6;  // ft (typical measurement height)
    }

    calculateTrajectory(initialConditions, environmentalConditions, clubData, timeStep = 0.001) {
        // Apply club-specific launch conditions
        const adjustedInitialConditions = this.applyClubEffects(initialConditions, clubData);
        
        const trajectory = [];
        let state = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { ...adjustedInitialConditions.velocity },
            spin: adjustedInitialConditions.spinRate,
            time: 0
        };

        // Add initial state to trajectory
        trajectory.push({ ...state });

        // Calculate trajectory until ball hits ground or max time reached
        while (state.position.y >= 0 && state.time < 15) {  // 15 second max flight time
            state = this.calculateNextState(state, environmentalConditions, clubData, timeStep);
            trajectory.push({ ...state });
        }

        // Calculate and add bounce and roll
        const groundPhase = this.calculateGroundPhase(state, environmentalConditions, clubData);
        trajectory.push(...groundPhase);

        return trajectory;
    }

    applyClubEffects(initialConditions, clubData) {
        const baseData = PGA_CLUB_DATA[clubData.type];
        
        // Calculate launch variation based on club characteristics
        const launchAngleVariation = this.calculateLaunchVariation(clubData);
        const spinVariation = this.calculateSpinVariation(clubData);
        
        // Apply gear effect for off-center hits
        const gearEffect = this.calculateGearEffect(clubData.impact || 'center');
        
        return {
            velocity: {
                ...initialConditions.velocity,
                // Adjust for club-specific launch conditions
                y: initialConditions.velocity.y * (1 + launchAngleVariation)
            },
            spinRate: initialConditions.spinRate * (1 + spinVariation) * (1 + gearEffect.spinEffect),
            sideSpinRate: gearEffect.sideSpinRate || 0
        };
    }

    calculateNextState(currentState, conditions, clubData, dt) {
        // Calculate forces including ground effect and wind gradient
        const forces = this.calculateForces(currentState, conditions, clubData);
        
        // Update velocities using forces
        const acceleration = {
            x: forces.x / this.BALL_MASS,
            y: forces.y / this.BALL_MASS - this.GRAVITY,
            z: forces.z / this.BALL_MASS
        };

        const newState = {
            position: {
                x: currentState.position.x + currentState.velocity.x * dt + 0.5 * acceleration.x * dt * dt,
                y: currentState.position.y + currentState.velocity.y * dt + 0.5 * acceleration.y * dt * dt,
                z: currentState.position.z + currentState.velocity.z * dt + 0.5 * acceleration.z * dt * dt
            },
            velocity: {
                x: currentState.velocity.x + acceleration.x * dt,
                y: currentState.velocity.y + acceleration.y * dt,
                z: currentState.velocity.z + acceleration.z * dt
            },
            spin: this.calculateSpinDecay(currentState.spin, conditions.airDensity, dt),
            time: currentState.time + dt
        };

        return newState;
    }

    calculateForces(state, conditions, clubData) {
        // Basic aerodynamic forces
        const baseForces = this.calculateBaseForces(state, conditions);
        
        // Add ground effect
        const groundEffect = this.calculateGroundEffect(state.position.y);
        
        // Calculate wind force with altitude gradient
        const windForces = this.calculateWindGradientForce(state, conditions);
        
        // Add turbulence if specified in conditions
        const turbulence = conditions.turbulence ? 
            this.calculateTurbulence(state, conditions) : { x: 0, y: 0, z: 0 };

        return {
            x: baseForces.x + windForces.x + turbulence.x,
            y: baseForces.y * (1 + groundEffect) + turbulence.y,
            z: baseForces.z + windForces.z + turbulence.z
        };
    }

    calculateBaseForces(state, conditions) {
        const velocityMag = Math.sqrt(
            state.velocity.x * state.velocity.x + 
            state.velocity.y * state.velocity.y + 
            state.velocity.z * state.velocity.z
        );

        const reynolds = this.calculateReynoldsNumber(velocityMag, conditions);
        const { dragCoeff, liftCoeff } = this.calculateAerodynamicCoefficients(reynolds, state.spin);

        const dragMag = 0.5 * conditions.airDensity * this.BALL_CROSS_SECTION * 
                       dragCoeff * velocityMag * velocityMag;
        const liftMag = 0.5 * conditions.airDensity * this.BALL_CROSS_SECTION * 
                       liftCoeff * velocityMag * state.spin / 5400;

        return {
            x: -dragMag * state.velocity.x / velocityMag,
            y: -dragMag * state.velocity.y / velocityMag + liftMag,
            z: -dragMag * state.velocity.z / velocityMag
        };
    }

    calculateWindGradientForce(state, conditions) {
        const height = Math.max(state.position.y, 0.1);  // Avoid division by zero
        const gradientFactor = Math.pow(height / this.REFERENCE_HEIGHT, this.WIND_GRADIENT_POWER);
        const effectiveWindSpeed = conditions.windSpeed * gradientFactor;

        return {
            x: this.calculateWindEffect(effectiveWindSpeed, conditions.windDirection, 'x'),
            y: 0,
            z: this.calculateWindEffect(effectiveWindSpeed, conditions.windDirection, 'z')
        };
    }

    calculateGroundEffect(height) {
        if (height > this.GROUND_EFFECT_HEIGHT) return 0;
        
        // Exponential increase in lift as ball gets closer to ground
        const normalizedHeight = height / this.GROUND_EFFECT_HEIGHT;
        return this.MAX_GROUND_EFFECT * (1 - Math.exp(-2 * (1 - normalizedHeight)));
    }

    calculateTurbulence(state, conditions) {
        // Simplified turbulence model using wind speed and height
        const turbulenceIntensity = 0.15 * conditions.windSpeed / 10;  // 15% at 10mph
        const randomFactor = () => (Math.random() - 0.5) * 2;  // Random between -1 and 1
        
        return {
            x: turbulenceIntensity * randomFactor(),
            y: turbulenceIntensity * randomFactor() * 0.5,  // Less vertical turbulence
            z: turbulenceIntensity * randomFactor()
        };
    }

    calculateGroundPhase(finalState, conditions, clubData) {
        const groundPhase = [];
        let state = { ...finalState };
        
        // Calculate bounce
        const bounceState = this.calculateBounce(state, conditions, clubData);
        groundPhase.push(bounceState);
        
        // Calculate roll
        const rollStates = this.calculateRoll(bounceState, conditions, clubData);
        groundPhase.push(...rollStates);
        
        return groundPhase;
    }

    calculateBounce(state, conditions, clubData) {
        // Calculate coefficient of restitution based on club and ground conditions
        const COR = this.calculateCOR(conditions.groundHardness || 0.7);
        
        return {
            ...state,
            velocity: {
                x: state.velocity.x * 0.8,  // Friction loss
                y: -state.velocity.y * COR,  // Bounce
                z: state.velocity.z * 0.8   // Friction loss
            }
        };
    }

    calculateRoll(state, conditions, clubData) {
        const rollStates = [];
        let currentState = { ...state };
        const rollDistance = this.calculateRollDistance(state, conditions, clubData);
        
        // Simulate roll in small steps
        const stepSize = rollDistance / 10;
        for (let i = 0; i < 10; i++) {
            currentState = {
                ...currentState,
                position: {
                    x: currentState.position.x + stepSize * Math.cos(conditions.groundSlope || 0),
                    y: currentState.position.y + stepSize * Math.sin(conditions.groundSlope || 0),
                    z: currentState.position.z
                },
                velocity: {
                    x: currentState.velocity.x * 0.9,
                    y: currentState.velocity.y * 0.9,
                    z: currentState.velocity.z * 0.9
                }
            };
            rollStates.push(currentState);
        }
        
        return rollStates;
    }

    // Validation methods
    validateAgainstLaunchMonitor(simulatedShot, launchMonitorData) {
        const validation = {
            carryDistance: {
                simulated: this.calculateCarryDistance(simulatedShot),
                actual: launchMonitorData.carryDistance,
                error: 0
            },
            maxHeight: {
                simulated: this.calculateMaxHeight(simulatedShot),
                actual: launchMonitorData.maxHeight,
                error: 0
            },
            landingAngle: {
                simulated: this.calculateLandingAngle(simulatedShot),
                actual: launchMonitorData.landingAngle,
                error: 0
            }
        };

        // Calculate error percentages
        for (const metric in validation) {
            validation[metric].error = 
                Math.abs(validation[metric].simulated - validation[metric].actual) / 
                validation[metric].actual * 100;
        }

        return validation;
    }

    // Helper methods from previous version remain unchanged...
    calculateReynoldsNumber(velocity, conditions) { /* ... */ }
    calculateAerodynamicCoefficients(reynolds, spinRate) { /* ... */ }
    calculateSpinDecay(spin, airDensity, dt) { /* ... */ }
    calculateWindEffect(windSpeed, windDirection, axis) { /* ... */ }
    
    // New helper methods
    calculateLaunchVariation(clubData) {
        // Calculate launch angle variation based on club characteristics
        const baseVariation = 0.05;  // 5% baseline variation
        return baseVariation * (clubData.quality || 1);
    }

    calculateSpinVariation(clubData) {
        // Calculate spin variation based on club characteristics
        const baseVariation = 0.08;  // 8% baseline variation
        return baseVariation * (clubData.quality || 1);
    }

    calculateGearEffect(impactLocation) {
        const gearEffects = {
            'center': { spinEffect: 0, sideSpinRate: 0 },
            'toe': { spinEffect: 0.1, sideSpinRate: -500 },
            'heel': { spinEffect: 0.1, sideSpinRate: 500 },
            'high': { spinEffect: -0.05, sideSpinRate: 0 },
            'low': { spinEffect: 0.15, sideSpinRate: 0 }
        };
        return gearEffects[impactLocation] || gearEffects.center;
    }

    calculateCOR(groundHardness) {
        return 0.4 + (groundHardness * 0.3);  // COR between 0.4 and 0.7
    }

    calculateRollDistance(state, conditions, clubData) {
        // Calculate roll distance based on landing angle, speed, and ground conditions
        const landingSpeed = Math.sqrt(
            state.velocity.x * state.velocity.x +
            state.velocity.z * state.velocity.z
        );
        const landingAngle = Math.atan2(state.velocity.y, landingSpeed);
        
        // More roll for lower landing angles and harder ground
        return (landingSpeed * Math.cos(landingAngle)) * 
               (conditions.groundHardness || 0.7) * 
               (1 - Math.abs(landingAngle) / (Math.PI / 2));
    }
}

export default BallFlightCalculator;