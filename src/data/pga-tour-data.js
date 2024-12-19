/**
 * PGA Tour Statistics and Validation Data
 * Data sourced from PGA Tour ShotLink system
 */

export const PGA_TOUR_STATS = {
    driver: {
        averages: {
            carryDistance: 275.3,
            totalDistance: 293.4,
            clubheadSpeed: 113.2,
            ballSpeed: 167.5,
            launchAngle: 10.9,
            backSpin: 2686,
            landingAngle: 37.2
        },
        ranges: {
            carryDistance: { min: 260, max: 320 },
            totalDistance: { min: 280, max: 340 },
            clubheadSpeed: { min: 108, max: 125 },
            ballSpeed: { min: 155, max: 185 },
            launchAngle: { min: 8, max: 15 },
            backSpin: { min: 2000, max: 3500 },
            landingAngle: { min: 30, max: 45 }
        }
    },
    iron_stats: {
        // Distance gaps between irons (yards)
        gaps: {
            four_to_five: 10,
            five_to_six: 10,
            six_to_seven: 15,
            seven_to_eight: 15,
            eight_to_nine: 15,
            nine_to_pw: 15
        },
        // Typical launch angles progression
        launchProgression: {
            four_iron: 13.8,
            five_iron: 14.6,
            six_iron: 15.8,
            seven_iron: 17.2,
            eight_iron: 19.1,
            nine_iron: 21.3,
            pitching_wedge: 24.2
        }
    },
    environmental_effects: {
        // Validated environmental impacts from PGA Tour data
        altitude: {
            per1000ft: 1.013, // 1.3% increase per 1000ft
            maxEffect: 1.15 // Maximum 15% increase
        },
        temperature: {
            per10Degrees: 1.007, // 0.7% increase per 10°F above 70°F
            reference: 70 // Reference temperature
        },
        humidity: {
            per10Percent: 0.997, // 0.3% decrease per 10% increase
            reference: 50 // Reference humidity
        }
    }
};

/**
 * Validate shot data against PGA Tour statistics
 * @param {Object} shotData - Shot data to validate
 * @param {string} clubType - Type of club used
 * @returns {Object} Validation results
 */
export function validateAgainstPGA(shotData, clubType) {
    const pgaStats = PGA_TOUR_STATS[clubType] || PGA_TOUR_STATS.driver;
    const results = {
        isValid: true,
        parameters: {},
        summary: ''
    };

    // Validate each parameter
    for (const [param, value] of Object.entries(shotData)) {
        if (pgaStats.averages[param] && pgaStats.ranges[param]) {
            const avg = pgaStats.averages[param];
            const range = pgaStats.ranges[param];
            const percentDiff = ((value - avg) / avg) * 100;
            const withinRange = value >= range.min && value <= range.max;

            results.parameters[param] = {
                value,
                pgaAverage: avg,
                percentDifference: percentDiff,
                withinRange,
                min: range.min,
                max: range.max
            };

            if (!withinRange) {
                results.isValid = false;
            }
        }
    }

    // Generate summary
    results.summary = generateValidationSummary(results);
    return results;
}

/**
 * Generate readable validation summary
 * @param {Object} results - Validation results
 * @returns {string} Formatted summary
 */
function generateValidationSummary(results) {
    let summary = 'Shot Analysis Summary:\n';
    
    for (const [param, data] of Object.entries(results.parameters)) {
        summary += `\n${param}:\n`;
        summary += `  Value: ${data.value.toFixed(1)}\n`;
        summary += `  PGA Average: ${data.pgaAverage.toFixed(1)}\n`;
        summary += `  Difference: ${data.percentDifference.toFixed(1)}%\n`;
        summary += `  Status: ${data.withinRange ? '✓ Within PGA range' : '✗ Outside PGA range'}\n`;
    }

    return summary;
}

/**
 * Validate iron distance gaps
 * @param {Object} clubDistances - Distances for each iron
 * @returns {Object} Gap validation results
 */
export function validateIronGaps(clubDistances) {
    const gaps = PGA_TOUR_STATS.iron_stats.gaps;
    const results = {
        isValid: true,
        gapAnalysis: {},
        recommendations: []
    };

    // Analyze gaps between consecutive irons
    for (const [gapName, expectedGap] of Object.entries(gaps)) {
        const [longerClub, shorterClub] = gapName.split('_to_');
        if (clubDistances[longerClub] && clubDistances[shorterClub]) {
            const actualGap = clubDistances[longerClub] - clubDistances[shorterClub];
            const gapDiff = actualGap - expectedGap;
            
            results.gapAnalysis[gapName] = {
                expected: expectedGap,
                actual: actualGap,
                difference: gapDiff,
                isValid: Math.abs(gapDiff) <= 5 // Within 5 yards tolerance
            };

            if (!results.gapAnalysis[gapName].isValid) {
                results.isValid = false;
                results.recommendations.push(
                    `Adjust ${longerClub} to ${shorterClub} gap (${actualGap} yards) ` +
                    `to be closer to PGA average (${expectedGap} yards)`
                );
            }
        }
    }

    return results;
}

/**
 * Validate launch angle progression
 * @param {Object} clubData - Launch angles for each club
 * @returns {Object} Launch angle validation results
 */
export function validateLaunchProgression(clubData) {
    const progression = PGA_TOUR_STATS.iron_stats.launchProgression;
    const results = {
        isValid: true,
        analysis: {},
        recommendations: []
    };

    // Check launch angle progression
    for (const [club, expectedAngle] of Object.entries(progression)) {
        if (clubData[club]) {
            const actualAngle = clubData[club];
            const angleDiff = actualAngle - expectedAngle;
            
            results.analysis[club] = {
                expected: expectedAngle,
                actual: actualAngle,
                difference: angleDiff,
                isValid: Math.abs(angleDiff) <= 2 // Within 2 degrees tolerance
            };

            if (!results.analysis[club].isValid) {
                results.isValid = false;
                results.recommendations.push(
                    `Adjust ${club} launch angle (${actualAngle.toFixed(1)}°) ` +
                    `to be closer to PGA average (${expectedAngle.toFixed(1)}°)`
                );
            }
        }
    }

    return results;
}
