import { WindCalculator } from '../wind-calculations';
import { ClubType } from '../../types/club';

describe('WindCalculator', () => {
    let calculator: WindCalculator;

    beforeEach(() => {
        calculator = new WindCalculator();
    });

    describe('calculateWindEffect', () => {
        it('should handle no wind correctly', () => {
            const wind = { speed: 0, direction: 0 };
            const shot = {
                clubType: 'driver' as ClubType,
                initialVelocity: 160,
                launchAngle: 10,
                backSpin: 2500,
                sideSpin: 0
            };

            const effect = calculator.calculateWindEffect(wind, shot);

            expect(effect.distance).toBeCloseTo(0, 1);
            expect(effect.direction).toBeCloseTo(0, 1);
            expect(effect.apex).toBeCloseTo(0, 1);
        });

        it('should calculate headwind effect correctly', () => {
            const wind = { speed: 10, direction: 0 };
            const shot = {
                clubType: 'driver' as ClubType,
                initialVelocity: 160,
                launchAngle: 10,
                backSpin: 2500,
                sideSpin: 0
            };

            const effect = calculator.calculateWindEffect(wind, shot);

            expect(effect.distance).toBeLessThan(0); // Headwind should reduce distance
            expect(Math.abs(effect.direction)).toBeLessThan(1); // Minimal direction change
            expect(effect.apex).toBeGreaterThan(0); // Should increase apex slightly
        });

        it('should calculate crosswind effect correctly', () => {
            const wind = { speed: 10, direction: 90 };
            const shot = {
                clubType: 'driver' as ClubType,
                initialVelocity: 160,
                launchAngle: 10,
                backSpin: 2500,
                sideSpin: 0
            };

            const effect = calculator.calculateWindEffect(wind, shot);

            expect(Math.abs(effect.distance)).toBeLessThan(5); // Minimal distance effect
            expect(effect.direction).not.toBe(0); // Should affect direction
            expect(Math.abs(effect.apex)).toBeLessThan(2); // Minimal apex change
        });

        it('should handle elevation adjustments', () => {
            const wind = { speed: 10, direction: 0 };
            const shot = {
                clubType: 'driver' as ClubType,
                initialVelocity: 160,
                launchAngle: 10,
                backSpin: 2500,
                sideSpin: 0
            };

            const effectSeaLevel = calculator.calculateWindEffect(wind, shot, 0);
            const effectElevated = calculator.calculateWindEffect(wind, shot, 5000);

            // Wind effect should be less at higher elevation due to less dense air
            expect(Math.abs(effectElevated.distance)).toBeLessThan(Math.abs(effectSeaLevel.distance));
        });
    });

    describe('getWindGradient', () => {
        it('should calculate wind gradient correctly', () => {
            const windSpeed = 10;
            const height = 100;

            const gradientSpeed = calculator.getWindGradient(windSpeed, height);

            expect(gradientSpeed).toBeGreaterThan(windSpeed); // Wind speed increases with height
            expect(gradientSpeed).toBeLessThan(windSpeed * 2); // But not unreasonably
        });

        it('should return base wind speed at reference height', () => {
            const windSpeed = 10;
            const referenceHeight = 6; // Reference height from implementation

            const gradientSpeed = calculator.getWindGradient(windSpeed, referenceHeight);

            expect(gradientSpeed).toBeCloseTo(windSpeed, 2);
        });
    });
});
