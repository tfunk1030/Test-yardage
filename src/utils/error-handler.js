/**
 * Advanced Error Handler
 * Implements sophisticated error handling, logging, and recovery
 */

import { v4 as uuidv4 } from 'uuid';

export class ErrorHandler {
    constructor() {
        this.errorLog = new Map();
        this.maxLogSize = 1000;
        this.retryConfigs = new Map();
        this.recoveryStrategies = new Map();
        this.initialize();
    }

    /**
     * Initialize error handler
     */
    initialize() {
        this.setupDefaultRetryConfigs();
        this.setupDefaultRecoveryStrategies();
        this.startPeriodicCleanup();
    }

    /**
     * Handle error
     * @param {Error} error - Error to handle
     * @param {Object} context - Error context
     * @returns {Object} Error handling result
     */
    async handleError(error, context = {}) {
        const errorId = uuidv4();
        const timestamp = Date.now();
        
        const errorInfo = {
            id: errorId,
            error,
            context,
            timestamp,
            handled: false,
            retryCount: 0,
            recoveryAttempts: []
        };
        
        try {
            await this.logError(errorInfo);
            const strategy = this.determineRecoveryStrategy(error);
            const result = await this.executeRecoveryStrategy(strategy, errorInfo);
            
            errorInfo.handled = true;
            await this.updateErrorLog(errorInfo);
            
            return result;
        } catch (recoveryError) {
            errorInfo.recoveryError = recoveryError;
            await this.updateErrorLog(errorInfo);
            throw new ErrorHandlingError('Error recovery failed', recoveryError);
        }
    }

    /**
     * Setup default retry configurations
     */
    setupDefaultRetryConfigs() {
        this.retryConfigs.set('default', {
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            factor: 2,
            jitter: 0.1
        });
        
        this.retryConfigs.set('network', {
            maxAttempts: 5,
            baseDelay: 2000,
            maxDelay: 30000,
            factor: 2.5,
            jitter: 0.2
        });
        
        this.retryConfigs.set('api', {
            maxAttempts: 4,
            baseDelay: 1500,
            maxDelay: 20000,
            factor: 2,
            jitter: 0.15
        });
    }

    /**
     * Setup default recovery strategies
     */
    setupDefaultRecoveryStrategies() {
        this.recoveryStrategies.set('default', {
            steps: [
                this.logErrorDetails.bind(this),
                this.attemptRetry.bind(this),
                this.notifyUser.bind(this)
            ]
        });
        
        this.recoveryStrategies.set('network', {
            steps: [
                this.checkConnectivity.bind(this),
                this.attemptRetry.bind(this),
                this.switchToOfflineMode.bind(this)
            ]
        });
        
        this.recoveryStrategies.set('api', {
            steps: [
                this.validateApiResponse.bind(this),
                this.attemptRetry.bind(this),
                this.fallbackToCache.bind(this)
            ]
        });
    }

    /**
     * Determine recovery strategy
     * @param {Error} error - Error to handle
     * @returns {Object} Recovery strategy
     */
    determineRecoveryStrategy(error) {
        if (error.name === 'NetworkError') {
            return this.recoveryStrategies.get('network');
        }
        
        if (error.name === 'ApiError') {
            return this.recoveryStrategies.get('api');
        }
        
        return this.recoveryStrategies.get('default');
    }

    /**
     * Execute recovery strategy
     * @param {Object} strategy - Recovery strategy
     * @param {Object} errorInfo - Error information
     * @returns {Object} Recovery result
     */
    async executeRecoveryStrategy(strategy, errorInfo) {
        const results = [];
        
        for (const step of strategy.steps) {
            try {
                const result = await step(errorInfo);
                results.push(result);
                
                if (result.resolved) {
                    return {
                        success: true,
                        results,
                        resolution: result
                    };
                }
            } catch (stepError) {
                results.push({
                    success: false,
                    error: stepError
                });
            }
        }
        
        return {
            success: false,
            results
        };
    }

