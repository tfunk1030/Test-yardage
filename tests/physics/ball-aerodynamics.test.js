const { BallFlightCalculator } = require('../../src/physics/ball-flight-calculator');

describe('Ball Aerodynamics Tests', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    describe('Aerodynamic Forces', () => {
        const standardState = {
            position: { x: 0, y: 100, z: 0 },
            velocity: { x: 150, y: 0, z: 0 },
            spin: 2500,
            time: 0
        };

        const standardConditions = {
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0
        };

        test('calculates all forces correctly for standard conditions', () => {
            const forces = calculator.calculateForces(standardState, standardConditions, 1.0);

            // Verify drag force exists and is reasonable
            expect(Math.abs(forces.x)).toBeGreaterThan(0);
            expect(Math.abs(forces.x)).toBeLessThan(0.5);

            // Verify lift force exists and is positive due to backspin
            expect(forces.y).toBeGreaterThan(0);

            // Verify no lateral forces without wind
            expect(Math.abs(forces.z)).toBeLessThan(0.1);
        });

        test('forces scale quadratically with velocity', () => {
            const baseForces = calculator.calculateForces(standardState, standardConditions, 1.0);

            const doubleVelocityState = {
                ...standardState,
                velocity: {
                    x: standardState.velocity.x * 2,
                    y: standardState.velocity.y * 2,
                    z: standardState.velocity.z * 2
                }
            };

            const doubleVelocityForces = calculator.calculateForces(
                doubleVelocityState,
                standardConditions,
                1.0
            );

            // Forces should scale approximately with velocity squared
            const expectedRatio = 4.0; // 2^2
            const actualRatio = Math.abs(doubleVelocityForces.x / baseForces.x);
            expect(Math.abs(actualRatio - expectedRatio)).toBeLessThan(0.5);
        });

        test('wind affects relative velocity correctly', () => {
            const windConditions = {
                ...standardConditions,
                windSpeed: 10,
                windDirection: 180  // headwind
            };

            const forcesWithWind = calculator.calculateForces(standardState, windConditions, 1.0);
            const forcesNoWind = calculator.calculateForces(standardState, standardConditions, 1.0);

            // Headwind should increase effective drag
            const dragWithWind = Math.abs(forcesWithWind.x);
            const dragNoWind = Math.abs(forcesNoWind.x);
            expect(dragWithWind).toBeGreaterThan(dragNoWind);

            // Test tailwind
            const tailwindConditions = {
                ...standardConditions,
                windSpeed: 10,
                windDirection: 0
            };

            const forcesWithTailwind = calculator.calculateForces(standardState, tailwindConditions, 1.0);
            expect(Math.abs(forcesWithTailwind.x)).toBeLessThan(dragNoWind);
        });
    });
});
