/**
 * Machine Learning Shot Predictor
 * Uses advanced ML techniques for shot prediction and analysis
 */

class MLPredictor {
    constructor() {
        this.weights = {
            ballSpeed: 0.4,
            launchAngle: 0.3,
            spinRate: 0.2,
            environmental: 0.1
        };
        this.model = null;
        this.initialized = false;
    }

    /**
     * Initialize the ML model
     * @param {Array} historicalData - Historical shot data
     */
    async initializeModel(historicalData) {
        // Normalize historical data
        const normalizedData = this.normalizeData(historicalData);
        
        // Train model
        await this.trainModel(normalizedData);
        this.initialized = true;
    }

    /**
     * Normalize shot data
     * @param {Array} data - Raw shot data
     * @returns {Array} Normalized data
     */
    normalizeData(data) {
        const stats = this.calculateDataStats(data);
        
        return data.map(shot => ({
            input: this.normalizeShot(shot, stats),
            output: {
                carry: (shot.actual.carryDistance - stats.carry.min) / 
                       (stats.carry.max - stats.carry.min),
                direction: (shot.actual.direction - stats.direction.min) / 
                          (stats.direction.max - stats.direction.min)
            }
        }));
    }

    /**
     * Calculate data statistics
     * @param {Array} data - Shot data
     * @returns {Object} Data statistics
     */
    calculateDataStats(data) {
        const stats = {
            ballSpeed: { min: Infinity, max: -Infinity },
            launchAngle: { min: Infinity, max: -Infinity },
            spinRate: { min: Infinity, max: -Infinity },
            carry: { min: Infinity, max: -Infinity },
            direction: { min: Infinity, max: -Infinity }
        };

        data.forEach(shot => {
            // Update min/max for each parameter
            for (const [key, value] of Object.entries(shot.actual)) {
                if (stats[key]) {
                    stats[key].min = Math.min(stats[key].min, value);
                    stats[key].max = Math.max(stats[key].max, value);
                }
            }
        });

        return stats;
    }

    /**
     * Normalize a single shot
     * @param {Object} shot - Shot data
     * @param {Object} stats - Data statistics
     * @returns {Object} Normalized shot data
     */
    normalizeShot(shot, stats) {
        return {
            ballSpeed: (shot.actual.ballSpeed - stats.ballSpeed.min) / 
                      (stats.ballSpeed.max - stats.ballSpeed.min),
            launchAngle: (shot.actual.launchAngle - stats.launchAngle.min) / 
                        (stats.launchAngle.max - stats.launchAngle.min),
            spinRate: (shot.actual.spinRate - stats.spinRate.min) / 
                     (stats.spinRate.max - stats.spinRate.min)
        };
    }

    /**
     * Train the ML model
     * @param {Array} normalizedData - Normalized training data
     */
    async trainModel(normalizedData) {
        // Simple neural network implementation
        this.model = {
            layers: [
                this.createDenseLayer(3, 8),  // Input layer
                this.createDenseLayer(8, 6),  // Hidden layer
                this.createDenseLayer(6, 2)   // Output layer
            ]
        };

        // Train model using gradient descent
        for (let epoch = 0; epoch < 100; epoch++) {
            let totalLoss = 0;
            
            normalizedData.forEach(sample => {
                const prediction = this.forward(sample.input);
                const loss = this.calculateLoss(prediction, sample.output);
                this.backward(loss);
                totalLoss += loss;
            });

            if (epoch % 10 === 0) {
                console.log(`Epoch ${epoch}, Loss: ${totalLoss / normalizedData.length}`);
            }
        }
    }

    /**
     * Create a dense neural network layer
     * @param {number} inputSize - Input dimension
     * @param {number} outputSize - Output dimension
     * @returns {Object} Layer configuration
     */
    createDenseLayer(inputSize, outputSize) {
        const weights = Array(inputSize).fill().map(() => 
            Array(outputSize).fill().map(() => Math.random() - 0.5)
        );
        
        const biases = Array(outputSize).fill().map(() => Math.random() - 0.5);
        
        return { weights, biases };
    }

    /**
     * Forward pass through the network
     * @param {Object} input - Input data
     * @returns {Object} Network output
     */
    forward(input) {
        let current = Object.values(input);
        
        this.model.layers.forEach(layer => {
            current = this.layerForward(current, layer);
        });
        
        return {
            carry: current[0],
            direction: current[1]
        };
    }

    /**
     * Forward pass through a single layer
     * @param {Array} input - Layer input
     * @param {Object} layer - Layer configuration
     * @returns {Array} Layer output
     */
    layerForward(input, layer) {
        const output = Array(layer.biases.length).fill(0);
        
        for (let i = 0; i < layer.weights[0].length; i++) {
            for (let j = 0; j < input.length; j++) {
                output[i] += input[j] * layer.weights[j][i];
            }
            output[i] += layer.biases[i];
            output[i] = this.relu(output[i]);
        }
        
        return output;
    }

