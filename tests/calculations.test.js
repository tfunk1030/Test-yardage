const { BallFlightCalculator } = require('../src/physics/ball-flight-calculator');
const { calculateAirDensity } = require('../src/utils/environmental-utils');

describe('Core Calculations', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    describe('Wind Effect Tests', () => {
        const standardState = {
            position: { x: 0, y: 100, z: 0 },
            velocity: { x: 150, y: 0, z: 0 },
            spin: 2500,
            time: 0
        };

        test('10mph headwind calculations', () => {
            const conditions = {
                temperature: 70,
                pressure: 29.92,
                humidity: 50,
                windSpeed: 10,
                windDirection: 180,  // headwind
                elevation: 0
            };

            const forces = calculator.calculateForces(standardState, conditions, 1.0);
            expect(Math.abs(forces.x)).toBeGreaterThan(0);
            expect(forces.x).toBeLessThan(0); // Headwind should produce negative x force
        });

        test('10mph tailwind calculations', () => {
            const conditions = {
                temperature: 70,
                pressure: 29.92,
                humidity: 50,
                windSpeed: 10,
                windDirection: 0,  // tailwind
                elevation: 0
            };

            const forces = calculator.calculateForces(standardState, conditions, 1.0);
            
            // Test relative velocity effects
            const noWindConditions = { ...conditions, windSpeed: 0 };
            const noWindForces = calculator.calculateForces(standardState, noWindConditions, 1.0);
            
            // Tailwind should reduce drag compared to no wind
            expect(Math.abs(forces.x)).toBeLessThan(Math.abs(noWindForces.x));
        });

        test('15mph crosswind calculations', () => {
            const conditions = {
                temperature: 70,
                pressure: 29.92,
                humidity: 50,
                windSpeed: 15,
                windDirection: 90,  // crosswind
                elevation: 0
            };

            const forces = calculator.calculateForces(standardState, conditions, 1.0);
            expect(Math.abs(forces.z)).toBeGreaterThan(0);
        });
    });

    describe('Air Density Tests', () => {
        test('Standard Conditions calculations', () => {
            const density = calculateAirDensity(70, 29.92, 50, 0);
            expect(density).toBeCloseTo(1.0, 2);
        });

        test('Hot & Humid calculations', () => {
            const density = calculateAirDensity(95, 29.92, 80, 0);
            expect(density).toBeLessThan(1.0);
        });

        test('Cold & Dry calculations', () => {
            const density = calculateAirDensity(32, 29.92, 20, 0);
            expect(density).toBeGreaterThan(1.0);
        });

        test('Altitude Effect calculations', () => {
            const seaLevel = calculateAirDensity(70, 29.92, 50, 0);
            const altitude = calculateAirDensity(70, 29.92, 50, 5000);
            expect(altitude).toBeLessThan(seaLevel);
        });
    });

    describe('Integration Tests', () => {
        test('trajectory with wind and altitude', () => {
            const initialConditions = {
                velocity: { x: 150, y: 30, z: 0 },
                spinRate: 2500
            };

            const environmentalConditions = {
                temperature: 70,
                pressure: 29.92,
                humidity: 50,
                windSpeed: 10,
                windDirection: 180,  // headwind
                elevation: 5000,
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

            // Basic validation
            expect(trajectory.length).toBeGreaterThan(10);
            expect(trajectory[0].position.y).toBe(0);
            expect(trajectory[trajectory.length - 1].position.y).toBeLessThanOrEqual(0.1);

            // Wind effect validation
            const noWindTrajectory = calculator.calculateTrajectory(
                initialConditions,
                { ...environmentalConditions, windSpeed: 0 },
                clubData
            );

            // Headwind should reduce distance
            expect(trajectory[trajectory.length - 1].position.x)
                .toBeLessThan(noWindTrajectory[noWindTrajectory.length - 1].position.x);
        });
    });
});
