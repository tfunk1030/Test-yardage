/**
 * Advanced Caching System
 * Implements sophisticated caching with persistence, encryption, and sync
 */

import LZString from 'lz-string';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

export class AdvancedCache {
    constructor(namespace) {
        this.namespace = namespace;
        this.version = '1.0';
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
        this.maxCacheAge = 30 * 60 * 1000; // 30 minutes
        this.maxCacheSize = 50 * 1024 * 1024; // 50MB
        this.initialize();
    }

    /**
     * Initialize cache
     */
    initialize() {
        this.startPeriodicSync();
        this.startPeriodicCleanup();
        this.validateCacheIntegrity();
    }

    /**
     * Set value in cache
     * @param {string} key - Cache key
     * @param {any} value - Value to cache
     * @param {Object} options - Cache options
     */
    async set(key, value, options = {}) {
        try {
            const cacheKey = this.getNamespacedKey(key);
            const metadata = this.createMetadata(options);
            const encrypted = this.encrypt(value);
            const compressed = this.compress(encrypted);
            
            const entry = {
                id: uuidv4(),
                data: compressed,
                metadata,
                checksum: this.calculateChecksum(compressed)
            };
            
            await this.enforceQuota();
            await this.persistEntry(cacheKey, entry);
            await this.updateIndex(cacheKey, metadata);
            
            return true;
        } catch (error) {
            console.error('Cache set failed:', error);
            throw new CacheError('Failed to set cache entry', error);
        }
    }

    /**
     * Get value from cache
     * @param {string} key - Cache key
     * @returns {any} Cached value
     */
    async get(key) {
        try {
            const cacheKey = this.getNamespacedKey(key);
            const entry = await this.loadEntry(cacheKey);
            
            if (!entry) return null;
            if (!this.validateEntry(entry)) {
                await this.remove(key);
                return null;
            }
            
            if (this.isExpired(entry.metadata)) {
                await this.remove(key);
                return null;
            }
            
            const decompressed = this.decompress(entry.data);
            return this.decrypt(decompressed);
        } catch (error) {
            console.error('Cache get failed:', error);
            return null;
        }
    }

    /**
     * Create cache metadata
     * @param {Object} options - Cache options
     * @returns {Object} Cache metadata
     */
    createMetadata(options) {
        return {
            created: Date.now(),
            expires: options.expires || Date.now() + this.maxCacheAge,
            priority: options.priority || 'normal',
            tags: options.tags || [],
            size: 0,
            accessCount: 0,
            lastAccessed: Date.now(),
            version: this.version
        };
    }

    /**
     * Enforce cache quota
     */
    async enforceQuota() {
        const currentSize = await this.calculateCacheSize();
        if (currentSize <= this.maxCacheSize) return;

        const entries = await this.loadAllEntries();
        const sortedEntries = this.prioritizeEntries(entries);
        
        let freedSpace = 0;
        const sizeToFree = currentSize - this.maxCacheSize + 1024 * 1024; // 1MB buffer
        
        for (const entry of sortedEntries) {
            if (freedSpace >= sizeToFree) break;
            await this.remove(entry.key);
            freedSpace += entry.metadata.size;
        }
    }

    /**
     * Prioritize cache entries for eviction
     * @param {Array} entries - Cache entries
     * @returns {Array} Prioritized entries
     */
    prioritizeEntries(entries) {
        return entries.sort((a, b) => {
            // Priority score factors
            const aScore = this.calculateEntryScore(a);
            const bScore = this.calculateEntryScore(b);
            return aScore - bScore;
        });
    }

    /**
     * Calculate entry priority score
     * @param {Object} entry - Cache entry
     * @returns {number} Priority score
     */
    calculateEntryScore(entry) {
        const age = Date.now() - entry.metadata.created;
        const accessRecency = Date.now() - entry.metadata.lastAccessed;
        const accessFrequency = entry.metadata.accessCount;
        const priority = this.getPriorityWeight(entry.metadata.priority);
        
        return (
            age * 0.3 +
            accessRecency * 0.3 -
            accessFrequency * 0.2 -
            priority * 0.2
        );
    }

    /**
     * Get priority weight
     * @param {string} priority - Priority level
     * @returns {number} Priority weight
     */
    getPriorityWeight(priority) {
        const weights = {
            low: 1,
            normal: 2,
            high: 3,
            critical: 4
        };
        return weights[priority] || weights.normal;
    }

    /**
     * Validate cache entry
     * @param {Object} entry - Cache entry
     * @returns {boolean} True if valid
     */
    validateEntry(entry) {
        if (!entry.data || !entry.metadata || !entry.checksum) {
            return false;
        }
        
        const currentChecksum = this.calculateChecksum(entry.data);
        if (currentChecksum !== entry.checksum) {
            return false;
        }
        
        if (entry.metadata.version !== this.version) {
            return false;
        }
        
        return true;
    }

    /**
     * Check if entry is expired
     * @param {Object} metadata - Entry metadata
     * @returns {boolean} True if expired
     */
    isExpired(metadata) {
        return Date.now() > metadata.expires;
    }

    /**
     * Calculate checksum
     * @param {string} data - Data to checksum
     * @returns {string} Checksum
     */
    calculateChecksum(data) {
        return CryptoJS.SHA256(data).toString();
    }

    /**
     * Encrypt data
     * @param {any} data - Data to encrypt
     * @returns {string} Encrypted data
     */
    encrypt(data) {
        const secret = this.getEncryptionKey();
        return CryptoJS.AES.encrypt(
            JSON.stringify(data),
            secret
        ).toString();
    }

    /**
     * Decrypt data
     * @param {string} encrypted - Encrypted data
     * @returns {any} Decrypted data
     */
    decrypt(encrypted) {
        const secret = this.getEncryptionKey();
        const bytes = CryptoJS.AES.decrypt(encrypted, secret);
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    }

    /**
     * Compress data
     * @param {string} data - Data to compress
     * @returns {string} Compressed data
     */
    compress(data) {
        return LZString.compressToUTF16(data);
    }

    /**
     * Decompress data
     * @param {string} compressed - Compressed data
     * @returns {string} Decompressed data
     */
    decompress(compressed) {
        return LZString.decompressFromUTF16(compressed);
    }

    /**
     * Start periodic sync
     */
    startPeriodicSync() {
        setInterval(() => {
            this.syncCache();
        }, this.syncInterval);
    }

    /**
     * Start periodic cleanup
     */
    startPeriodicCleanup() {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.maxCacheAge / 2);
    }

    /**
     * Sync cache with persistent storage
     */
    async syncCache() {
        try {
            const entries = await this.loadAllEntries();
            await this.validateCacheIntegrity();
            await this.persistCacheState(entries);
        } catch (error) {
            console.error('Cache sync failed:', error);
        }
    }

    /**
     * Cleanup expired entries
     */
    async cleanupExpiredEntries() {
        try {
            const entries = await this.loadAllEntries();
            const expired = entries.filter(
                entry => this.isExpired(entry.metadata)
            );
            
            for (const entry of expired) {
                await this.remove(entry.key);
            }
        } catch (error) {
            console.error('Cache cleanup failed:', error);
        }
    }

    /**
     * Get encryption key
     * @returns {string} Encryption key
     */
    getEncryptionKey() {
        // In a real app, this would be securely stored
        return 'your-secure-encryption-key';
    }
}

export class CacheError extends Error {
    constructor(message, cause) {
        super(message);
        this.name = 'CacheError';
        this.cause = cause;
    }
}
