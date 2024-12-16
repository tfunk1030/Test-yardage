import { 
    calculateWindEffect, 
    calculateAltitudeEffect, 
    calculateAirDensityRatio 
} from '../src/calculations/core-calculations.js';

describe('Core Calculations', () => {
    describe('Wind Effect Tests', () => {
        const windTests = [
            { speed: 10, dir: 'N', desc: '10mph headwind', 
              expectedDistance: -0.065, expectedLateral: 0 },
            { speed: 10, dir: 'S', desc: '10mph tailwind', 
              expectedDistance: 0.065, expectedLateral: 0 },
            { speed: 15, dir: 'E', desc: '15mph crosswind', 
              expectedDistance: 0, expectedLateral: 0.068 }
        ];

        test.each(windTests)('$desc calculations', ({ speed, dir, expectedDistance, expectedLateral }) => {
            const result = calculateWindEffect(speed, dir);
            expect(result.distanceEffect).toBeCloseTo(expectedDistance, 3);
            expect(result.lateralEffect).toBeCloseTo(expectedLateral, 3);
        });
    });

    describe('Altitude Effect Tests', () => {
        const altitudeTests = [
            { alt: 0, desc: 'Sea Level', expectedEffect: 0 },
            { alt: 5280, desc: 'Denver', expectedEffect: 0.117 },
            { alt: 7350, desc: 'Mexico City', expectedEffect: 0.166 }
        ];

        test.each(altitudeTests)('$desc calculations', ({ alt, expectedEffect }) => {
            const result = calculateAltitudeEffect(alt);
            expect(result.total - 1).toBeCloseTo(expectedEffect, 3);
        });
    });

    describe('Air Density Tests', () => {
        const densityTests = [
            { 
                conditions: { temp: 59, pressure: 29.92, humidity: 50 },
                desc: 'Standard Conditions',
                expected: 1.000
            },
            { 
                conditions: { temp: 90, pressure: 29.92, humidity: 80 },
                desc: 'Hot & Humid',
                expected: 0.969
            },
            { 
                conditions: { temp: 30, pressure: 29.92, humidity: 20 },
                desc: 'Cold & Dry',
                expected: 1.032
            }
        ];

        test.each(densityTests)('$desc calculations', ({ conditions, expected }) => {
            const result = calculateAirDensityRatio(conditions);
            expect(result).toBeCloseTo(expected, 3);
        });
    });
});
