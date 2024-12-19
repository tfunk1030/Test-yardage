/**
 * Advanced Statistical Analysis for Golf Shots
 * Implements sophisticated statistical methods for shot analysis
 */

/**
 * Calculate moving average
 * @param {Array} values - Array of numbers
 * @param {number} window - Window size
 * @returns {Array} Moving averages
 */
export function calculateMovingAverage(values, window = 5) {
    const result = [];
    for (let i = 0; i < values.length; i++) {
        const start = Math.max(0, i - window + 1);
        const windowSlice = values.slice(start, i + 1);
        const average = windowSlice.reduce((a, b) => a + b) / windowSlice.length;
        result.push(average);
    }
    return result;
}

/**
 * Calculate exponential moving average
 * @param {Array} values - Array of numbers
 * @param {number} alpha - Smoothing factor (0-1)
 * @returns {Array} Exponential moving averages
 */
export function calculateEMA(values, alpha = 0.2) {
    const result = [values[0]];
    for (let i = 1; i < values.length; i++) {
        result.push(alpha * values[i] + (1 - alpha) * result[i - 1]);
    }
    return result;
}

/**
 * Calculate shot dispersion statistics
 * @param {Array} shots - Array of shot data
 * @returns {Object} Dispersion statistics
 */
export function calculateDispersion(shots) {
    const distances = shots.map(s => s.actual.carryDistance);
    const directions = shots.map(s => s.actual.direction);
    
    return {
        distance: {
            mean: calculateMean(distances),
            standardDev: calculateStandardDeviation(distances),
            variance: calculateVariance(distances),
            range: calculateRange(distances),
            confidenceInterval: calculateConfidenceInterval(distances)
        },
        direction: {
            mean: calculateMean(directions),
            standardDev: calculateStandardDeviation(directions),
            bias: calculateDirectionalBias(directions),
            pattern: identifyDirectionalPattern(directions)
        },
        pattern: calculateShotPattern(distances, directions)
    };
}

/**
 * Calculate shot consistency metrics
 * @param {Array} shots - Array of shot data
 * @returns {Object} Consistency metrics
 */
export function calculateConsistency(shots) {
    const carries = shots.map(s => s.actual.carryDistance);
    const smashFactors = shots.map(s => s.actual.ballSpeed / s.actual.clubSpeed);
    
    return {
        carryConsistency: calculateCoefficientOfVariation(carries),
        smashFactorConsistency: calculateCoefficientOfVariation(smashFactors),
        strikeConsistency: calculateStrikeConsistency(shots),
        trendAnalysis: analyzeTrends(shots)
    };
}

/**
 * Calculate strike consistency
 * @param {Array} shots - Array of shot data
 * @returns {Object} Strike consistency metrics
 */
function calculateStrikeConsistency(shots) {
    const launchAngles = shots.map(s => s.actual.launchAngle);
    const spinRates = shots.map(s => s.actual.spinRate);
    
    return {
        launchAngleConsistency: calculateCoefficientOfVariation(launchAngles),
        spinRateConsistency: calculateCoefficientOfVariation(spinRates),
        pattern: identifyStrikePattern(shots)
    };
}

/**
 * Analyze shot trends
 * @param {Array} shots - Array of shot data
 * @returns {Object} Trend analysis
 */
function analyzeTrends(shots) {
    const carries = shots.map(s => s.actual.carryDistance);
    const directions = shots.map(s => s.actual.direction);
    
    return {
        carryTrend: calculateLinearRegression(carries),
        directionTrend: calculateLinearRegression(directions),
        patterns: identifyPatterns(shots),
        seasonality: analyzeSeasonality(shots)
    };
}

/**
 * Calculate shot pattern
 * @param {Array} distances - Array of distances
 * @param {Array} directions - Array of directions
 * @returns {Object} Shot pattern analysis
 */
function calculateShotPattern(distances, directions) {
    const pattern = {
        type: 'unknown',
        radius: 0,
        confidence: 0
    };

    // Calculate dispersion pattern
    const distanceStdDev = calculateStandardDeviation(distances);
    const directionStdDev = calculateStandardDeviation(directions);
    
    if (directionStdDev < 5 && distanceStdDev < 10) {
        pattern.type = 'tight';
        pattern.confidence = 0.9;
    } else if (directionStdDev > 10 && distanceStdDev < 15) {
        pattern.type = 'spray';
        pattern.confidence = 0.8;
    } else if (directionStdDev < 8 && distanceStdDev > 15) {
        pattern.type = 'distance_inconsistent';
        pattern.confidence = 0.85;
    }

    pattern.radius = Math.sqrt(Math.pow(distanceStdDev, 2) + Math.pow(directionStdDev, 2));
    return pattern;
}

/**
 * Calculate linear regression
 * @param {Array} values - Array of numbers
 * @returns {Object} Regression analysis
 */
