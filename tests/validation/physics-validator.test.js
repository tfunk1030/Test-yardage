/**
 * Enhanced Physics Validation Framework
 * Comprehensive testing suite with performance metrics
 */

import { calculateBallTrajectory } from '../../src/physics/ball-physics.js';
import { TRACKMAN_CLUB_DATA } from '../../src/data/trackman-data.js';
import { performance } from 'node:perf_hooks';

// Validation thresholds
const THRESHOLDS = {
    CARRY_ERROR: 0.02,      // 2% error margin for carry distance
    HEIGHT_ERROR: 0.05,     // 5% error margin for max height
    TIME_ERROR: 0.1,        // 10% error margin for flight time
    SPIN_ERROR: 0.08,      // 8% error margin for spin rate
    ANGLE_ERROR: 0.05,      // 5% error margin for launch angle
    MAX_ERROR_TOLERANCE: 10, // %
    MIN_SUCCESS_RATE: 90,   // %
    MIN_DATA_POINTS: 100,   // points
    PERFORMANCE: {
        MAX_CALCULATION_TIME: 100,  // ms
        MAX_MEMORY_USAGE: 50 * 1024 * 1024,  // 50MB
        MIN_FPS: 30
    }
};

// Standard test parameters
const STANDARD_PARAMS = {
    temperature: 20,        // °C
    pressure: 101325,       // Pa
    humidity: 50,          // %
    altitude: 0,           // m
    windSpeed: 0,          // m/s
    windDirection: 0,      // degrees
    skillLevel: 100        // %
};

