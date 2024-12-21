import { ClubType } from '../types/club';

interface Vector3 {
    x: number;
    y: number;
    z: number;
}

interface TrajectoryPoint {
    position: Vector3;
    velocity: Vector3;
    time: number;
}

interface InitialConditions {
    velocity: Vector3;
    spinRate: number;
}

interface EnvironmentalConditions {
    temperature: number;
    pressure: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    elevation: number;
}

interface ClubData {
    type: ClubType;
    loft: number;
    spinFactor: number;
}

export class BallFlightCalculator {
    private readonly g = 9.81; // Gravity in m/s^2
    private readonly rho = 1.225; // Air density at sea level in kg/m^3
    private readonly Cd = 0.47; // Drag coefficient
    private readonly Cl = 0.21; // Lift coefficient
    private readonly dt = 0.001; // Time step in seconds
    private readonly maxTime = 15; // Maximum flight time in seconds
    private readonly ballMass = 0.0459; // Mass of a golf ball in kg
    private readonly ballRadius = 0.02135; // Radius of a golf ball in meters
    private readonly ballArea = Math.PI * Math.pow(this.ballRadius, 2);

    calculateTrajectory(
        initialConditions: InitialConditions,
        environmentalConditions: EnvironmentalConditions,
        clubData: ClubData
    ): TrajectoryPoint[] {
        const trajectory: TrajectoryPoint[] = [];
        let position: Vector3 = { x: 0, y: 0, z: 0 };
        let velocity = { ...initialConditions.velocity };
        let time = 0;

        // Convert units to metric
        const loftRadians = (clubData.loft * Math.PI) / 180;
        const speed = Math.sqrt(
            velocity.x * velocity.x + velocity.y * velocity.y + velocity.z * velocity.z
        );
        
        // Apply club loft to initial velocity if velocity.y is 0 or negative
        if (velocity.y <= 0) {
            const vx = speed * Math.cos(loftRadians);
            const vy = speed * Math.sin(loftRadians);
            velocity = { x: vx, y: vy, z: 0 };
        }

        // Convert environmental conditions to metric
        const temperature = (environmentalConditions.temperature - 32) * 5/9; // Convert to Celsius
        const elevation = environmentalConditions.elevation * 0.3048; // Convert to meters
        const windSpeed = environmentalConditions.windSpeed * 0.44704; // Convert to m/s
        const windRadians = (environmentalConditions.windDirection * Math.PI) / 180;

        // Adjust air density for elevation and temperature
        const pressureRatio = Math.exp(-elevation / 7400);
        const airDensity = this.rho * pressureRatio * (273.15 / (273.15 + temperature));

        // Add initial point
        trajectory.push({
            position: { ...position },
            velocity: { ...velocity },
            time
        });

        let groundImpactTime = -1;
        let groundImpactPosition: Vector3 | null = null;

        // Main trajectory calculation loop
        while (time < this.maxTime - this.dt) {
            // Calculate forces
            const relativeVelocity = {
                x: velocity.x - windSpeed * Math.cos(windRadians),
                y: velocity.y,
                z: velocity.z - windSpeed * Math.sin(windRadians)
            };

            const relativeSpeed = Math.sqrt(
                relativeVelocity.x * relativeVelocity.x +
                relativeVelocity.y * relativeVelocity.y +
                relativeVelocity.z * relativeVelocity.z
            );

            // Drag force
            const dragMagnitude = 0.5 * airDensity * this.Cd * this.ballArea * relativeSpeed * relativeSpeed / this.ballMass;
            const drag = {
                x: -dragMagnitude * relativeVelocity.x / relativeSpeed,
                y: -dragMagnitude * relativeVelocity.y / relativeSpeed,
                z: -dragMagnitude * relativeVelocity.z / relativeSpeed
            };

            // Magnus force (spin effect)
            const spinFactor = initialConditions.spinRate * clubData.spinFactor;
            const magnusMagnitude = 0.5 * airDensity * this.Cl * this.ballArea * spinFactor * relativeSpeed / this.ballMass;
            const magnus = {
                x: 0,
                y: magnusMagnitude,
                z: 0
            };

            // Calculate accelerations
            const ax = drag.x + magnus.x;
            const ay = drag.y + magnus.y - this.g;
            const az = drag.z + magnus.z;

            // Store previous position and velocity
            const prevPosition = { ...position };
            const prevVelocity = { ...velocity };

            // Update velocity using Euler integration
            velocity.x += ax * this.dt;
            velocity.y += ay * this.dt;
            velocity.z += az * this.dt;

            // Update position
            position.x += velocity.x * this.dt;
            position.y += velocity.y * this.dt;
            position.z += velocity.z * this.dt;

            time += this.dt;

            // Add point to trajectory (convert to yards)
            const currentPoint = {
                position: {
                    x: position.x * 1.0936,
                    y: position.y * 1.0936,
                    z: position.z * 1.0936
                },
                velocity: { ...velocity },
                time
            };

            // Check for ground impact
            if (currentPoint.position.y <= 0 && groundImpactTime === -1) {
                // Calculate exact ground impact time using linear interpolation
                const t = -prevPosition.y / (position.y - prevPosition.y) * this.dt;
                groundImpactTime = time - this.dt + t;
                groundImpactPosition = {
                    x: prevPosition.x + prevVelocity.x * t,
                    y: 0,
                    z: prevPosition.z + prevVelocity.z * t
                };

                // Add ground impact point
                trajectory.push({
                    position: {
                        x: groundImpactPosition.x * 1.0936,
                        y: 0,
                        z: groundImpactPosition.z * 1.0936
                    },
                    velocity: { ...velocity },
                    time: groundImpactTime
                });

                // Add one more point after ground impact
                const finalPosition = {
                    x: groundImpactPosition.x + velocity.x * this.dt,
                    y: 0,
                    z: groundImpactPosition.z + velocity.z * this.dt
                };

                trajectory.push({
                    position: {
                        x: finalPosition.x * 1.0936,
                        y: 0,
                        z: finalPosition.z * 1.0936
                    },
                    velocity: { ...velocity },
                    time: Math.min(groundImpactTime + this.dt, this.maxTime)
                });

                break; // Stop calculation after ground impact
            } else if (currentPoint.position.y > 0) {
                trajectory.push(currentPoint);
            }
        }

        return trajectory;
    }
}
