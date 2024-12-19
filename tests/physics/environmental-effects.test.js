import {
    calculateAirDensityLayers,
    calculateDewPointEffect,
    calculatePressureTrendEffect,
    calculateGroundEffect,
    calculateBallCompressionEffect,
    calculateEnvironmentalEffects
} from '../../src/physics/environmental-effects.js';

describe('Environmental Effects Tests', () => {
    test('Air density layers decrease with altitude', () => {
        const layers = calculateAirDensityLayers(0, 70, 29.92);
        
        for (let i = 1; i < layers.length; i++) {
            expect(layers[i].density).toBeLessThan(layers[i-1].density);
            expect(layers[i].temperature).toBeLessThan(layers[i-1].temperature);
            expect(layers[i].pressure).toBeLessThan(layers[i-1].pressure);
        }
    });

    test('Dew point effect is stronger with higher humidity', () => {
        const lowHumidity = calculateDewPointEffect(70, 30);
        const highHumidity = calculateDewPointEffect(70, 90);
        
        expect(highHumidity).toBeLessThan(lowHumidity);
    });

    test('Pressure trend affects distance', () => {
        const risingPressure = calculatePressureTrendEffect(29.92, 0.1);
        const fallingPressure = calculatePressureTrendEffect(29.92, -0.1);
        
        expect(risingPressure).toBeGreaterThan(1);
        expect(fallingPressure).toBeLessThan(1);
    });

    test('Ground effect increases near surface', () => {
        const nearGround = calculateGroundEffect(5, 'driver');
        const farFromGround = calculateGroundEffect(30, 'driver');
        
        expect(nearGround).toBeGreaterThan(farFromGround);
        expect(farFromGround).toBeCloseTo(1, 2);
    });

    test('Ball compression changes with temperature', () => {
        const coldBall = calculateBallCompressionEffect(40, 90);
        const warmBall = calculateBallCompressionEffect(90, 90);
        
        expect(warmBall.adjustedCompression)
            .toBeGreaterThan(coldBall.adjustedCompression);
        expect(warmBall.speedFactor)
            .toBeGreaterThan(coldBall.speedFactor);
    });

    test('Combined environmental effects are reasonable', () => {
        const effects = calculateEnvironmentalEffects({
            altitude: 1000,
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            pressureTrend: 0,
            ballCompression: 90,
            height: 10,
            clubType: 'driver'
        });
        
        expect(effects.totalEffect).toBeGreaterThan(0.9);
        expect(effects.totalEffect).toBeLessThan(1.1);
        expect(effects.airLayers.length).toBeGreaterThan(0);
    });

    test('Extreme conditions produce larger effects', () => {
        const extremeEffects = calculateEnvironmentalEffects({
            altitude: 5280, // Denver
            temperature: 90,
            pressure: 24.86,
            humidity: 20,
            pressureTrend: 0.2,
            ballCompression: 90,
            height: 5,
            clubType: 'driver'
        });
        
        const normalEffects = calculateEnvironmentalEffects({
            altitude: 0,
            temperature: 70,
            pressure: 29.92,
            humidity: 50,
            pressureTrend: 0,
            ballCompression: 90,
            height: 5,
            clubType: 'driver'
        });
        
        expect(Math.abs(extremeEffects.totalEffect - 1))
            .toBeGreaterThan(Math.abs(normalEffects.totalEffect - 1));
    });
});
