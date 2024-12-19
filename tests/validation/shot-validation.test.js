import { shotValidator } from '../../src/validation/shot-validator.js';
import { shotTracker } from '../../src/tracking/shot-tracker.js';

describe('Shot Validation Tests', () => {
    const sampleShot = {
        clubType: 'driver',
        actualCarry: 275,
        actualTotal: 293,
        actualDirection: 0,
        calculatedCarry: 270,
        calculatedTotal: 290,
        calculatedDirection: 2,
        conditions: {
            temperature: 70,
            humidity: 50,
            pressure: 29.92,
            altitude: 0,
            windSpeed: 5,
            windDirection: 0
        }
    };

    beforeEach(() => localStorage.clear());

    test('Shot validation produces complete results', () => {
        const { pgaComparison, recommendations, environmentalAnalysis } = shotValidator.validateShot(sampleShot);
        
        expect(pgaComparison).toBeDefined();
        expect(recommendations).toBeInstanceOf(Array);
        expect(environmentalAnalysis).toBeDefined();
    });

    test('PGA comparison validates correctly', () => {
        const { pgaComparison } = shotValidator.validateShot(sampleShot);
        
        expect(pgaComparison.isValid).toBeDefined();
        expect(pgaComparison.parameters).toBeDefined();
    });

    test('Historical comparison works with recorded shots', () => {
        Array.from({ length: 5 }).forEach(() => {
            shotTracker.recordShot({
                ...sampleShot,
                actualCarry: 275 + (Math.random() * 10 - 5)
            });
        });

        const { historicalComparison } = shotValidator.validateShot(sampleShot);
        expect(historicalComparison).toBeDefined();
        expect(historicalComparison.averageComparison).toBeDefined();
        expect(historicalComparison.consistency).toBeDefined();
    });

    test('Environmental analysis detects significant impacts', () => {
        const conditions = [
            { temperature: 40, carry: 260 },
            { temperature: 90, carry: 280 },
            { temperature: 70, carry: 270 }
        ];

        conditions.forEach(({ temperature, carry }) => {
            shotTracker.recordShot({
                ...sampleShot,
                conditions: { ...sampleShot.conditions, temperature },
                actualCarry: carry
            });
        });

        const { environmentalAnalysis } = shotValidator.validateShot(sampleShot);
        expect(environmentalAnalysis.temperature).toBeDefined();
        expect(environmentalAnalysis.temperature.isSignificant).toBeDefined();
    });

    test('Recommendations are generated for issues', () => {
        const problematicShot = {
            ...sampleShot,
            actualCarry: 240,
            conditions: {
                ...sampleShot.conditions,
                temperature: 40
            }
        };

        const { recommendations } = shotValidator.validateShot(problematicShot);
        expect(recommendations.length).toBeGreaterThan(0);
    });

    test('Trend analysis works correctly', () => {
        [265, 268, 271, 274, 277].forEach(carry => {
            shotTracker.recordShot({
                ...sampleShot,
                actualCarry: carry
            });
        });

        const { historicalComparison } = shotValidator.validateShot(sampleShot);
        expect(historicalComparison.trends.isImproving).toBe(true);
    });

    test('Consistency calculation is accurate', () => {
        [270, 275, 280, 275, 270].forEach(carry => {
            shotTracker.recordShot({
                ...sampleShot,
                actualCarry: carry
            });
        });

        const { consistency } = shotTracker.getClubStats('driver');
        expect(consistency).toBeDefined();
        expect(consistency).toBeGreaterThan(0);
    });

    test('Environmental impact analysis is comprehensive', () => {
        const conditions = [
            { temperature: 40, altitude: 0, windSpeed: 0 },
            { temperature: 90, altitude: 5000, windSpeed: 10 },
            { temperature: 70, altitude: 2500, windSpeed: 5 }
        ];

        conditions.forEach(condition => {
            shotTracker.recordShot({
                ...sampleShot,
                conditions: {
                    ...sampleShot.conditions,
                    ...condition
                }
            });
        });

        const analysis = shotTracker.analyzeEnvironmentalImpact();
        expect(analysis.temperature).toBeDefined();
        expect(analysis.altitude).toBeDefined();
        expect(analysis.wind).toBeDefined();
    });
});