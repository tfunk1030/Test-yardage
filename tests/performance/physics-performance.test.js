const { BallFlightCalculator } = require('../../src/physics/ball-flight-calculator');

describe('Physics Performance Tests', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    test('calculates trajectory efficiently', () => {
        const initialConditions = {
            velocity: { x: 150, y: 30, z: 0 },
            spinRate: 2500
        };

        const environmentalConditions = {
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0,
            groundHardness: 0.7
        };

        const clubData = {
            type: 'driver',
            loft: 10.5,
            spinFactor: 1.0,
            quality: 1.0
        };

        const startTime = process.hrtime();

        // Calculate trajectory multiple times to measure performance
        for (let i = 0; i < 100; i++) {
            const trajectory = calculator.calculateTrajectory(
                initialConditions,
                environmentalConditions,
                clubData
            );
            expect(trajectory.length).toBeGreaterThan(0);
        }

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const totalTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
        const timePerCalculation = totalTimeMs / 100;

        // Each calculation should take less than 50ms
        expect(timePerCalculation).toBeLessThan(50);
    });

    test('handles wind calculations efficiently', () => {
        const state = {
            position: { x: 0, y: 100, z: 0 },
            velocity: { x: 150, y: 0, z: 0 },
            spin: 2500,
            time: 0
        };

        const conditions = {
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 10,
            windDirection: 180,
            elevation: 0
        };

        const startTime = process.hrtime();

        // Calculate forces multiple times to measure performance
        for (let i = 0; i < 1000; i++) {
            const forces = calculator.calculateForces(state, conditions, 1.0);
            expect(forces.x).toBeDefined();
            expect(forces.y).toBeDefined();
            expect(forces.z).toBeDefined();
        }

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const totalTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
        const timePerCalculation = totalTimeMs / 1000;

        // Each force calculation should take less than 1ms
        expect(timePerCalculation).toBeLessThan(1);
    });
});
