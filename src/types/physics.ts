export interface Vector3D {
    x: number;
    y: number;
    z: number;
}

export interface BallState {
    position: Vector3D;
    velocity: Vector3D;
    spin: number;
    time: number;
}

export interface InitialConditions {
    velocity: Vector3D;
    spinRate: number;
}

export interface EnvironmentalConditions {
    temperature: number;      // Fahrenheit
    pressure: number;         // inHg
    humidity: number;         // percentage
    windSpeed: number;        // mph
    windDirection: number;    // degrees
    elevation: number;        // feet
    groundHardness?: number;  // 0-1 scale
}

export interface ClubData {
    type: string;
    loft: number;
    spinFactor: number;
    quality?: number;
    ballSpeed?: number;      // mph
    impact?: 'center' | 'toe' | 'heel' | 'high' | 'low';
    compression?: number;    // compression factor
}

export interface TrajectoryCharacteristics {
    timeToApex: number;
    totalFlightTime: number;
    trajectoryShape: number;
    magnusEffect: number;
    dragCoefficient: number;
    spinDecayRate?: number;
}

export interface DewPointEffect {
    spinFactor: number;
    carryFactor: number;
}

export interface BallFlightAdjustments {
    dewPoint: number;
    finalSpin: number;
    spinFactor: number;
    carryFactor: number;
    trajectoryData: TrajectoryCharacteristics;
    totalFactor: number;
}

export interface AerodynamicCoefficients {
    dragCoeff: number;
    liftCoeff: number;
}
