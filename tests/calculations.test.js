/**
 * Unit tests for core calculations
 */

import { calculateWindEffect, calculateWindAngle, calculateEffectiveWindSpeed } from '../src/calculations/wind-calculations.js';
import { calculateAltitudeEffect, calculateAltitudeEffects, calculateOxygenDensity, calculatePressureAtAltitude, calculateTemperatureAtAltitude } from '../src/calculations/altitude-calculations.js';
import { calculateAirDensity, calculateDewPoint, calculateAirDensityEffects, calculateVaporPressure } from '../src/calculations/air-density-calculations.js';
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

    test('calculateWindAngle converts direction strings correctly', () => {
        expect(calculateWindAngle('N')).toBe(0);
        expect(calculateWindAngle('NE')).toBe(45);
        expect(calculateWindAngle('E')).toBe(90);
        expect(calculateWindAngle('SE')).toBe(135);
        expect(calculateWindAngle('S')).toBe(180);
        expect(calculateWindAngle('SW')).toBe(225);
        expect(calculateWindAngle('W')).toBe(270);
        expect(calculateWindAngle('NW')).toBe(315);
        expect(calculateWindAngle('NNE')).toBe(22.5);
        expect(calculateWindAngle('ENE')).toBe(67.5);
        expect(calculateWindAngle('ESE')).toBe(112.5);
        expect(calculateWindAngle('SSE')).toBe(157.5);
        expect(calculateWindAngle('SSW')).toBe(202.5);
        expect(calculateWindAngle('WSW')).toBe(247.5);
        expect(calculateWindAngle('WNW')).toBe(292.5);
        expect(calculateWindAngle('NNW')).toBe(337.5);
    });

    test('calculateWindAngle handles invalid inputs', () => {
        expect(calculateWindAngle('INVALID')).toBe(0);
        expect(calculateWindAngle('')).toBe(0);
        expect(calculateWindAngle(null)).toBe(0);
        expect(calculateWindAngle(undefined)).toBe(0);
        expect(calculateWindAngle('n')).toBe(0); // Case insensitive
        expect(calculateWindAngle('NE ')).toBe(0); // No whitespace
    });

    test('calculateEffectiveWindSpeed adjusts for elevation', () => {
        expect(calculateEffectiveWindSpeed(10, 0)).toBe(10); // No elevation
        expect(calculateEffectiveWindSpeed(10, 5000)).toBeCloseTo(10.75, 2); // Mid elevation
        expect(calculateEffectiveWindSpeed(10, 10000)).toBeCloseTo(11.5, 2); // High elevation
        expect(calculateEffectiveWindSpeed(10, 20000)).toBeCloseTo(13, 2); // Max elevation effect
    });

    test('calculateEffectiveWindSpeed handles invalid inputs', () => {
        expect(calculateEffectiveWindSpeed(0, 1000)).toBe(0);
        expect(calculateEffectiveWindSpeed(-10, 1000)).toBeCloseTo(10.15, 2); // Handles negative speeds
        expect(calculateEffectiveWindSpeed('10', 1000)).toBeCloseTo(10.15, 2); // Handles string numbers
        expect(calculateEffectiveWindSpeed(null, 1000)).toBe(0);
        expect(calculateEffectiveWindSpeed(undefined, 1000)).toBe(0);
        expect(calculateEffectiveWindSpeed('invalid', 1000)).toBe(0);
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

    test('calculateAltitudeEffects returns comprehensive effects', () => {
        const effects = calculateAltitudeEffects(5000, { initialVelocity: 150, spinRate: 2500 });
        expect(effects).toHaveProperty('distance');
        expect(effects).toHaveProperty('apex');
        expect(effects).toHaveProperty('spinDecay');
        expect(effects.distance).toBeGreaterThan(1.0);
        expect(effects.apex).toBeGreaterThan(1.0);
        expect(effects.spinDecay).toBeLessThan(1.0);
    });

    test('calculateAltitudeEffects handles extreme altitudes', () => {
        const lowEffects = calculateAltitudeEffects(0, { initialVelocity: 150, spinRate: 2500 });
        expect(lowEffects.distance).toBe(1.0);
        expect(lowEffects.apex).toBe(1.0);
        expect(lowEffects.spinDecay).toBe(1.0);

        const highEffects = calculateAltitudeEffects(15000, { initialVelocity: 150, spinRate: 2500 });
        expect(highEffects.distance).toBeGreaterThan(1.2);
        expect(highEffects.apex).toBeGreaterThan(1.1);
        expect(highEffects.spinDecay).toBeLessThan(0.95);
    });

    test('calculateOxygenDensity decreases with altitude', () => {
        expect(calculateOxygenDensity(0)).toBe(1.0);
        expect(calculateOxygenDensity(5000)).toBeCloseTo(0.83, 2);
        expect(calculateOxygenDensity(10000)).toBeCloseTo(0.69, 2);
        expect(calculateOxygenDensity(15000)).toBeCloseTo(0.57, 2);
    });

    test('calculateOxygenDensity handles invalid inputs', () => {
        expect(calculateOxygenDensity('invalid')).toBe(1.0);
        expect(calculateOxygenDensity(null)).toBe(1.0);
        expect(calculateOxygenDensity(undefined)).toBe(1.0);
        expect(calculateOxygenDensity(-1000)).toBeCloseTo(1.04, 2);
    });

    test('calculatePressureAtAltitude decreases with altitude', () => {
        expect(calculatePressureAtAltitude(0)).toBe(29.92);
        expect(calculatePressureAtAltitude(5000)).toBeCloseTo(24.86, 2);
        expect(calculatePressureAtAltitude(10000)).toBeCloseTo(20.67, 2);
        expect(calculatePressureAtAltitude(15000)).toBeCloseTo(17.18, 2);
    });

    test('calculatePressureAtAltitude handles invalid inputs', () => {
        expect(calculatePressureAtAltitude('invalid')).toBe(29.92);
        expect(calculatePressureAtAltitude(null)).toBe(29.92);
        expect(calculatePressureAtAltitude(undefined)).toBe(29.92);
        expect(calculatePressureAtAltitude(-1000)).toBeCloseTo(31.05, 2);
    });

    test('calculateTemperatureAtAltitude decreases with altitude', () => {
        expect(calculateTemperatureAtAltitude(70, 0)).toBe(70);
        expect(calculateTemperatureAtAltitude(70, 5000)).toBeCloseTo(52.15, 2);
        expect(calculateTemperatureAtAltitude(70, 10000)).toBeCloseTo(34.3, 2);
        expect(calculateTemperatureAtAltitude(70, 15000)).toBeCloseTo(16.45, 2);
    });

    test('calculateTemperatureAtAltitude handles invalid inputs', () => {
        expect(calculateTemperatureAtAltitude('invalid', 5000)).toBe(NaN);
        expect(calculateTemperatureAtAltitude(70, 'invalid')).toBe(70);
        expect(calculateTemperatureAtAltitude(70, null)).toBe(70);
        expect(calculateTemperatureAtAltitude(70, undefined)).toBe(70);
        expect(calculateTemperatureAtAltitude(70, -1000)).toBeCloseTo(73.57, 2);
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

    describe('calculateVaporPressure', () => {
        test('calculates vapor pressure correctly', () => {
            expect(calculateVaporPressure(32)).toBeCloseTo(0.18, 2); // Freezing point
            expect(calculateVaporPressure(59)).toBeCloseTo(0.49, 2); // Standard temp
            expect(calculateVaporPressure(90)).toBeCloseTo(1.38, 2); // Hot day
            expect(calculateVaporPressure(120)).toBeCloseTo(3.49, 2); // Extreme heat
        });

        test('handles temperature range appropriately', () => {
            expect(calculateVaporPressure(-40)).toBeCloseTo(0.005, 3); // Extreme cold
            expect(calculateVaporPressure(0)).toBeCloseTo(0.09, 2); // Very cold
            expect(calculateVaporPressure(100)).toBeCloseTo(1.93, 2); // Very hot
        });

        test('handles invalid inputs', () => {
            expect(calculateVaporPressure('invalid')).toBe(NaN);
            expect(calculateVaporPressure(null)).toBe(NaN);
            expect(calculateVaporPressure(undefined)).toBe(NaN);
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

        test('handles extreme conditions', () => {
            const coldConditions = {
                temp: -30,
                pressure: 31,
                humidity: 20
            };
            const coldEffects = calculateAirDensityEffects(coldConditions, { initialVelocity: 150, spinRate: 2500 });
            expect(coldEffects.density).toBeGreaterThan(1.2);
            expect(coldEffects.spinEffect).toBeGreaterThan(1.1);
            expect(coldEffects.dragEffect).toBeGreaterThan(1.1);

            const hotConditions = {
                temp: 110,
                pressure: 29.92,
                humidity: 90
            };
            const hotEffects = calculateAirDensityEffects(hotConditions, { initialVelocity: 150, spinRate: 2500 });
            expect(hotEffects.density).toBeLessThan(0.9);
            expect(hotEffects.spinEffect).toBeLessThan(0.95);
            expect(hotEffects.dragEffect).toBeLessThan(0.95);
        });

        test('handles missing ball data properties gracefully', () => {
            const conditions = {
                temp: 70,
                pressure: 29.92,
                humidity: 50
            };
            const effects = calculateAirDensityEffects(conditions, {});
            expect(effects).toHaveProperty('density');
            expect(effects).toHaveProperty('dewPoint');
            expect(effects).toHaveProperty('spinEffect');
            expect(effects).toHaveProperty('dragEffect');
        });

        test('validates conditions object structure', () => {
            const ballData = { initialVelocity: 150, spinRate: 2500 };
            
            expect(() => calculateAirDensityEffects(null, ballData))
                .toThrow('Conditions must be a valid object');
            
            expect(() => calculateAirDensityEffects({}, ballData))
                .toThrow('Conditions must include temp, pressure, and humidity');
            
            expect(() => calculateAirDensityEffects({ temp: 70, humidity: 50 }, ballData))
                .toThrow('Conditions must include temp, pressure, and humidity');
            
            expect(() => calculateAirDensityEffects({ temp: 70, pressure: 29.92 }, ballData))
                .toThrow('Conditions must include temp, pressure, and humidity');
        });

        test('validates ball data object', () => {
            const conditions = {
                temp: 70,
                pressure: 29.92,
                humidity: 50
            };
            
            expect(() => calculateAirDensityEffects(conditions, null))
                .toThrow('Ball data must be a valid object');
            
            expect(() => calculateAirDensityEffects(conditions, 'invalid'))
                .toThrow('Ball data must be a valid object');
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
