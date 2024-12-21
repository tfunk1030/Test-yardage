const { BallFlightCalculator } = require('../../src/physics/ball-flight-calculator');

describe('Ball Physics Tests', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    describe('Basic Trajectory', () => {
        const standardConditions = {
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0,
            groundHardness: 0.7
        };

        const standardClubData = {
            type: 'driver',
            loft: 10.5,
            spinFactor: 1.0,
            quality: 1.0
        };

        test('calculates basic trajectory correctly', () => {
            const initialConditions = {
                velocity: { x: 150, y: 30, z: 0 },
                spinRate: 2500
            };

            const trajectory = calculator.calculateTrajectory(
                initialConditions,
                standardConditions,
                standardClubData
            );

            // Verify trajectory starts at origin
            expect(trajectory[0].position.x).toBe(0);
            expect(trajectory[0].position.y).toBe(0);
            expect(trajectory[0].position.z).toBe(0);

            // Verify reasonable trajectory length
            expect(trajectory.length).toBeGreaterThan(10);

            // Verify ball comes down
            const finalPosition = trajectory[trajectory.length - 1].position;
            expect(finalPosition.y).toBeLessThanOrEqual(0.1);
        });

        test('handles wind effects correctly', () => {
            const initialConditions = {
                velocity: { x: 150, y: 30, z: 0 },
                spinRate: 2500
            };

            const windConditions = {
                ...standardConditions,
                windSpeed: 10,
                windDirection: 180  // headwind
            };

            const noWindTrajectory = calculator.calculateTrajectory(
                initialConditions,
                standardConditions,
                standardClubData
            );

            const windTrajectory = calculator.calculateTrajectory(
                initialConditions,
                windConditions,
                standardClubData
            );

            // Headwind should reduce total distance
            const noWindDistance = noWindTrajectory[noWindTrajectory.length - 1].position.x;
            const windDistance = windTrajectory[windTrajectory.length - 1].position.x;
            expect(windDistance).toBeLessThan(noWindDistance);
        });

        test('handles altitude effects correctly', () => {
            const initialConditions = {
                velocity: { x: 150, y: 30, z: 0 },
                spinRate: 2500
            };

            const altitudeConditions = {
                ...standardConditions,
                elevation: 5000  // Denver-like elevation
            };

            const seaLevelTrajectory = calculator.calculateTrajectory(
                initialConditions,
                standardConditions,
                standardClubData
            );

            const altitudeTrajectory = calculator.calculateTrajectory(
                initialConditions,
                altitudeConditions,
                standardClubData
            );

            // Higher altitude should result in longer distance
            const seaLevelDistance = seaLevelTrajectory[seaLevelTrajectory.length - 1].position.x;
            const altitudeDistance = altitudeTrajectory[altitudeTrajectory.length - 1].position.x;
            expect(altitudeDistance).toBeGreaterThan(seaLevelDistance);
        });
    });
});
