/**
 * Shot Validation System
 * Compares predicted shots with actual outcomes
 */

import { validateAgainstPGA, validateIronGaps, validateLaunchProgression } from '../data/pga-tour-data.js';
import { shotTracker } from '../tracking/shot-tracker.js';

/**
 * Comprehensive shot validation
 */
class ShotValidator {
    /**
     * Validate a shot against multiple data sources
     * @param {Object} shotData - Shot data to validate
     * @returns {Object} Validation results
     */
    validateShot(shotData) {
        const results = {
            pgaComparison: validateAgainstPGA(shotData, shotData.clubType),
            historicalComparison: this.compareToHistory(shotData),
            environmentalAnalysis: this.analyzeEnvironmentalFactors(shotData),
            recommendations: []
        };

        // Generate recommendations based on all analyses
        results.recommendations = this.generateRecommendations(results);

        return results;
    }

    /**
     * Compare shot to historical data
     * @param {Object} shotData - Current shot data
     * @returns {Object} Historical comparison results
     */
    compareToHistory(shotData) {
        const clubStats = shotTracker.getClubStats(shotData.clubType);
        if (!clubStats) return null;

        const carryDiff = shotData.actualCarry - clubStats.averageCarry;
        const totalDiff = shotData.actualTotal - clubStats.averageTotal;

        return {
            averageComparison: {
                carry: {
                    difference: carryDiff,
                    percentDiff: (carryDiff / clubStats.averageCarry) * 100
                },
                total: {
                    difference: totalDiff,
                    percentDiff: (totalDiff / clubStats.averageTotal) * 100
                }
            },
            consistency: {
                withinDeviation: Math.abs(carryDiff) <= clubStats.consistency,
                standardDeviation: clubStats.consistency
            },
            trends: this.analyzeTrends(shotData, clubStats)
        };
    }

    /**
     * Analyze environmental factors
     * @param {Object} shotData - Shot data to analyze
     * @returns {Object} Environmental analysis
     */
    analyzeEnvironmentalFactors(shotData) {
        const envImpact = shotTracker.analyzeEnvironmentalImpact();
        const conditions = shotData.conditions;

        // Find relevant environmental ranges
        const tempRange = Math.floor(conditions.temperature / 10) * 10;
        const altRange = Math.floor(conditions.altitude / 1000) * 1000;
        const windRange = Math.floor(conditions.windSpeed / 5) * 5;

        return {
            temperature: {
                range: tempRange,
                impact: envImpact.temperature[tempRange],
                isSignificant: this.isSignificantImpact(
                    envImpact.temperature[tempRange]?.averageError
                )
            },
            altitude: {
                range: altRange,
                impact: envImpact.altitude[altRange],
                isSignificant: this.isSignificantImpact(
                    envImpact.altitude[altRange]?.averageError
                )
            },
            wind: {
                range: windRange,
                impact: envImpact.wind[windRange],
                isSignificant: this.isSignificantImpact(
                    envImpact.wind[windRange]?.averageError
                )
            }
        };
    }

    /**
     * Analyze shot trends
     * @param {Object} shotData - Current shot data
     * @param {Object} clubStats - Historical club statistics
     * @returns {Object} Trend analysis
     */
    analyzeTrends(shotData, clubStats) {
        const recentShots = shotTracker.shots
            .filter(shot => shot.clubType === shotData.clubType)
            .slice(-5);

        const trends = {
            carry: this.calculateTrend(recentShots.map(s => s.actual.carryDistance)),
            total: this.calculateTrend(recentShots.map(s => s.actual.totalDistance)),
            direction: this.calculateTrend(recentShots.map(s => s.actual.direction))
        };

        return {
            ...trends,
            isImproving: trends.carry > 0 && Math.abs(trends.direction) < 2
        };
    }

    /**
     * Calculate trend from array of values
     * @param {Array} values - Array of numbers
     * @returns {number} Trend value
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        const xMean = (values.length - 1) / 2;
        const yMean = values.reduce((a, b) => a + b) / values.length;
        
        let numerator = 0;
        let denominator = 0;
        
        values.forEach((y, x) => {
            numerator += (x - xMean) * (y - yMean);
            denominator += Math.pow(x - xMean, 2);
        });
        
        return denominator ? numerator / denominator : 0;
    }

    /**
     * Check if impact is significant
     * @param {number} error - Average error value
     * @returns {boolean} True if impact is significant
     */
    isSignificantImpact(error) {
        return error && Math.abs(error) > 5; // More than 5 yards difference
    }

    /**
     * Generate recommendations based on all analyses
     * @param {Object} results - All validation results
     * @returns {Array} Array of recommendations
     */
    generateRecommendations(results) {
        const recommendations = [];

        // PGA comparison recommendations
        if (!results.pgaComparison.isValid) {
            results.pgaComparison.parameters.forEach(param => {
                if (!param.withinRange) {
                    recommendations.push(
                        `Adjust ${param.name} closer to PGA average of ${param.pgaAverage}`
                    );
                }
            });
        }

        // Historical comparison recommendations
        if (results.historicalComparison) {
            if (!results.historicalComparison.consistency.withinDeviation) {
                recommendations.push(
                    'Work on consistency - shots are varying more than usual'
                );
            }
            if (!results.historicalComparison.trends.isImproving) {
                recommendations.push(
                    'Recent trend shows declining performance - consider technique review'
                );
            }
        }

        // Environmental recommendations
        const env = results.environmentalAnalysis;
        if (env.temperature.isSignificant) {
            recommendations.push(
                'Temperature is significantly affecting shots - adjust club selection'
            );
        }
        if (env.altitude.isSignificant) {
            recommendations.push(
                'Altitude is significantly affecting shots - adjust calculations'
            );
        }
        if (env.wind.isSignificant) {
            recommendations.push(
                'Wind is significantly affecting shots - review wind calculations'
            );
        }

        return recommendations;
    }
}

export const shotValidator = new ShotValidator();
