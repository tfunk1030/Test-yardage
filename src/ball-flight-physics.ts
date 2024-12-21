import { PGA_CLUB_DATA } from './club-data';

interface Vector3D {
    x: number;
    y: number;
    z: number;
}

interface BallState {
    position: Vector3D;
    velocity: Vector3D;
    spin: number;
    time: number;
}

interface InitialConditions {
    velocity: Vector3D;
    spinRate: number;
}

interface EnvironmentalConditions {
    temperature: number;      // Fahrenheit
    pressure: number;         // inHg
    humidity: number;         // percentage
    windSpeed: number;        // mph
    windDirection: number;    // degrees
    elevation: number;        // feet
}

interface ClubData {
    type: string;
    loft: number;
    spinFactor: number;
}

export class BallFlightCalculator {
    private readonly GRAVITY: number = 32.174;  // ft/s²
    private readonly AIR_DENSITY_SEA_LEVEL: number = 0.0765;  // lb/ft³
    private readonly BALL_MASS: number = 0.1012;  // lb
    private readonly BALL_RADIUS: number = 0.0684;  // ft (1.68 inches)
    private readonly BALL_CROSS_SECTION: number;
    private readonly GROUND_EFFECT_HEIGHT: number = 3;  // ft
    private readonly MAX_GROUND_EFFECT: number = 0.2;   // maximum 20% lift increase
    private readonly WIND_GRADIENT_POWER: number = 0.143;  // Power law exponent for wind gradient
    private readonly REFERENCE_HEIGHT: number = 6;  // ft

    constructor() {
        this.BALL_CROSS_SECTION = Math.PI * this.BALL_RADIUS * this.BALL_RADIUS;
    }

    public calculateTrajectory(
        initialConditions: InitialConditions,
        environmentalConditions: EnvironmentalConditions,
        clubData: ClubData,
        timeStep: number = 0.001
    ): BallState[] {
        const adjustedInitialConditions = this.applyClubEffects(initialConditions, clubData);
        
        const trajectory: BallState[] = [];
        let state: BallState = {
            position: { x: 0, y: 0, z: 0 },
            velocity: { ...adjustedInitialConditions.velocity },
            spin: adjustedInitialConditions.spinRate,
            time: 0
        };

        trajectory.push({ ...state });

        while (state.position.y >= 0 && state.time < 15) {
            state = this.calculateNextState(state, environmentalConditions, clubData, timeStep);
            trajectory.push({ ...state });
        }

        const groundPhase = this.calculateGroundPhase(state, environmentalConditions, clubData);
        trajectory.push(...groundPhase);

        return trajectory;
    }

    private applyClubEffects(initialConditions: InitialConditions, clubData: ClubData): InitialConditions {
        const baseData = PGA_CLUB_DATA[clubData.type];
        const loftEffect = Math.sin(clubData.loft * Math.PI / 180);
        const spinEffect = clubData.spinFactor * baseData.spinFactor;

        return {
            velocity: {
                x: initialConditions.velocity.x * (1 - loftEffect),
                y: initialConditions.velocity.y + (initialConditions.velocity.x * loftEffect),
                z: initialConditions.velocity.z
            },
            spinRate: initialConditions.spinRate * spinEffect
        };
    }

    private calculateNextState(
        currentState: BallState,
        environmentalConditions: EnvironmentalConditions,
        clubData: ClubData,
        timeStep: number
    ): BallState {
        const airDensity = this.calculateAirDensity(
            environmentalConditions.temperature,
            environmentalConditions.pressure,
            environmentalConditions.humidity,
            environmentalConditions.elevation
        );

        const forces = this.calculateForces(
            currentState,
            environmentalConditions,
            airDensity
        );

        const acceleration = {
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
            spin: currentState.spin * Math.exp(-timeStep / 0.5),  // Spin decay
            time: currentState.time + timeStep
        };
    }