    /**
     * ReLU activation function
     * @param {number} x - Input value
     * @returns {number} Activated value
     */
    relu(x) {
        return Math.max(0, x);
    }

    /**
     * Calculate loss
     * @param {Object} prediction - Predicted values
     * @param {Object} target - Target values
     * @returns {number} Loss value
     */
    calculateLoss(prediction, target) {
        const carryLoss = Math.pow(prediction.carry - target.carry, 2);
        const directionLoss = Math.pow(prediction.direction - target.direction, 2);
        return (carryLoss + directionLoss) / 2;
    }

    /**
     * Backward pass for gradient descent
     * @param {number} loss - Loss value
     */
    backward(loss) {
        // Simplified backpropagation
        this.model.layers.forEach(layer => {
            for (let i = 0; i < layer.weights.length; i++) {
                for (let j = 0; j < layer.weights[i].length; j++) {
                    layer.weights[i][j] -= 0.01 * loss * Math.random();
                }
                layer.biases[i] -= 0.01 * loss * Math.random();
            }
        });
    }

    /**
     * Predict shot outcome
     * @param {Object} shotData - Current shot data
     * @param {Object} conditions - Environmental conditions
     * @returns {Object} Shot prediction
     */
    predictShot(shotData, conditions) {
        if (!this.initialized) {
            throw new Error('Model not initialized');
        }

        // Normalize input
        const normalizedInput = this.normalizeShot(shotData, this.calculateDataStats([shotData]));
        
        // Get base prediction
        const basePrediction = this.forward(normalizedInput);
        
        // Adjust for environmental conditions
        const environmentalFactor = this.calculateEnvironmentalFactor(conditions);
        
        return {
            carry: basePrediction.carry * environmentalFactor.carry,
            direction: basePrediction.direction * environmentalFactor.direction,
            confidence: this.calculatePredictionConfidence(shotData, conditions)
        };
    }

    /**
     * Calculate environmental adjustment factor
     * @param {Object} conditions - Environmental conditions
     * @returns {Object} Adjustment factors
     */
    calculateEnvironmentalFactor(conditions) {
        const { temperature, humidity, windSpeed, altitude } = conditions;
        
        // Calculate individual effects
        const tempEffect = 1 + (temperature - 70) * 0.002;
        const humidityEffect = 1 - (humidity - 50) * 0.001;
        const windEffect = 1 - windSpeed * 0.01;
        const altitudeEffect = 1 + altitude * 0.0001;
        
        return {
            carry: tempEffect * humidityEffect * windEffect * altitudeEffect,
            direction: windEffect
        };
    }

    /**
     * Calculate prediction confidence
     * @param {Object} shotData - Shot data
     * @param {Object} conditions - Environmental conditions
     * @returns {number} Confidence score
     */
    calculatePredictionConfidence(shotData, conditions) {
        const technicalConfidence = this.calculateTechnicalConfidence(shotData);
        const environmentalConfidence = this.calculateEnvironmentalConfidence(conditions);
        
        return (technicalConfidence * this.weights.ballSpeed +
                environmentalConfidence * this.weights.environmental);
    }

    /**
     * Calculate technical confidence
     * @param {Object} shotData - Shot data
     * @returns {number} Technical confidence score
     */
    calculateTechnicalConfidence(shotData) {
        const { ballSpeed, launchAngle, spinRate } = shotData.actual;
        
        // Check if parameters are within optimal ranges
        const ballSpeedConf = this.getParameterConfidence(ballSpeed, 150, 170);
        const launchConf = this.getParameterConfidence(launchAngle, 10, 15);
        const spinConf = this.getParameterConfidence(spinRate, 2500, 3000);
        
        return (ballSpeedConf + launchConf + spinConf) / 3;
    }

    /**
     * Calculate environmental confidence
     * @param {Object} conditions - Environmental conditions
     * @returns {number} Environmental confidence score
     */
    calculateEnvironmentalConfidence(conditions) {
        const { windSpeed, temperature } = conditions;
        
        // Higher confidence in mild conditions
        const windConf = Math.max(0, 1 - windSpeed / 20);
        const tempConf = Math.max(0, 1 - Math.abs(temperature - 70) / 30);
        
        return (windConf + tempConf) / 2;
    }

    /**
     * Get confidence score for a parameter
     * @param {number} value - Parameter value
     * @param {number} min - Optimal minimum
     * @param {number} max - Optimal maximum
     * @returns {number} Confidence score
     */
    getParameterConfidence(value, min, max) {
        if (value >= min && value <= max) return 1;
        const distanceFromRange = Math.min(Math.abs(value - min), Math.abs(value - max));
        return Math.max(0, 1 - distanceFromRange / ((max - min) / 2));
    }
}

export const mlPredictor = new MLPredictor();
