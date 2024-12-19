/**
 * Physics Validation Tool
 * Compares calculated results with real-world data
 */

import { calculateBallTrajectory } from '../physics/ball-physics.js';
import { TRACKMAN_CLUB_DATA } from '../data/trackman-data.js';

// Validation thresholds
const THRESHOLDS = {
    carryDistance: 0.02, // 2% tolerance
    maxHeight: 0.05,    // 5% tolerance
    ballSpeed: 0.02,    // 2% tolerance
    launchAngle: 0.05,  // 5% tolerance
    spinRate: 0.07      // 7% tolerance
};

/**
 * Validate physics calculations against TrackMan data
 * @param {Object} params - Shot parameters
 * @returns {Object} Validation results
 */
export function validatePhysics(params) {
    const trajectory = calculateBallTrajectory(params);
    const trackmanData = TRACKMAN_CLUB_DATA[params.clubType];
    
    // Calculate errors
    const errors = {
        carryDistance: Math.abs(trajectory.results.carryDistance - trackmanData.carryDistance) / trackmanData.carryDistance,
        maxHeight: Math.abs(trajectory.results.maxHeight - trackmanData.maxHeight) / trackmanData.maxHeight,
        ballSpeed: Math.abs(trajectory.results.ballSpeed - trackmanData.ballSpeed) / trackmanData.ballSpeed,
        launchAngle: Math.abs(trajectory.results.launchAngle - trackmanData.launchAngle) / trackmanData.launchAngle,
        spinRate: Math.abs(trajectory.results.spinRate - trackmanData.backSpin) / trackmanData.backSpin
    };

    // Check if within thresholds
    const validations = Object.entries(errors).map(([key, error]) => ({
        parameter: key,
        error: error * 100, // Convert to percentage
        withinThreshold: error <= THRESHOLDS[key],
        threshold: THRESHOLDS[key] * 100,
        expected: trackmanData[key === 'carryDistance' ? 'carryDistance' : 
                              key === 'maxHeight' ? 'maxHeight' :
                              key === 'ballSpeed' ? 'ballSpeed' :
                              key === 'launchAngle' ? 'launchAngle' : 'backSpin'],
        actual: trajectory.results[key === 'spinRate' ? 'spinRate' : key]
    }));

    // Overall validation result
    const isValid = validations.every(v => v.withinThreshold);

    return {
        isValid,
        validations,
        clubType: params.clubType,
        environmentalConditions: {
            temperature: params.temperature,
            pressure: params.pressure,
            humidity: params.humidity,
            altitude: params.altitude
        },
        trajectory: trajectory.trajectory
    };
}

/**
 * Run comprehensive validation suite
 * @returns {Object} Validation suite results
 */
export function runValidationSuite() {
    const standardConditions = {
        temperature: 70,
        pressure: 29.92,
        humidity: 50,
        altitude: 0,
        windSpeed: 0,
        windDirection: 0,
        skillLevel: 100
    };

    const clubs = Object.keys(TRACKMAN_CLUB_DATA);
    const results = {};

    // Test each club
    for (const club of clubs) {
        results[club] = validatePhysics({
            ...standardConditions,
            clubType: club
        });
    }

    // Calculate overall statistics
    const totalTests = clubs.length * Object.keys(THRESHOLDS).length;
    const passedTests = Object.values(results).reduce((total, result) => 
        total + result.validations.filter(v => v.withinThreshold).length, 0);

    return {
        results,
        summary: {
            totalTests,
            passedTests,
            successRate: (passedTests / totalTests) * 100,
            overallValid: passedTests === totalTests
        }
    };
}

/**
 * Generate validation report
 * @param {Object} validationResults - Results from validation suite
 * @returns {string} Formatted report
 */
export function generateValidationReport(validationResults) {
    let report = '=== Physics Validation Report ===\n\n';

    // Add summary
    const summary = validationResults.summary;
    report += `Overall Success Rate: ${summary.successRate.toFixed(1)}%\n`;
    report += `Tests Passed: ${summary.passedTests}/${summary.totalTests}\n\n`;

    // Add detailed results for each club
    for (const [club, result] of Object.entries(validationResults.results)) {
        report += `=== ${club.toUpperCase()} ===\n`;
        for (const validation of result.validations) {
            report += `${validation.parameter}: ${validation.error.toFixed(1)}% error `;
            report += validation.withinThreshold ? '✓' : '✗';
            report += `\n  Expected: ${validation.expected.toFixed(1)}`;
            report += `\n  Actual: ${validation.actual.toFixed(1)}\n`;
        }
        report += '\n';
    }

    return report;
}
