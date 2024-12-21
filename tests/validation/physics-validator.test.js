const { BallFlightCalculator } = require('../../src/physics/ball-flight-calculator');

describe('Physics Validation Tests', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    test('validates trajectory calculations', () => {
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

        const trajectory = calculator.calculateTrajectory(
            initialConditions,
            environmentalConditions,
            clubData
        );

        // Validate trajectory characteristics
        expect(trajectory.length).toBeGreaterThan(10);
        expect(trajectory[0].position.y).toBe(0);
        expect(trajectory[trajectory.length - 1].position.y).toBeLessThanOrEqual(0.1);

        // Check for reasonable maximum height
        const maxHeight = Math.max(...trajectory.map(p => p.position.y));
        expect(maxHeight).toBeGreaterThan(0);
        expect(maxHeight).toBeLessThan(200);

        // Check for reasonable total distance
        const totalDistance = trajectory[trajectory.length - 1].position.x;
        expect(totalDistance).toBeGreaterThan(200);
        expect(totalDistance).toBeLessThan(400);
    });

    test('validates force calculations', () => {
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
            windSpeed: 0,
            windDirection: 0,
            elevation: 0
        };

        const forces = calculator.calculateForces(state, conditions, 1.0);

        // Validate force magnitudes
        expect(Math.abs(forces.x)).toBeLessThan(1);
        expect(Math.abs(forces.y)).toBeLessThan(1);
        expect(Math.abs(forces.z)).toBeLessThan(1);

        // Drag force should be negative in x direction
        expect(forces.x).toBeLessThan(0);
    });
});
