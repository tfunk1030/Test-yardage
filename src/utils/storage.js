/**
 * Local Storage Utility
 * Handles data persistence with versioning and compression
 */

import LZString from 'lz-string';

export class LocalStorage {
    constructor(namespace) {
        this.namespace = namespace;
        this.version = '1.0';
    }

    /**
     * Set value in storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     */
    async set(key, value) {
        try {
            const storageKey = this.getNamespacedKey(key);
            const data = {
                value,
                version: this.version,
                timestamp: Date.now()
            };
            
            const compressed = this.compress(JSON.stringify(data));
            localStorage.setItem(storageKey, compressed);
        } catch (error) {
            console.error('Storage set failed:', error);
            throw error;
        }
    }

    /**
     * Get value from storage
     * @param {string} key - Storage key
     * @returns {any} Stored value
     */
    get(key) {
        try {
            const storageKey = this.getNamespacedKey(key);
            const compressed = localStorage.getItem(storageKey);
            
            if (!compressed) return null;
            
            const data = JSON.parse(this.decompress(compressed));
            
            if (data.version !== this.version) {
                console.warn('Storage version mismatch');
                this.remove(key);
                return null;
            }
            
            return data.value;
        } catch (error) {
            console.error('Storage get failed:', error);
            return null;
        }
    }

    /**
     * Remove value from storage
     * @param {string} key - Storage key
     */
    remove(key) {
        try {
            const storageKey = this.getNamespacedKey(key);
            localStorage.removeItem(storageKey);
        } catch (error) {
            console.error('Storage remove failed:', error);
            throw error;
        }
    }

    /**
     * Clear all values in namespace
     */
    clear() {
        try {
            const keys = this.getAllKeys();
            keys.forEach(key => this.remove(key));
        } catch (error) {
            console.error('Storage clear failed:', error);
            throw error;
        }
    }

    /**
     * Get all keys in namespace
     * @returns {Array<string>} Array of keys
     */
    getAllKeys() {
        const keys = [];
        const prefix = `${this.namespace}_`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                keys.push(key.slice(prefix.length));
            }
        }
        
        return keys;
    }

    /**
     * Get namespaced storage key
     * @param {string} key - Original key
     * @returns {string} Namespaced key
     */
    getNamespacedKey(key) {
        return `${this.namespace}_${key}`;
    }

    /**
     * Compress data string
     * @param {string} data - Data to compress
     * @returns {string} Compressed data
     */
    compress(data) {
        return LZString.compress(data);
    }

    /**
     * Decompress data string
     * @param {string} compressed - Compressed data
     * @returns {string} Decompressed data
     */
    decompress(compressed) {
        return LZString.decompress(compressed);
    }
}
