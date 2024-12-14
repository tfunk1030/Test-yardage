/**
 * Unit tests for core calculations
 */

import { calculateWindEffect } from '../src/calculation../calculations/wind-calculations.js';
import { calculateAltitudeEffect } from '../src/calculations/altitude-calculations.js';
import { calculateAirDensity, calculateDewPoint, calculateAirDensityEffects } from '../src/calculations/air-density-calculations.js';
import { PGA_CLUB_DATA, PARAMETER_RANGES } from '../constants/club-data.js';

describe('Wind Calculations', () => {
    test('headwind should decrease distance', () => {
        const effect = calculateWindEffect(10, 0, 100, 30);
        expect(effect.distance).toBeLessThan(0);
        expect(effect.lateral).toBe(0);
    });

    test('tailwind should increase distance', () => {
        const effect = calculateWindEffect(10, 180, 100, 30);
        expect(effect.distance).toBeGreaterThan(0);
        expect(effect.lateral).toBe(0);
    });

    test('crosswind should affect lateral movement', () => {
        const leftWind = calculateWindEffect(10, 90, 100, 30);
        expect(leftWind.lateral).toBeLessThan(0);
        expect(Math.abs(leftWind.distance)).toBeLessThan(Math.abs(leftWind.lateral));

        const rightWind = calculateWindEffect(10, 270, 100, 30);
        expect(rightWind.lateral).toBeGreaterThan(0);
        expect(Math.abs(rightWind.distance)).toBeLessThan(Math.abs(rightWind.lateral));
    });

    test('shot height should affect wind impact', () => {
        const lowShot = calculateWindEffect(10, 90, 100, 20);
        const highShot = calculateWindEffect(10, 90, 100, 40);
        expect(Math.abs(highShot.lateral)).toBeGreaterThan(Math.abs(lowShot.lateral));
    });

    test('wind speed should proportionally affect impact', () => {
        const lightWind = calculateWindEffect(5, 90, 100, 30);
        const strongWind = calculateWindEffect(15, 90, 100, 30);
        expect(Math.abs(strongWind.lateral)).toBeGreaterThan(Math.abs(lightWind.lateral) * 2);
    });

    test('throws error for invalid inputs', () => {
        expect(() => calculateWindEffect('invalid', 0, 100, 30)).toThrow('Wind speed must be a valid number');
        expect(() => calculateWindEffect(-1, 0, 100, 30)).toThrow('Wind speed must be non-negative');
        expect(() => calculateWindEffect(10, 'invalid', 100, 30)).toThrow('Wind direction must be a valid number');
        expect(() => calculateWindEffect(10, -1, 100, 30)).toThrow('Wind direction must be between 0 and 360 degrees');
        expect(() => calculateWindEffect(10, 361, 100, 30)).toThrow('Wind direction must be between 0 and 360 degrees');
        expect(() => calculateWindEffect(10, 0, 'invalid', 30)).toThrow('Shot distance must be a valid number');
        expect(() => calculateWindEffect(10, 0, -1, 30)).toThrow('Shot distance must be positive');
        expect(() => calculateWindEffect(10, 0, 100, 'invalid')).toThrow('Shot height must be a valid number');
        expect(() => calculateWindEffect(10, 0, 100, -1)).toThrow('Shot height must be non-negative');
    });
});

describe('Altitude Calculations', () => {
    test('sea level should have no effect', () => {
        expect(calculateAltitudeEffect(0)).toBe(1.0);
    });

    test('high altitude should increase distance', () => {
        const effect = calculateAltitudeEffect(5000);
        expect(effect).toBeGreaterThan(1.0);
    });

    test('altitude effect should be progressive', () => {
        const low = calculateAltitudeEffect(1000);
        const medium = calculateAltitudeEffect(3000);
        const high = calculateAltitudeEffect(5000);
        expect(medium).toBeGreaterThan(low);
        expect(high).toBeGreaterThan(medium);
    });

    test('altitude effect should consider air density', () => {
        const effect = calculateAltitudeEffect(10000);
        expect(effect).toBeGreaterThan(1.0);
        expect(effect).toBeLessThan(1.5); // Reasonable upper limit
    });

    test('altitude validation should be strict', () => {
        expect(() => calculateAltitudeEffect('invalid')).toThrow('Altitude must be a valid number');
        expect(() => calculateAltitudeEffect(-100)).toThrow('Altitude must be non-negative');
        expect(() => calculateAltitudeEffect(25000)).toThrow('Altitude must not exceed 20000 feet');
    });

    test('handles extreme altitudes', () => {
        expect(calculateAltitudeEffect(15000)).toBeGreaterThan(1.2);
        expect(calculateAltitudeEffect(19999)).toBeLessThan(1.5);
    });

    test('altitude effect precision', () => {
        const effect = calculateAltitudeEffect(5280); // One mile
        expect(effect).toBeCloseTo(1.06, 2);
    });
});

