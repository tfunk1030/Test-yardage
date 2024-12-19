/**
 * Advanced Statistical Tools
 * Implements sophisticated statistical analysis methods
 */

class StatisticalTools {
    /**
     * Perform time series analysis
     * @param {Array} data - Time series data
     * @returns {Object} Analysis results
     */
    analyzeTimeSeries(data) {
        return {
            trend: this.calculateTrend(data),
            seasonality: this.detectSeasonality(data),
            autocorrelation: this.calculateAutocorrelation(data),
            stationarity: this.testStationarity(data)
        };
    }

    /**
     * Calculate trend using LOESS
     * @param {Array} data - Input data
     * @returns {Array} Trend values
     */
    calculateTrend(data) {
        const bandwidth = 0.75;
        const result = [];
        
        for (let i = 0; i < data.length; i++) {
            const weights = this.calculateLoessWeights(data, i, bandwidth);
            result.push(this.weightedRegression(data, weights, i));
        }
        
        return result;
    }

    /**
     * Calculate LOESS weights
     * @param {Array} data - Input data
     * @param {number} index - Current index
     * @param {number} bandwidth - Bandwidth parameter
     * @returns {Array} Weights
     */
    calculateLoessWeights(data, index, bandwidth) {
        const weights = [];
        const span = Math.floor(data.length * bandwidth);
        
        for (let i = 0; i < data.length; i++) {
            const distance = Math.abs(i - index);
            weights[i] = distance < span ? 
                Math.pow(1 - Math.pow(distance / span, 3), 3) : 0;
        }
        
        return weights;
    }

    /**
     * Perform weighted regression
     * @param {Array} data - Input data
     * @param {Array} weights - Weights
     * @param {number} index - Current index
     * @returns {number} Regression value
     */
    weightedRegression(data, weights, index) {
        let sumWeights = 0;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;
        
        for (let i = 0; i < data.length; i++) {
            const weight = weights[i];
            sumWeights += weight;
            sumX += i * weight;
            sumY += data[i] * weight;
            sumXY += i * data[i] * weight;
            sumX2 += i * i * weight;
        }
        
        const meanX = sumX / sumWeights;
        const meanY = sumY / sumWeights;
        
        const slope = (sumXY - sumX * meanY) / (sumX2 - sumX * meanX);
        const intercept = meanY - slope * meanX;
        
        return slope * index + intercept;
    }

    /**
     * Detect seasonality using FFT
     * @param {Array} data - Input data
     * @returns {Object} Seasonality analysis
     */
    detectSeasonality(data) {
        const fft = this.performFFT(data);
        const frequencies = this.findDominantFrequencies(fft);
        
        return {
            frequencies,
            seasonal: frequencies.length > 0,
            period: frequencies.length > 0 ? 
                Math.round(data.length / frequencies[0].frequency) : null
        };
    }

    /**
     * Perform Fast Fourier Transform
     * @param {Array} data - Input data
     * @returns {Array} FFT results
     */
    performFFT(data) {
        const n = data.length;
        if (n <= 1) return data;
        
        const even = this.performFFT(data.filter((_, i) => i % 2 === 0));
        const odd = this.performFFT(data.filter((_, i) => i % 2 === 1));
        
        const result = new Array(n);
        
        for (let k = 0; k < n/2; k++) {
            const t = odd[k] * Math.exp(-2 * Math.PI * k / n * 1i);
            result[k] = even[k] + t;
            result[k + n/2] = even[k] - t;
        }
        
        return result;
    }

    /**
     * Find dominant frequencies
     * @param {Array} fft - FFT results
     * @returns {Array} Dominant frequencies
     */
    findDominantFrequencies(fft) {
        const amplitudes = fft.map(x => Math.abs(x));
        const mean = this.calculateMean(amplitudes);
        const std = this.calculateStandardDeviation(amplitudes);
        
        return amplitudes
            .map((amp, i) => ({ frequency: i, amplitude: amp }))
            .filter(f => f.amplitude > mean + 2 * std)
            .sort((a, b) => b.amplitude - a.amplitude);
    }

    /**
     * Calculate autocorrelation
     * @param {Array} data - Input data
     * @returns {Array} Autocorrelation values
     */
    calculateAutocorrelation(data) {
        const n = data.length;
        const mean = this.calculateMean(data);
        const variance = this.calculateVariance(data);
        const result = [];
        
        for (let lag = 0; lag < Math.min(n, 50); lag++) {
            let sum = 0;
            for (let i = 0; i < n - lag; i++) {
                sum += (data[i] - mean) * (data[i + lag] - mean);
            }
            result.push(sum / ((n - lag) * variance));
        }
        
        return result;
    }

    /**
     * Test for stationarity
     * @param {Array} data - Input data
     * @returns {Object} Stationarity test results
     */
    testStationarity(data) {
        const windowSize = Math.floor(data.length / 4);
        const windows = [];
        
        // Split data into windows
        for (let i = 0; i < data.length - windowSize; i += windowSize) {
            windows.push(data.slice(i, i + windowSize));
        }
        
        // Calculate statistics for each window
        const stats = windows.map(window => ({
            mean: this.calculateMean(window),
            variance: this.calculateVariance(window)
        }));
        
        // Test for constant mean and variance
        const meanDiff = Math.max(...stats.map(s => s.mean)) - 
                        Math.min(...stats.map(s => s.mean));
        const varDiff = Math.max(...stats.map(s => s.variance)) - 
                       Math.min(...stats.map(s => s.variance));
        
        return {
            isStationary: meanDiff < 0.1 * this.calculateMean(data) && 
                         varDiff < 0.1 * this.calculateVariance(data),
            meanDifference: meanDiff,
            varianceDifference: varDiff
        };
    }

    /**
     * Calculate mean
     * @param {Array} data - Input data
     * @returns {number} Mean value
     */
    calculateMean(data) {
        return data.reduce((a, b) => a + b) / data.length;
    }

    /**
     * Calculate variance
     * @param {Array} data - Input data
     * @returns {number} Variance value
     */
    calculateVariance(data) {
        const mean = this.calculateMean(data);
        return data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    }

    /**
     * Calculate standard deviation
     * @param {Array} data - Input data
     * @returns {number} Standard deviation value
     */
    calculateStandardDeviation(data) {
        return Math.sqrt(this.calculateVariance(data));
    }
}

export const statisticalTools = new StatisticalTools();
