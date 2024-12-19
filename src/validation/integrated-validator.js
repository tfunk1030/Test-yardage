/**
 * Integrated Shot Validation System
 * Combines advanced statistics, environmental modeling, and PGA data
 */

import {
    calculateDispersion,
    calculateConsistency,
    calculateMovingAverage,
    calculateEMA
} from '../analysis/advanced-statistics.js';

import {
    calculateAirDensity,
    calculateMagnusEffect,
    calculateWindEffects,
    calculatePressureTrendEffect,
    calculateDewEffect
} from '../analysis/environmental-modeling.js';

import { validateAgainstPGA } from '../data/pga-tour-data.js';
import { shotTracker } from '../tracking/shot-tracker.js';

/**
 * Comprehensive shot validation
 */
class IntegratedValidator {
    /**
     * Validate shot with all available tools
     * @param {Object} shotData - Shot data
     * @param {Object} conditions - Environmental conditions
     * @returns {Object} Comprehensive validation results
     */
    validateShot(shotData, conditions) {
        // Get historical data
        const historicalShots = shotTracker.getClubShots(shotData.clubType);
        
        // Perform all validations
        const results = {
            statistical: this.performStatisticalAnalysis(shotData, historicalShots),
            environmental: this.performEnvironmentalAnalysis(shotData, conditions),
            technical: this.performTechnicalAnalysis(shotData),
            historical: this.performHistoricalAnalysis(shotData, historicalShots),
            recommendations: []
        };

        // Generate recommendations
        results.recommendations = this.generateRecommendations(results);
        
        return results;
    }

    /**
     * Perform statistical analysis
     * @param {Object} shotData - Current shot data
     * @param {Array} historicalShots - Historical shots
     * @returns {Object} Statistical analysis
     */
    performStatisticalAnalysis(shotData, historicalShots) {
        return {
            dispersion: calculateDispersion([...historicalShots, shotData]),
            consistency: calculateConsistency([...historicalShots, shotData]),
            trends: {
                carry: calculateEMA(historicalShots.map(s => s.actual.carryDistance)),
                direction: calculateMovingAverage(historicalShots.map(s => s.actual.direction))
            }
        };
    }

    /**
     * Perform environmental analysis
     * @param {Object} shotData - Shot data
     * @param {Object} conditions - Environmental conditions
     * @returns {Object} Environmental analysis
     */
    performEnvironmentalAnalysis(shotData, conditions) {
        const airDensity = calculateAirDensity(conditions);
        const magnusEffect = calculateMagnusEffect(conditions, {
            spinRate: shotData.actual.spinRate,
            velocity: shotData.actual.ballSpeed,
            diameter: 1.68 // inches
        });
        
        return {
            airDensity,
            magnusEffect,
            wind: calculateWindEffects(conditions, shotData),
            pressure: calculatePressureTrendEffect(conditions),
            moisture: calculateDewEffect(conditions)
        };
    }

    /**
     * Perform technical analysis
     * @param {Object} shotData - Shot data
     * @returns {Object} Technical analysis
     */
    performTechnicalAnalysis(shotData) {
        return {
            pga: validateAgainstPGA(shotData),
            efficiency: this.calculateShotEfficiency(shotData),
            launch: this.analyzeLaunchConditions(shotData),
            spin: this.analyzeSpinProfile(shotData)
        };
    }

    /**
     * Calculate shot efficiency
     * @param {Object} shotData - Shot data
     * @returns {Object} Efficiency metrics
     */
    calculateShotEfficiency(shotData) {
        const smashFactor = shotData.actual.ballSpeed / shotData.actual.clubSpeed;
        const launchEfficiency = this.calculateLaunchEfficiency(shotData);
        const spinEfficiency = this.calculateSpinEfficiency(shotData);
        
        return {
            smashFactor,
            launchEfficiency,
            spinEfficiency,
            overall: (smashFactor * launchEfficiency * spinEfficiency) / 3
        };
    }

    /**
     * Calculate launch efficiency
     * @param {Object} shotData - Shot data
     * @returns {number} Launch efficiency
     */
    calculateLaunchEfficiency(shotData) {
        const { launchAngle, ballSpeed } = shotData.actual;
        const optimalLaunch = this.getOptimalLaunch(ballSpeed);
        const diff = Math.abs(launchAngle - optimalLaunch);
        
        return Math.max(0, 1 - (diff / optimalLaunch));
    }

    /**
     * Calculate spin efficiency
     * @param {Object} shotData - Shot data
     * @returns {number} Spin efficiency
     */
    calculateSpinEfficiency(shotData) {
        const { spinRate, ballSpeed } = shotData.actual;
        const optimalSpin = this.getOptimalSpin(ballSpeed);
        const diff = Math.abs(spinRate - optimalSpin);
        
        return Math.max(0, 1 - (diff / optimalSpin));
    }

