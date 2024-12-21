const { calculateAirDensity } = require('../../utils/environmental-utils');
const { BallFlightCalculator } = require('../../physics/ball-flight-calculator');

describe('Temperature Effect Calculations', () => {
    let calculator;

    beforeEach(() => {
        calculator = new BallFlightCalculator();
    });

    const standardState = {
        position: { x: 0, y: 100, z: 0 },
        velocity: { x: 150, y: 0, z: 0 },
        spin: 2500,
        time: 0
    };

    test('should increase distance in warmer temperatures', () => {
        const coldConditions = {
            temperature: 40,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0
        };

        const warmConditions = {
            ...coldConditions,
            temperature: 90
        };

        const coldDensity = calculateAirDensity(
            coldConditions.temperature,
            coldConditions.pressure,
            coldConditions.humidity,
            coldConditions.elevation
        );

        const warmDensity = calculateAirDensity(
            warmConditions.temperature,
            warmConditions.pressure,
            warmConditions.humidity,
            warmConditions.elevation
        );

        // Verify density decreases with temperature
        expect(warmDensity).toBeLessThan(coldDensity);

        const coldForces = calculator.calculateForces(standardState, coldConditions, coldDensity);
        const warmForces = calculator.calculateForces(standardState, warmConditions, warmDensity);

        // Warmer air should result in less drag (less negative x force)
        expect(Math.abs(warmForces.x)).toBeLessThan(Math.abs(coldForces.x));
    });

    test('should decrease distance in colder temperatures', () => {
        const standardConditions = {
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0
        };

        const coldConditions = {
            ...standardConditions,
            temperature: 32
        };

        const standardDensity = calculateAirDensity(
            standardConditions.temperature,
            standardConditions.pressure,
            standardConditions.humidity,
            standardConditions.elevation
        );

        const coldDensity = calculateAirDensity(
            coldConditions.temperature,
            coldConditions.pressure,
            coldConditions.humidity,
            coldConditions.elevation
        );

        // Verify density increases with cold
        expect(coldDensity).toBeGreaterThan(standardDensity);

        const standardForces = calculator.calculateForces(standardState, standardConditions, standardDensity);
        const coldForces = calculator.calculateForces(standardState, coldConditions, coldDensity);

        // Colder air should result in more drag (more negative x force)
        expect(Math.abs(coldForces.x)).toBeGreaterThan(Math.abs(standardForces.x));
    });

    test('should handle extreme temperatures appropriately', () => {
        const extremeHotConditions = {
            temperature: 130,  // Above valid range
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0
        };

        const extremeColdConditions = {
            temperature: -50,  // Below valid range
            pressure: 29.92,
            humidity: 50,
            windSpeed: 0,
            windDirection: 0,
            elevation: 0
        };

        // Should throw for temperatures above 120°F
        expect(() => {
            calculateAirDensity(
                extremeHotConditions.temperature,
                extremeHotConditions.pressure,
                extremeHotConditions.humidity,
                extremeHotConditions.elevation
            );
        }).toThrow('Temperature must be between -40°F and 120°F');

        // Should throw for temperatures below -40°F
        expect(() => {
            calculateAirDensity(
                extremeColdConditions.temperature,
                extremeColdConditions.pressure,
                extremeColdConditions.humidity,
                extremeColdConditions.elevation
            );
        }).toThrow('Temperature must be between -40°F and 120°F');
    });
});