describe('Air Density Calculations', () => {
    describe('calculateAirDensity', () => {
        test('returns 1.0 for standard conditions', () => {
            expect(calculateAirDensity(59, 29.92, 0)).toBe(1.0);
        });

        test('handles extreme cold conditions', () => {
            const density = calculateAirDensity(-30, 30.5, 20);
            expect(density).toBeGreaterThan(1.2);
            expect(density).toBeLessThan(1.4);
        });

        test('handles hot and humid conditions', () => {
            const density = calculateAirDensity(95, 29.92, 80);
            expect(density).toBeGreaterThan(0.8);
            expect(density).toBeLessThan(1.0);
        });

        test('throws error for invalid temperature', () => {
            expect(() => calculateAirDensity('invalid', 29.92, 50)).toThrow('Temperature must be a valid number');
            expect(() => calculateAirDensity(-50, 29.92, 50)).toThrow('Temperature must be between -40°F and 120°F');
            expect(() => calculateAirDensity(130, 29.92, 50)).toThrow('Temperature must be between -40°F and 120°F');
        });

        test('throws error for invalid pressure', () => {
            expect(() => calculateAirDensity(70, 'invalid', 50)).toThrow('Pressure must be a valid number');
            expect(() => calculateAirDensity(70, 24, 50)).toThrow('Pressure must be between 25 and 32 inHg');
            expect(() => calculateAirDensity(70, 33, 50)).toThrow('Pressure must be between 25 and 32 inHg');
        });

        test('throws error for invalid humidity', () => {
            expect(() => calculateAirDensity(70, 29.92, 'invalid')).toThrow('Humidity must be a valid number');
            expect(() => calculateAirDensity(70, 29.92, -1)).toThrow('Humidity must be between 0% and 100%');
            expect(() => calculateAirDensity(70, 29.92, 101)).toThrow('Humidity must be between 0% and 100%');
        });
    });

    describe('calculateDewPoint', () => {
        test('calculates dew point correctly', () => {
            expect(calculateDewPoint(70, 50)).toBeCloseTo(50.48, 1);
            expect(calculateDewPoint(90, 80)).toBeCloseTo(83.62, 1);
            expect(calculateDewPoint(32, 100)).toBeCloseTo(32, 1);
            expect(calculateDewPoint(100, 20)).toBeCloseTo(54.44, 1);
        });

        test('handles extreme conditions', () => {
            expect(calculateDewPoint(-30, 20)).toBeLessThan(-30);
            expect(calculateDewPoint(100, 90)).toBeLessThan(100);
            expect(calculateDewPoint(0, 100)).toBeCloseTo(0, 1);
        });

        test('throws error for invalid inputs', () => {
            expect(() => calculateDewPoint('invalid', 50)).toThrow('Temperature must be a valid number');
            expect(() => calculateDewPoint(70, 'invalid')).toThrow('Humidity must be a valid number');
            expect(() => calculateDewPoint(-50, 50)).toThrow('Temperature must be between -40°F and 120°F');
            expect(() => calculateDewPoint(130, 50)).toThrow('Temperature must be between -40°F and 120°F');
            expect(() => calculateDewPoint(70, -1)).toThrow('Humidity must be between 0% and 100%');
            expect(() => calculateDewPoint(70, 101)).toThrow('Humidity must be between 0% and 100%');
        });
    });

    describe('calculateAirDensityEffects', () => {
        const conditions = {
            temp: 75,
            pressure: 29.92,
            humidity: 60
        };
        const ballData = {
            initialVelocity: 150,
            spinRate: 2500
        };

        test('calculates all effects correctly', () => {
            const effects = calculateAirDensityEffects(conditions, ballData);
            expect(effects).toHaveProperty('density');
            expect(effects).toHaveProperty('dewPoint');
            expect(effects).toHaveProperty('spinEffect');
            expect(effects).toHaveProperty('dragEffect');
            expect(effects.density).toBeGreaterThan(0.9);
            expect(effects.density).toBeLessThan(1.1);
            expect(effects.spinEffect).toBeGreaterThan(0.8);
            expect(effects.spinEffect).toBeLessThan(1.2);
            expect(effects.dragEffect).toBeGreaterThan(0.9);
            expect(effects.dragEffect).toBeLessThan(1.1);
        });

        test('handles standard conditions', () => {
            const standardConditions = {
                temp: 59,
                pressure: 29.92,
                humidity: 0
            };
            const effects = calculateAirDensityEffects(standardConditions, ballData);
            expect(effects.density).toBe(1.0);
            expect(effects.dragEffect).toBe(1.0);
        });

        test('throws error for invalid inputs', () => {
            expect(() => calculateAirDensityEffects(null, ballData)).toThrow('Conditions must be a valid object');
            expect(() => calculateAirDensityEffects(conditions, null)).toThrow('Ball data must be a valid object');
            expect(() => calculateAirDensityEffects({}, ballData)).toThrow('Conditions must include temp, pressure, and humidity');
            expect(() => calculateAirDensityEffects({ temp: 70, humidity: 50 }, ballData)).toThrow('Conditions must include temp, pressure, and humidity');
        });

        test('handles extreme conditions', () => {
            const extremeConditions = {
                temp: -30,
                pressure: 31,
                humidity: 100
            };
            const effects = calculateAirDensityEffects(extremeConditions, ballData);
            expect(effects.density).toBeGreaterThan(1.0);
            expect(effects.spinEffect).toBeGreaterThan(1.0);
            expect(effects.dragEffect).toBeGreaterThan(1.0);
        });
    });
});