    /**
     * Attempt retry with exponential backoff
     * @param {Object} errorInfo - Error information
     * @returns {Object} Retry result
     */
    async attemptRetry(errorInfo) {
        const config = this.getRetryConfig(errorInfo.error);
        
        if (errorInfo.retryCount >= config.maxAttempts) {
            return {
                success: false,
                reason: 'max_attempts_exceeded'
            };
        }
        
        const delay = this.calculateRetryDelay(
            errorInfo.retryCount,
            config
        );
        
        await this.delay(delay);
        errorInfo.retryCount++;
        
        try {
            const result = await errorInfo.context.retry();
            return {
                success: true,
                result,
                resolved: true
            };
        } catch (retryError) {
            return {
                success: false,
                error: retryError
            };
        }
    }

    /**
     * Calculate retry delay
     * @param {number} attempt - Retry attempt number
     * @param {Object} config - Retry configuration
     * @returns {number} Delay in milliseconds
     */
    calculateRetryDelay(attempt, config) {
        const delay = Math.min(
            config.baseDelay * Math.pow(config.factor, attempt),
            config.maxDelay
        );
        
        const jitter = delay * config.jitter * (Math.random() * 2 - 1);
        return delay + jitter;
    }

    /**
     * Log error details
     * @param {Object} errorInfo - Error information
     */
    async logErrorDetails(errorInfo) {
        const details = {
            id: errorInfo.id,
            name: errorInfo.error.name,
            message: errorInfo.error.message,
            stack: errorInfo.error.stack,
            context: errorInfo.context,
            timestamp: errorInfo.timestamp
        };
        
        console.error('Error details:', details);
        
        return {
            success: true,
            details
        };
    }

    /**
     * Check connectivity
     * @param {Object} errorInfo - Error information
     * @returns {Object} Connectivity check result
     */
    async checkConnectivity() {
        try {
            const response = await fetch('https://api.tomorrow.io/health');
            return {
                success: true,
                online: response.ok
            };
        } catch (error) {
            return {
                success: false,
                online: false,
                error
            };
        }
    }

    /**
     * Switch to offline mode
     * @param {Object} errorInfo - Error information
     * @returns {Object} Offline mode result
     */
    async switchToOfflineMode(errorInfo) {
        try {
            await errorInfo.context.switchToOffline();
            return {
                success: true,
                mode: 'offline',
                resolved: true
            };
        } catch (error) {
            return {
                success: false,
                error
            };
        }
    }

    /**
     * Validate API response
     * @param {Object} errorInfo - Error information
     * @returns {Object} Validation result
     */
    validateApiResponse(errorInfo) {
        const response = errorInfo.context.response;
        
        if (!response) {
            return {
                success: false,
                reason: 'no_response'
            };
        }
        
        return {
            success: true,
            status: response.status,
            valid: response.status < 500
        };
    }

    /**
     * Fallback to cache
     * @param {Object} errorInfo - Error information
     * @returns {Object} Fallback result
     */
    async fallbackToCache(errorInfo) {
        try {
            const cached = await errorInfo.context.getFromCache();
            
            if (cached) {
                return {
                    success: true,
                    source: 'cache',
                    resolved: true,
                    data: cached
                };
            }
            
            return {
                success: false,
                reason: 'no_cache'
            };
        } catch (error) {
            return {
                success: false,
                error
            };
        }
    }

    /**
     * Notify user
     * @param {Object} errorInfo - Error information
     * @returns {Object} Notification result
     */
    async notifyUser(errorInfo) {
        const message = this.getUserFriendlyMessage(errorInfo.error);
        
        try {
            // In a real app, this would use a proper notification system
            console.warn('User notification:', message);
            
            return {
                success: true,
                message
            };
        } catch (error) {
            return {
                success: false,
                error
            };
        }
    }

    /**
     * Get user-friendly error message
     * @param {Error} error - Error object
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(error) {
        const messages = {
            NetworkError: 'Unable to connect to the weather service. ' +
                        'Please check your internet connection.',
            ApiError: 'The weather service is temporarily unavailable. ' +
                     'Please try again later.',
            CacheError: 'Unable to load saved weather data. ' +
                       'Please refresh the app.'
        };
        
        return messages[error.name] || 'An unexpected error occurred.';
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class ErrorHandlingError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = 'ErrorHandlingError';
        this.cause = cause;
    }
}