    private calculateAirDensity(
        temperature: number,
        pressure: number,
        humidity: number,
        elevation: number
    ): number {
        const standardPressure = 29.92;  // inHg
        const temperatureK = (temperature - 32) * 5/9 + 273.15;
        
        // Simplified air density calculation
        const densityRatio = (pressure / standardPressure) * (288.15 / temperatureK);
        
        // Humidity correction (simplified)
        const humidityFactor = 1 - (0.0026 * humidity/100);
        
        // Elevation correction using barometric formula
        const elevationFactor = Math.exp(-elevation / 29000);
        
        return this.AIR_DENSITY_SEA_LEVEL * densityRatio * humidityFactor * elevationFactor;
    }

    private calculateGroundPhase(
        finalState: BallState,
        environmentalConditions: EnvironmentalConditions,
        clubData: ClubData
    ): BallState[] {
        // Implement ground physics (bounce and roll)
        // This is a simplified implementation
        const groundStates: BallState[] = [];
        let currentState = { ...finalState };
        
        // Bounce
        if (Math.abs(currentState.velocity.y) > 5) {
            currentState.velocity.y *= -0.5;  // 50% energy loss
            currentState.velocity.x *= 0.8;   // 20% energy loss
            currentState.velocity.z *= 0.8;   // 20% energy loss
            currentState.position.y = 0.1;    // Small bounce height
            groundStates.push({ ...currentState });
        }
        
        // Roll
        const rollDistance = Math.sqrt(
            currentState.velocity.x * currentState.velocity.x +
            currentState.velocity.z * currentState.velocity.z
        ) * 0.5;  // Simplified roll calculation
        
        const rollTime = rollDistance / Math.max(1, Math.sqrt(
            currentState.velocity.x * currentState.velocity.x +
            currentState.velocity.z * currentState.velocity.z
        ));
        
        currentState = {
            position: {
                x: currentState.position.x + currentState.velocity.x * rollTime,
                y: 0,
                z: currentState.position.z + currentState.velocity.z * rollTime
            },
            velocity: { x: 0, y: 0, z: 0 },
            spin: 0,
            time: currentState.time + rollTime
        };
        
        groundStates.push(currentState);
        
        return groundStates;
    }

    private calculateForces(
        state: BallState,
        environmentalConditions: EnvironmentalConditions,
        airDensity: number
    ): Vector3D {
        const velocity = state.velocity;
        const speed = Math.sqrt(
            velocity.x * velocity.x +
            velocity.y * velocity.y +
            velocity.z * velocity.z
        );

        if (speed === 0) return { x: 0, y: 0, z: 0 };

        // Calculate wind effect
        const heightFactor = Math.pow(state.position.y / this.REFERENCE_HEIGHT, this.WIND_GRADIENT_POWER);
        const windSpeed = environmentalConditions.windSpeed * heightFactor;
        const windRad = environmentalConditions.windDirection * Math.PI / 180;
        
        const relativeVelocity = {
            x: velocity.x - windSpeed * Math.cos(windRad),
            y: velocity.y,
            z: velocity.z - windSpeed * Math.sin(windRad)
        };

        const relativeSpeed = Math.sqrt(
            relativeVelocity.x * relativeVelocity.x +
            relativeVelocity.y * relativeVelocity.y +
            relativeVelocity.z * relativeVelocity.z
        );

        // Drag force
        const dragCoefficient = 0.25 + (0.1 * state.spin / 3000);  // Simplified drag coefficient
        const dragMagnitude = 0.5 * airDensity * relativeSpeed * relativeSpeed * this.BALL_CROSS_SECTION * dragCoefficient;

        // Magnus force (spin effect)
        const magnusCoefficient = 0.1 * state.spin / 3000;  // Simplified Magnus coefficient
        const magnusMagnitude = 0.5 * airDensity * relativeSpeed * this.BALL_CROSS_SECTION * magnusCoefficient;

        // Ground effect
        let groundEffect = 1.0;
        if (state.position.y < this.GROUND_EFFECT_HEIGHT) {
            groundEffect = 1.0 + this.MAX_GROUND_EFFECT * (1 - state.position.y / this.GROUND_EFFECT_HEIGHT);
        }

        // Combine forces
        return {
            x: -dragMagnitude * relativeVelocity.x / relativeSpeed,
            y: (-dragMagnitude * relativeVelocity.y / relativeSpeed + magnusMagnitude) * groundEffect,
            z: -dragMagnitude * relativeVelocity.z / relativeSpeed
        };
    }
}