describe('Integration Tests', () => {
    test('driver shot in standard conditions', () => {
        // Test a driver shot at sea level with no wind
        const windEffect = calculateWindEffect(0, 0, 100, 30);
        const altitudeEffect = calculateAltitudeEffect(0);
        const airDensity = calculateAirDensity(59, 29.92, 50);
        
        expect(windEffect.distance).toBe(0);
        expect(windEffect.lateral).toBe(0);
        expect(altitudeEffect).toBe(1.0);
        expect(airDensity).toBeCloseTo(1.0, 2);
    });
    
    test('extreme conditions should stay within reasonable bounds', () => {
        // Test extreme wind
        const extremeWind = calculateWindEffect(50, 0, 100, 30);
        expect(Math.abs(extremeWind.distance)).toBeLessThanOrEqual(0.5); // Max 50% effect
        
        // Test extreme altitude
        const extremeAltitude = calculateAltitudeEffect(10000);
        expect(extremeAltitude).toBeLessThanOrEqual(1.5); // Max 50% increase
        
        // Test extreme temperature
        const extremeTemp = calculateAirDensity(110, 29.92, 0);
        expect(extremeTemp).toBeGreaterThan(0.5); // Should not reduce density too much
    });
    
    test('parameter ranges should be respected', () => {
        // Test wind speed validation
        expect(() => calculateWindEffect(-10, 0, 100, 30)).toThrow();
        expect(() => calculateWindEffect(60, 0, 100, 30)).toThrow();
        
        // Test altitude validation
        expect(() => calculateAltitudeEffect(-1000)).toThrow();
        expect(() => calculateAltitudeEffect(20000)).toThrow();
        
        // Test air density validation
        expect(() => calculateAirDensity(-50, 29.92, 0)).toThrow();
        expect(() => calculateAirDensity(59, 20, 0)).toThrow();
        expect(() => calculateAirDensity(59, 29.92, 150)).toThrow();
    });
    
    test('parameter ranges should be respected', () => {
        Object.entries(PGA_CLUB_DATA).forEach(([club, data]) => {
            // Check ball speed
            expect(data.ballSpeed).toBeGreaterThanOrEqual(PARAMETER_RANGES.ballSpeed.min);
            expect(data.ballSpeed).toBeLessThanOrEqual(PARAMETER_RANGES.ballSpeed.max);
            
            // Check spin rate
            expect(data.spinRate).toBeGreaterThanOrEqual(PARAMETER_RANGES.spinRate.min);
            expect(data.spinRate).toBeLessThanOrEqual(PARAMETER_RANGES.spinRate.max);
            
            // Check launch angle
            expect(data.launchAngle).toBeGreaterThanOrEqual(PARAMETER_RANGES.launchAngle.min);
            expect(data.launchAngle).toBeLessThanOrEqual(PARAMETER_RANGES.launchAngle.max);
        });
    });
});