function calculateLinearRegression(values) {
    const n = values.length;
    const x = Array.from({length: n}, (_, i) => i);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, i) => a + i * values[i], 0);
    const sumXX = x.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return {
        slope,
        intercept,
        r2: calculateR2(values, slope, intercept),
        trend: slope > 0 ? 'improving' : 'declining'
    };
}

/**
 * Calculate R-squared value
 * @param {Array} values - Actual values
 * @param {number} slope - Regression slope
 * @param {number} intercept - Regression intercept
 * @returns {number} R-squared value
 */
function calculateR2(values, slope, intercept) {
    const yMean = values.reduce((a, b) => a + b) / values.length;
    const predicted = values.map((_, i) => slope * i + intercept);
    
    const ssRes = values.reduce((a, y, i) => a + Math.pow(y - predicted[i], 2), 0);
    const ssTot = values.reduce((a, y) => a + Math.pow(y - yMean, 2), 0);
    
    return 1 - (ssRes / ssTot);
}

/**
 * Identify patterns in shot data
 * @param {Array} shots - Array of shot data
 * @returns {Object} Pattern analysis
 */
function identifyPatterns(shots) {
    return {
        fatigue: analyzeFatiguePattern(shots),
        consistency: analyzeConsistencyPattern(shots),
        environmental: analyzeEnvironmentalPattern(shots)
    };
}

/**
 * Analyze fatigue pattern
 * @param {Array} shots - Array of shot data
 * @returns {Object} Fatigue analysis
 */
function analyzeFatiguePattern(shots) {
    const carries = shots.map(s => s.actual.carryDistance);
    const movingAvg = calculateMovingAverage(carries, 3);
    
    const decline = movingAvg[movingAvg.length - 1] < movingAvg[0];
    const declineRate = decline ? (movingAvg[0] - movingAvg[movingAvg.length - 1]) / movingAvg[0] : 0;
    
    return {
        showing_fatigue: decline && declineRate > 0.05,
        decline_rate: declineRate,
        confidence: calculatePatternConfidence(carries)
    };
}

/**
 * Calculate pattern confidence
 * @param {Array} values - Array of numbers
 * @returns {number} Confidence value
 */
function calculatePatternConfidence(values) {
    const stdDev = calculateStandardDeviation(values);
    const mean = calculateMean(values);
    const cv = stdDev / mean;
    
    return Math.max(0, 1 - cv);
}

/**
 * Calculate Bayesian shot prediction
 * @param {Array} shots - Historical shot data
 * @param {Object} conditions - Current conditions
 * @returns {Object} Bayesian prediction
 */
function calculateBayesianPrediction(shots, conditions) {
    // Calculate prior probabilities
    const prior = calculatePrior(shots);
    
    // Calculate likelihood
    const likelihood = calculateLikelihood(shots, conditions);
    
    // Calculate posterior
    const posterior = calculatePosterior(prior, likelihood);
    
    return {
        prior,
        likelihood,
        posterior,
        prediction: generatePrediction(posterior)
    };
}

/**
 * Calculate prior probabilities
 * @param {Array} shots - Historical shot data
 * @returns {Object} Prior probabilities
 */
function calculatePrior(shots) {
    const distances = shots.map(s => s.distance);
    const directions = shots.map(s => s.direction);
    
    return {
        distance: {
            mean: calculateMean(distances),
            variance: calculateVariance(distances),
            distribution: fitDistribution(distances)
        },
        direction: {
            mean: calculateMean(directions),
            variance: calculateVariance(directions),
            distribution: fitDistribution(directions)
        }
    };
}

/**
 * Calculate likelihood
 * @param {Array} shots - Historical shot data
 * @param {Object} conditions - Current conditions
 * @returns {Object} Likelihood values
 */
function calculateLikelihood(shots, conditions) {
    const similarShots = findSimilarConditions(shots, conditions);
    
    return {
        distance: calculateConditionalProbability(similarShots, 'distance'),
        direction: calculateConditionalProbability(similarShots, 'direction'),
        confidence: calculateLikelihoodConfidence(similarShots.length)
    };
}

/**
 * Calculate posterior probabilities
 * @param {Object} prior - Prior probabilities
 * @param {Object} likelihood - Likelihood values
 * @returns {Object} Posterior probabilities
 */
function calculatePosterior(prior, likelihood) {
    return {
        distance: {
            mean: combineEstimates(
                prior.distance.mean,
                likelihood.distance.mean,
                prior.distance.variance,
                likelihood.distance.variance
            ),
            variance: combinedVariance(
                prior.distance.variance,
                likelihood.distance.variance
            )
        },
        direction: {
            mean: combineEstimates(
                prior.direction.mean,
                likelihood.direction.mean,
                prior.direction.variance,
                likelihood.direction.variance
            ),
            variance: combinedVariance(
                prior.direction.variance,
                likelihood.direction.variance
            )
        },
        confidence: likelihood.confidence
    };
}

