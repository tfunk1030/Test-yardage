const { calculateDewPoint } = require('../../src/utils/environmental-utils');

describe('Dew Point Calculations', () => {
    test('calculates dew point correctly at standard conditions', () => {
        const dewPoint = calculateDewPoint(70, 50);
        // At 70°F and 50% humidity, dew point should be around 51°F
        expect(dewPoint).toBe(51);
    });

    test('handles high temperature and humidity', () => {
        const dewPoint = calculateDewPoint(90, 80);
        // At 90°F and 80% humidity, dew point should be around 82°F
        expect(dewPoint).toBe(82);
    });

    test('handles low temperature and humidity', () => {
        const dewPoint = calculateDewPoint(32, 30);
        // At 32°F and 30% humidity, dew point should be around 4°F
        expect(dewPoint).toBe(4);
    });

    test('throws error for invalid temperature', () => {
        expect(() => calculateDewPoint(-50, 50)).toThrow('Temperature must be between -40°F and 120°F');
        expect(() => calculateDewPoint(130, 50)).toThrow('Temperature must be between -40°F and 120°F');
    });

    test('throws error for invalid humidity', () => {
        expect(() => calculateDewPoint(70, -10)).toThrow('Humidity must be a valid percentage between 0 and 100');
        expect(() => calculateDewPoint(70, 110)).toThrow('Humidity must be a valid percentage between 0 and 100');
        expect(() => calculateDewPoint(70, NaN)).toThrow('Humidity must be a valid percentage between 0 and 100');
    });

    test('handles extreme but valid conditions', () => {
        // Test at temperature extremes
        expect(() => calculateDewPoint(-40, 50)).not.toThrow();
        expect(() => calculateDewPoint(120, 50)).not.toThrow();
        
        // Test at humidity extremes
        expect(() => calculateDewPoint(70, 0)).not.toThrow();
        expect(() => calculateDewPoint(70, 100)).not.toThrow();
    });
});
