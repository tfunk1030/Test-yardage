/**
 * Custom Error Classes
 */

export class WeatherError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = 'WeatherError';
        this.cause = cause;
        this.timestamp = new Date();
    }

    /**
     * Get error details
     * @returns {Object} Error details
     */
    getDetails() {
        return {
            name: this.name,
            message: this.message,
            cause: this.cause?.message,
            stack: this.stack,
            timestamp: this.timestamp
        };
    }

    /**
     * Check if error is retryable
     * @returns {boolean} True if error is retryable
     */
    isRetryable() {
        if (!this.cause) return false;
        
        return (
            this.cause.code === 'ECONNABORTED' ||
            this.cause.code === 'ETIMEDOUT' ||
            (this.cause.response?.status >= 500 &&
             this.cause.response?.status < 600)
        );
    }

    /**
     * Get user-friendly error message
     * @returns {string} User-friendly message
     */
    getUserMessage() {
        const messages = {
            'Missing Tomorrow.io API key': 
                'Weather service configuration is missing',
            'API request failed': 
                'Unable to fetch weather data. Please try again later',
            'Network Error': 
                'Please check your internet connection',
            'Timeout': 
                'Weather service is taking too long to respond'
        };
        
        return messages[this.message] || 'An unexpected error occurred';
    }
}
