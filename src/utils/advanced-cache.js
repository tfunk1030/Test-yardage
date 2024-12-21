/**
 * Advanced Caching System
 * Optimized for physics calculations with LRU and memory management
 */

class AdvancedCache {
    constructor(maxSize = 1000, maxMemory = 100 * 1024 * 1024) { // 100MB default
        this.maxSize = maxSize;
        this.maxMemory = maxMemory;
        this.cache = new Map();
        this.lruQueue = [];
        this.currentMemory = 0;
        this.hitCount = 0;
        this.missCount = 0;
        this.evictionCount = 0;
        this.totalInsertions = 0;
    }

    /**
     * Generate cache key from parameters
     * @param {Object} params - Parameters to hash
     * @returns {string} Cache key
     */
    generateKey(params) {
        // Sort keys to ensure consistent order
        const sortedKeys = Object.keys(params).sort();
        const keyParts = sortedKeys.map(key => `${key}:${params[key]}`);
        return keyParts.join('|');
    }

    /**
     * Estimate memory usage of a value
     * @param {*} value - Value to estimate
     * @returns {number} Estimated bytes
     */
    estimateSize(value) {
        const str = JSON.stringify(value);
        return str.length * 2; // Approximate UTF-16 encoding
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {*} Cached value or undefined
     */
    get(key) {
        if (!this.cache.has(key)) {
            this.missCount++;
            return undefined;
        }

        this.hitCount++;
        // Update LRU queue
        this.lruQueue = this.lruQueue.filter(k => k !== key);
        this.lruQueue.push(key);

        return this.cache.get(key);
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {*} value - Value to cache
     */
    set(key, value) {
        const valueSize = this.estimateSize(value);

        // Check if value is too large
        if (valueSize > this.maxMemory) {
            console.warn('Value too large to cache');
            return;
        }

        // Make space if needed
        while (this.currentMemory + valueSize > this.maxMemory || 
               this.cache.size >= this.maxSize) {
            if (this.lruQueue.length === 0) break;
            
            const lruKey = this.lruQueue.shift();
            const lruValue = this.cache.get(lruKey);
            this.currentMemory -= this.estimateSize(lruValue);
            this.cache.delete(lruKey);
            this.evictionCount++;
        }

        // Add new value
        this.cache.set(key, value);
        this.lruQueue.push(key);
        this.currentMemory += valueSize;
        this.totalInsertions++;
    }

    /**
     * Clear the cache
     */
    clear() {
        this.cache.clear();
        this.lruQueue = [];
        this.currentMemory = 0;
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache stats
     */
    getStats() {
        return {
            size: this.cache.size,
            memoryUsage: this.currentMemory,
            memoryLimit: this.maxMemory,
            hitRate: this.hitCount / (this.hitCount + this.missCount),
            efficiency: 1 - (this.evictionCount / this.totalInsertions)
        };
    }

    /**
     * Memoize a function with this cache
     * @param {Function} fn - Function to memoize
     * @returns {Function} Memoized function
     */
    memoize(fn) {
        return (...args) => {
            const key = this.generateKey(args);
            let result = this.get(key);
            
            if (result === undefined) {
                result = fn(...args);
                this.set(key, result);
            }
            
            return result;
        };
    }

    /**
     * Prefetch values into cache
     * @param {Array} keys - Keys to prefetch
     * @param {Function} fetchFn - Function to fetch values
     */
    async prefetch(keys, fetchFn) {
        const missingKeys = keys.filter(key => !this.cache.has(key));
        const values = await Promise.all(missingKeys.map(fetchFn));
        
        missingKeys.forEach((key, index) => {
            this.set(key, values[index]);
        });
    }
}

// Create singleton instance
const physicsCache = new AdvancedCache();

export default physicsCache;
