/**
 * Manager class for handling calculations using Web Worker
 */
export class CalculationManager {
    constructor() {
        this.worker = new Worker(new URL('../worker../workers/calculations-worker.js', import.meta.url), { type: 'module' });
        this.callbacks = new Map();
        this.setupWorker();
    }
    
    /**
     * Set up worker message handling
     */
    setupWorker() {
        this.worker.onmessage = (e) => {
            const { type, result, error, cached } = e.data;
            const callback = this.callbacks.get(type);
            
            if (callback) {
                if (error) {
                    callback.reject(new Error(error));
                } else {
                    callback.resolve({ result, cached });
                }
                this.callbacks.delete(type);
            }
        };
        
        this.worker.onerror = (error) => {
            console.error('Worker error:', error);
            this.callbacks.forEach(callback => {
                callback.reject(error);
            });
            this.callbacks.clear();
        };
    }
    
    /**
     * Generate cache key for calculations
     * @param {string} type - Calculation type
     * @param {Object} data - Calculation data
     * @returns {string} Cache key
     */
    generateCacheKey(type, data) {
        return `${type}-${JSON.stringify(data)}`;
    }
    
    /**
     * Perform calculation using worker
     * @param {string} type - Calculation type
     * @param {Object} data - Calculation data
     * @returns {Promise} Calculation result
     */
    calculate(type, data) {
        return new Promise((resolve, reject) => {
            const cacheKey = this.generateCacheKey(type, data);
            
            this.callbacks.set(type, { resolve, reject });
            
            this.worker.postMessage({
                type,
                data,
                cacheKey
            });
        });
    }
    
    /**
     * Clear calculation cache
     * @returns {Promise} Clear cache result
     */
    clearCache() {
        return new Promise((resolve, reject) => {
            this.callbacks.set('cacheClear', { resolve, reject });
            this.worker.postMessage({ type: 'cacheClear' });
        });
    }
    
    /**
     * Terminate worker
     */
    terminate() {
        this.worker.terminate();
        this.callbacks.clear();
    }
}

// Export singleton instance
export const calculationManager = new CalculationManager();
