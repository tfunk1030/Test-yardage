import { calculateBallTrajectory, validateTrajectory } from '../../src/physics/ball-physics.js';
import { TRACKMAN_CLUB_DATA } from '../../src/data/trackman-data.js';

const STANDARD_CONDITIONS = {
    clubType: 'driver',
    skillLevel: 100,
    temperature: 70,    // °F
    pressure: 29.92,    // inHg
    humidity: 50,       // %
    altitude: 0,        // feet
    windSpeed: 0,       // mph
    windDirection: 0    // degrees
};

const VALIDATION_THRESHOLDS = {
    CARRY_ERROR_THRESHOLD: 2,    // 2% error tolerance
    HEIGHT_ERROR_THRESHOLD: 5,   // 5% error tolerance
    MIN_FLIGHT_TIME: 4,         // seconds
    MAX_FLIGHT_TIME: 7,         // seconds
    TIME_STEP: 0.01            // seconds
};

function getStandardConditions(overrides = {}) {
    return { ...STANDARD_CONDITIONS, ...overrides };
}

describe('Ball Physics Tests', () => {
    const calculateTrajectory = (overrides) => {
        try {
            const conditions = getStandardConditions(overrides);
            const trajectory = calculateBallTrajectory(conditions);
            
            expect(trajectory).toBeDefined();
            expect(trajectory.results).toBeDefined();
            expect(trajectory.trajectory).toBeInstanceOf(Array);
            
            return trajectory;
        } catch (error) {
            console.error('Error calculating ball trajectory:', error);
            throw error;
        }
    };

    describe('Trajectory Validation', () => {
        test('driver trajectory matches TrackMan data', () => {
            const trajectory = calculateTrajectory();
            const validation = validateTrajectory(trajectory.results, 'driver');
            
            expect(validation).toEqual(expect.objectContaining({
                isValid: true,
                carryError: expect.any(Number),
                heightError: expect.any(Number)
            }));
            
            expect(validation.carryError).toBeLessThan(VALIDATION_THRESHOLDS.CARRY_ERROR_THRESHOLD);
            expect(validation.heightError).toBeLessThan(VALIDATION_THRESHOLDS.HEIGHT_ERROR_THRESHOLD);
        });

        test.each([
            ['five_iron', 165, 85],      // [club, expectedCarry, expectedHeight]
            ['pitching_wedge', 120, 65]
        ])('%s trajectory matches expected values', (club, expectedCarry, expectedHeight) => {
            const trajectory = calculateTrajectory({ clubType: club });
            const validation = validateTrajectory(trajectory.results, club);
            
            expect(validation.isValid).toBe(true);
            expect(Math.abs(trajectory.results.carryDistance - expectedCarry)).toBeLessThan(10);
            expect(Math.abs(trajectory.results.maxHeight - expectedHeight)).toBeLessThan(10);
        });
    });

    describe('Flight Characteristics', () => {
        test('flight time is within realistic bounds', () => {
            const trajectory = calculateTrajectory();
            const { flightTime } = trajectory.results;
            
            expect(flightTime).toBeGreaterThan(VALIDATION_THRESHOLDS.MIN_FLIGHT_TIME);
            expect(flightTime).toBeLessThan(VALIDATION_THRESHOLDS.MAX_FLIGHT_TIME);
        });

        test('trajectory points have consistent time steps', () => {
            const { trajectory } = calculateTrajectory();
            
            trajectory.forEach((point, i, arr) => {
                if (i > 0) {
                    const timeStep = point.time - arr[i - 1].time;
                    expect(timeStep).toBeCloseTo(VALIDATION_THRESHOLDS.TIME_STEP, 3);
                }
            });
        });

        test('trajectory data contains required properties', () => {
            const { trajectory } = calculateTrajectory();
            
            trajectory.forEach(point => {
                expect(point).toEqual(expect.objectContaining({
                    time: expect.any(Number),
                    x: expect.any(Number),
                    y: expect.any(Number),
                    z: expect.any(Number),
                    velocity: expect.any(Number)
                }));
            });
        });
    });

    describe('Environmental Effects', () => {
        test('altitude increases carry distance', () => {
            const seaLevel = calculateTrajectory();
            const altitude = calculateTrajectory({ altitude: 5280 }); // Denver
            
            const carryIncrease = (altitude.results.carryDistance - seaLevel.results.carryDistance) 
                               / seaLevel.results.carryDistance * 100;
            
            expect(carryIncrease).toBeGreaterThan(0);
            expect(carryIncrease).toBeLessThan(10); // Max 10% increase
        });

        test('temperature affects ball flight predictably', () => {
            const cold = calculateTrajectory({ temperature: 40 });
            const hot = calculateTrajectory({ temperature: 90 });
            
            const carryIncrease = (hot.results.carryDistance - cold.results.carryDistance)
                               / cold.results.carryDistance * 100;
            
            expect(carryIncrease).toBeGreaterThan(0);
            expect(carryIncrease).toBeLessThan(8); // Max 8% increase
        });
    });

    describe('Club Characteristics', () => {
        test.each([
            ['driver', 'five_iron'],
            ['five_iron', 'pitching_wedge']
        ])('club progression from %s to %s follows expected patterns', (club1, club2) => {
            const trajectory1 = calculateTrajectory({ clubType: club1 });
            const trajectory2 = calculateTrajectory({ clubType: club2 });
        
            const carryDifference = trajectory1.results.carryDistance - trajectory2.results.carryDistance;
            const heightDifference = trajectory2.results.maxHeight - trajectory1.results.maxHeight;
            
            expect(carryDifference).toBeGreaterThan(20); // At least 20 yards difference
            expect(heightDifference).toBeGreaterThan(0);  // Higher trajectory for shorter clubs
        });

        test('skill level proportionally affects distances', () => {
            const pro = calculateTrajectory();
            const amateur = calculateTrajectory({ skillLevel: 70 });
            
            const carryReduction = (pro.results.carryDistance - amateur.results.carryDistance)
                                / pro.results.carryDistance * 100;
            
            expect(carryReduction).toBeGreaterThan(20); // At least 20% reduction
            expect(carryReduction).toBeLessThan(40); // Max 40% reduction
        });
    });
});