    /**
     * Get optimal launch angle
     * @param {number} ballSpeed - Ball speed
     * @returns {number} Optimal launch angle
     */
    getOptimalLaunch(ballSpeed) {
        // Simplified optimal launch calculation
        return 14 - (ballSpeed - 150) * 0.03;
    }

    /**
     * Get optimal spin rate
     * @param {number} ballSpeed - Ball speed
     * @returns {number} Optimal spin rate
     */
    getOptimalSpin(ballSpeed) {
        // Simplified optimal spin calculation
        return 2600 + (ballSpeed - 150) * 5;
    }

    /**
     * Analyze launch conditions
     * @param {Object} shotData - Shot data
     * @returns {Object} Launch analysis
     */
    analyzeLaunchConditions(shotData) {
        const { launchAngle, ballSpeed, spinRate } = shotData.actual;
        
        return {
            launchAngle: {
                value: launchAngle,
                optimal: this.getOptimalLaunch(ballSpeed),
                efficiency: this.calculateLaunchEfficiency(shotData)
            },
            spinRate: {
                value: spinRate,
                optimal: this.getOptimalSpin(ballSpeed),
                efficiency: this.calculateSpinEfficiency(shotData)
            },
            ballSpeed: {
                value: ballSpeed,
                efficiency: shotData.actual.ballSpeed / shotData.actual.clubSpeed
            }
        };
    }

    /**
     * Analyze spin profile
     * @param {Object} shotData - Shot data
     * @returns {Object} Spin analysis
     */
    analyzeSpinProfile(shotData) {
        const { spinRate, spinAxis } = shotData.actual;
        
        return {
            spinRate: {
                value: spinRate,
                category: this.categorizeSpinRate(spinRate),
                efficiency: this.calculateSpinEfficiency(shotData)
            },
            spinAxis: {
                value: spinAxis,
                category: this.categorizeSpinAxis(spinAxis)
            },
            profile: this.determineSpinProfile(spinRate, spinAxis)
        };
    }

    /**
     * Categorize spin rate
     * @param {number} spinRate - Spin rate
     * @returns {string} Spin category
     */
    categorizeSpinRate(spinRate) {
        if (spinRate < 2000) return 'low';
        if (spinRate > 3000) return 'high';
        return 'optimal';
    }

    /**
     * Categorize spin axis
     * @param {number} axis - Spin axis
     * @returns {string} Axis category
     */
    categorizeSpinAxis(axis) {
        if (axis < -5) return 'draw';
        if (axis > 5) return 'fade';
        return 'neutral';
    }

    /**
     * Determine spin profile
     * @param {number} spinRate - Spin rate
     * @param {number} spinAxis - Spin axis
     * @returns {Object} Spin profile
     */
    determineSpinProfile(spinRate, spinAxis) {
        return {
            type: this.categorizeSpinRate(spinRate) + '_' + 
                  this.categorizeSpinAxis(spinAxis),
            efficiency: Math.max(0, 1 - (Math.abs(spinAxis) / 10))
        };
    }

    /**
     * Perform historical analysis
     * @param {Object} shotData - Current shot data
     * @param {Array} historicalShots - Historical shots
     * @returns {Object} Historical analysis
     */
    performHistoricalAnalysis(shotData, historicalShots) {
        const recentTrend = this.analyzeRecentTrend(historicalShots);
        const consistency = this.analyzeConsistency(historicalShots);
        const improvement = this.calculateImprovement(shotData, historicalShots);
        
        return {
            recentTrend,
            consistency,
            improvement,
            confidence: this.calculateConfidence(recentTrend, consistency)
        };
    }

    /**
     * Generate recommendations
     * @param {Object} results - Validation results
     * @returns {Array} Recommendations
     */
    generateRecommendations(results) {
        const recommendations = [];
        
        // Technical recommendations
        if (results.technical.efficiency.overall < 0.8) {
            recommendations.push({
                type: 'technical',
                priority: 'high',
                message: 'Improve shot efficiency by optimizing launch conditions'
            });
        }

        // Statistical recommendations
        if (results.statistical.consistency.carryConsistency > 0.1) {
            recommendations.push({
                type: 'practice',
                priority: 'medium',
                message: 'Work on consistency - carry distance varies too much'
            });
        }

        // Environmental recommendations
        if (results.environmental.wind.carry.total < -10) {
            recommendations.push({
                type: 'club_selection',
                priority: 'high',
                message: 'Consider club up due to strong headwind'
            });
        }

        return recommendations;
    }
}

export const integratedValidator = new IntegratedValidator();