/**
 * Find shots with similar conditions
 * @param {Array} shots - Historical shot data
 * @param {Object} conditions - Current conditions
 * @returns {Array} Similar shots
 */
function findSimilarConditions(shots, conditions) {
    const weights = {
        temperature: 0.2,
        wind: 0.3,
        humidity: 0.1,
        pressure: 0.1,
        terrain: 0.3
    };
    
    return shots.filter(shot => 
        calculateConditionSimilarity(shot.conditions, conditions, weights) > 0.8
    );
}

/**
 * Calculate similarity between conditions
 * @param {Object} c1 - First conditions
 * @param {Object} c2 - Second conditions
 * @param {Object} weights - Feature weights
 * @returns {number} Similarity score
 */
function calculateConditionSimilarity(c1, c2, weights) {
    let similarity = 0;
    let totalWeight = 0;
    
    Object.entries(weights).forEach(([feature, weight]) => {
        if (c1[feature] !== undefined && c2[feature] !== undefined) {
            similarity += weight * (1 - Math.abs(c1[feature] - c2[feature]) / 
                Math.max(c1[feature], c2[feature]));
            totalWeight += weight;
        }
    });
    
    return similarity / totalWeight;
}

/**
 * Fit probability distribution
 * @param {Array} data - Input data
 * @returns {Object} Distribution parameters
 */
function fitDistribution(data) {
    const mean = calculateMean(data);
    const variance = calculateVariance(data);
    const skewness = calculateSkewness(data);
    const kurtosis = calculateKurtosis(data);
    
    if (Math.abs(skewness) < 0.5 && Math.abs(kurtosis - 3) < 0.5) {
        return {
            type: 'normal',
            parameters: { mean, variance }
        };
    } else {
        return {
            type: 'gamma',
            parameters: fitGammaDistribution(data)
        };
    }
}

/**
 * Calculate skewness
 * @param {Array} values - Input values
 * @returns {number} Skewness value
 */
function calculateSkewness(values) {
    const mean = calculateMean(values);
    const std = Math.sqrt(calculateVariance(values));
    const n = values.length;
    
    return (values.reduce((sum, x) => 
        sum + Math.pow((x - mean) / std, 3), 0) / n);
}

/**
 * Calculate kurtosis
 * @param {Array} values - Input values
 * @returns {number} Kurtosis value
 */
function calculateKurtosis(values) {
    const mean = calculateMean(values);
    const std = Math.sqrt(calculateVariance(values));
    const n = values.length;
    
    return (values.reduce((sum, x) => 
        sum + Math.pow((x - mean) / std, 4), 0) / n);
}

/**
 * Fit gamma distribution
 * @param {Array} data - Input data
 * @returns {Object} Gamma parameters
 */
function fitGammaDistribution(data) {
    const mean = calculateMean(data);
    const variance = calculateVariance(data);
    
    const alpha = Math.pow(mean, 2) / variance;
    const beta = variance / mean;
    
    return { alpha, beta };
}

/**
 * Combine estimates using weighted average
 * @param {number} est1 - First estimate
 * @param {number} est2 - Second estimate
 * @param {number} var1 - First variance
 * @param {number} var2 - Second variance
 * @returns {number} Combined estimate
 */
function combineEstimates(est1, est2, var1, var2) {
    const w1 = 1 / var1;
    const w2 = 1 / var2;
    return (w1 * est1 + w2 * est2) / (w1 + w2);
}

/**
 * Calculate combined variance
 * @param {number} var1 - First variance
 * @param {number} var2 - Second variance
 * @returns {number} Combined variance
 */
function combinedVariance(var1, var2) {
    return 1 / (1/var1 + 1/var2);
}

/**
 * Generate prediction from posterior distribution
 * @param {Object} posterior - Posterior probabilities
 * @returns {Object} Prediction
 */
function generatePrediction(posterior) {
    return {
        distance: posterior.distance.mean,
        direction: posterior.direction.mean,
        confidence: posterior.confidence
    };
}

// Statistical utility functions
function calculateMean(values) {
    return values.reduce((a, b) => a + b) / values.length;
}

function calculateVariance(values) {
    const mean = calculateMean(values);
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
}

function calculateStandardDeviation(values) {
    return Math.sqrt(calculateVariance(values));
}

function calculateRange(values) {
    return Math.max(...values) - Math.min(...values);
}

function calculateConfidenceInterval(values, confidence = 0.95) {
    const mean = calculateMean(values);
    const stdDev = calculateStandardDeviation(values);
    const z = 1.96; // 95% confidence
    const margin = z * (stdDev / Math.sqrt(values.length));
    
    return {
        lower: mean - margin,
        upper: mean + margin
    };
}

function calculateCoefficientOfVariation(values) {
    const mean = calculateMean(values);
    const stdDev = calculateStandardDeviation(values);
    return stdDev / mean;
}