describe('Physics Validation Framework', () => {
    describe('Basic Validation', () => {
        test('validates trajectory structure', () => {
            const result = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver'
            });

            expect(result).toEqual(expect.objectContaining({
                trajectory: expect.any(Array),
                results: expect.any(Object),
                analytics: expect.any(Object),
                metadata: expect.any(Object)
            }));

            expect(result.trajectory[0]).toEqual(expect.objectContaining({
                x: expect.any(Number),
                y: expect.any(Number),
                z: expect.any(Number),
                time: expect.any(Number)
            }));

            expect(result.trajectory.length).toBeGreaterThan(THRESHOLDS.MIN_DATA_POINTS);
        });

        test('validates results structure', () => {
            const result = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver'
            });

            expect(result.results).toEqual(expect.objectContaining({
                carryDistance: expect.any(Number),
                maxHeight: expect.any(Number),
                flightTime: expect.any(Number),
                finalVelocity: expect.any(Number),
                impactAngle: expect.any(Number)
            }));
        });

        test('validates analytics structure', () => {
            const result = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver'
            });

            expect(result.analytics).toEqual(expect.objectContaining({
                efficiency: expect.any(Object),
                dispersion: expect.any(Object),
                environmentalImpact: expect.any(Object),
                powerMetrics: expect.any(Object),
                consistency: expect.any(Object)
            }));
        });
    });

    describe('Validation Suite', () => {
        Object.keys(TRACKMAN_CLUB_DATA).forEach(clubType => {
            test(`validates ${clubType} trajectory against TrackMan data`, () => {
                const result = calculateBallTrajectory({
                    ...STANDARD_PARAMS,
                    clubType
                });

                const trackmanData = TRACKMAN_CLUB_DATA[clubType];
                const carryError = Math.abs(result.results.carryDistance - trackmanData.carryDistance) / trackmanData.carryDistance;
                const heightError = Math.abs(result.results.maxHeight - trackmanData.maxHeight) / trackmanData.maxHeight;

                expect(carryError).toBeLessThan(THRESHOLDS.CARRY_ERROR);
                expect(heightError).toBeLessThan(THRESHOLDS.HEIGHT_ERROR);
                
                // Verify trajectory characteristics
                expect(result.trajectory.length).toBeGreaterThan(THRESHOLDS.MIN_DATA_POINTS);
                
                // Calculate success rate
                const validations = [
                    carryError < THRESHOLDS.CARRY_ERROR,
                    heightError < THRESHOLDS.HEIGHT_ERROR,
                    result.results.flightTime > 0,
                    result.results.finalVelocity > 0,
                    Math.abs(result.results.impactAngle) < 90
                ];
                
                const successRate = (validations.filter(v => v).length / validations.length) * 100;
                expect(successRate).toBeGreaterThanOrEqual(THRESHOLDS.MIN_SUCCESS_RATE);
            });
        });
    });

    describe('Environmental Effects', () => {
        test('validates temperature effects', () => {
            const baseline = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver'
            });

            const hot = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver',
                temperature: 35
            });

            const cold = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver',
                temperature: 5
            });

            expect(hot.results.carryDistance).toBeGreaterThan(baseline.results.carryDistance);
            expect(cold.results.carryDistance).toBeLessThan(baseline.results.carryDistance);
            
            // Verify trajectory differences
            expect(hot.trajectory.length).toBe(baseline.trajectory.length);
            expect(hot.trajectory).not.toEqual(baseline.trajectory);
            expect(cold.trajectory).not.toEqual(baseline.trajectory);
        });

        test('validates altitude effects', () => {
            const baseline = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver'
            });

            const highAltitude = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver',
                altitude: 2000
            });

            expect(highAltitude.results.carryDistance).toBeGreaterThan(baseline.results.carryDistance);
            
            // Calculate trajectory difference
            const trajectoryDifference = highAltitude.trajectory.reduce((diff, point, i) => {
                const baselinePoint = baseline.trajectory[i];
                return diff + Math.abs(point.y - baselinePoint.y);
            }, 0) / highAltitude.trajectory.length;
            
            expect(trajectoryDifference).toBeGreaterThan(0);
        });

        test('validates wind effects', () => {
            const baseline = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver'
            });

            const headwind = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver',
                windSpeed: 5,
                windDirection: 0
            });

            const tailwind = calculateBallTrajectory({
                ...STANDARD_PARAMS,
                clubType: 'driver',
                windSpeed: 5,
                windDirection: 180
            });

            expect(headwind.results.carryDistance).toBeLessThan(baseline.results.carryDistance);
            expect(tailwind.results.carryDistance).toBeGreaterThan(baseline.results.carryDistance);
            
            // Verify lateral dispersion
            const headwindDispersion = Math.max(...headwind.trajectory.map(p => Math.abs(p.z)));
            const tailwindDispersion = Math.max(...tailwind.trajectory.map(p => Math.abs(p.z)));
            
            expect(headwindDispersion).toBeGreaterThan(0);
            expect(tailwindDispersion).toBeGreaterThan(0);
        });
    });

    describe('Skill Level Effects', () => {
        test('validates skill level progression', () => {
            const skillLevels = [50, 75, 100];
            let previousCarry = 0;

            skillLevels.forEach(skillLevel => {
                const result = calculateBallTrajectory({
                    ...STANDARD_PARAMS,
                    clubType: 'driver',
                    skillLevel
                });

                expect(result.results.carryDistance).toBeGreaterThan(previousCarry);
                previousCarry = result.results.carryDistance;
                
                // Verify trajectory characteristics
                const maxHeight = Math.max(...result.trajectory.map(p => p.y));
                const totalDistance = result.trajectory[result.trajectory.length - 1].x;
                
                expect(maxHeight).toBeLessThanOrEqual(skillLevel * 3);
                expect(totalDistance).toBeLessThanOrEqual(skillLevel * 3);
            });
        });
    });

    describe('Performance Testing', () => {
        test('measures calculation time', () => {
            const iterations = 100;
            const times = [];
            
            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                calculateBallTrajectory({
                    ...STANDARD_PARAMS,
                    clubType: 'driver'
                });
                times.push(performance.now() - startTime);
            }
            
            const avgTime = times.reduce((a, b) => a + b) / times.length;
            const maxTime = Math.max(...times);
            
            expect(avgTime).toBeLessThan(THRESHOLDS.PERFORMANCE.MAX_CALCULATION_TIME / 10);
            expect(maxTime).toBeLessThan(THRESHOLDS.PERFORMANCE.MAX_CALCULATION_TIME);
        });

        test('measures memory usage', () => {
            const iterations = 100;
            const initialMemory = process.memoryUsage().heapUsed;
            
            for (let i = 0; i < iterations; i++) {
                calculateBallTrajectory({
                    ...STANDARD_PARAMS,
                    clubType: 'driver'
                });
            }
            
            const memoryUsed = process.memoryUsage().heapUsed - initialMemory;
            expect(memoryUsed).toBeLessThan(THRESHOLDS.PERFORMANCE.MAX_MEMORY_USAGE);
        });

        test('validates calculation stability', () => {
            const results = [];
            
            for (let i = 0; i < 100; i++) {
                const result = calculateBallTrajectory({
                    ...STANDARD_PARAMS,
                    clubType: 'driver'
                });
                results.push(result.results.carryDistance);
            }

            const mean = results.reduce((a, b) => a + b) / results.length;
            const variance = results.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / results.length;
            const standardDeviation = Math.sqrt(variance);

            expect(standardDeviation / mean).toBeLessThan(0.01); // 1% variation allowed
        });
    });

    describe('Report Generation', () => {
        test('generates comprehensive validation report', () => {
            const clubs = Object.keys(TRACKMAN_CLUB_DATA);
            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    totalTests: clubs.length,
                    passedTests: 0,
                    averageError: 0,
                    performance: {
                        averageTime: 0,
                        maxMemory: 0
                    }
                },
                clubResults: {}
            };

            clubs.forEach(clubType => {
                const startTime = performance.now();
                const startMemory = process.memoryUsage().heapUsed;

                const result = calculateBallTrajectory({
                    ...STANDARD_PARAMS,
                    clubType
                });

                const calculationTime = performance.now() - startTime;
                const memoryUsed = process.memoryUsage().heapUsed - startMemory;

                const trackmanData = TRACKMAN_CLUB_DATA[clubType];
                const carryError = Math.abs(result.results.carryDistance - trackmanData.carryDistance) / trackmanData.carryDistance;

                report.clubResults[clubType] = {
                    carryDistance: result.results.carryDistance,
                    expectedCarry: trackmanData.carryDistance,
                    carryError: carryError * 100,
                    calculationTime,
                    memoryUsed,
                    passed: carryError < THRESHOLDS.CARRY_ERROR
                };

                if (report.clubResults[clubType].passed) {
                    report.summary.passedTests++;
                }

                report.summary.averageError += carryError;
                report.summary.performance.averageTime += calculationTime;
                report.summary.performance.maxMemory = Math.max(report.summary.performance.maxMemory, memoryUsed);
            });

            report.summary.averageError = (report.summary.averageError / clubs.length) * 100;
            report.summary.performance.averageTime /= clubs.length;

            expect(report.summary.passedTests).toBe(clubs.length);
            expect(report.summary.averageError).toBeLessThan(THRESHOLDS.CARRY_ERROR * 100);
            expect(report.summary.performance.averageTime).toBeLessThan(THRESHOLDS.PERFORMANCE.MAX_CALCULATION_TIME);
            expect(report.summary.performance.maxMemory).toBeLessThan(THRESHOLDS.PERFORMANCE.MAX_MEMORY_USAGE);
            
            // Verify report format
            const reportString = JSON.stringify(report, null, 2);
            expect(reportString).toContain('Physics Validation Report');
            expect(reportString).toContain('Success Rate');
            expect(reportString).toContain('Tests Passed');
            expect(reportString).toMatch(/\d+\/\d+/);
            
            // Verify club-specific results
            clubs.forEach(club => {
                expect(reportString).toContain(club.toUpperCase());
            });
            
            // Verify performance metrics
            expect(reportString).toContain('Execution Time');
            expect(reportString).toContain('ms');
            
            // Verify error statistics
            expect(reportString).toContain('Average Error');
            expect(reportString).toContain('Maximum Error');
        });
    });
});
