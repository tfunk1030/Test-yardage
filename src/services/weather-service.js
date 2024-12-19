/**
 * Weather Service
 * Handles Tomorrow.io API integration with robust error handling and offline support
 */

import axios from 'axios';
import { LocalStorage } from '../utils/storage';
import { WeatherError } from '../utils/errors';

class WeatherService {
    constructor() {
        this.apiKey = process.env.TOMORROW_API_KEY;
        this.baseUrl = 'https://api.tomorrow.io/v4';
        this.cache = new LocalStorage('weather_cache');
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    /**
     * Initialize weather service
     */
    async initialize() {
        try {
            await this.validateApiKey();
            await this.loadCachedData();
            this.startPeriodicUpdate();
        } catch (error) {
            console.error('Weather service initialization failed:', error);
            this.switchToOfflineMode();
        }
    }

    /**
     * Get current weather conditions
     * @param {Object} location - Location coordinates
     * @returns {Promise<Object>} Weather data
     */
    async getCurrentWeather(location) {
        try {
            const cached = this.getCachedWeather(location);
            if (this.isCacheValid(cached)) {
                return cached.data;
            }

            const fresh = await this.fetchWeatherData(location);
            await this.cacheWeatherData(location, fresh);
            return fresh;
        } catch (error) {
            const cached = this.getCachedWeather(location);
            if (cached) {
                console.warn('Using cached weather data due to API error');
                return cached.data;
            }
            throw new WeatherError('Unable to get weather data', error);
        }
    }

    /**
     * Get wind profile at different heights
     * @param {Object} location - Location coordinates
     * @param {Array} heights - Heights in meters
     * @returns {Promise<Object>} Wind data at different heights
     */
    async getWindProfile(location, heights) {
        try {
            const data = await this.fetchWindProfileData(location, heights);
            return this.calculateWindGradient(data, heights);
        } catch (error) {
            const cached = this.getCachedWindProfile(location);
            if (cached) {
                return this.extrapolateWindProfile(cached, heights);
            }
            throw new WeatherError('Unable to get wind profile', error);
        }
    }

    /**
     * Calculate humidity effects
     * @param {Object} weather - Weather data
     * @returns {Object} Humidity effects
     */
    calculateHumidityEffects(weather) {
        const { temperature, humidity, pressure } = weather;
        
        return {
            airDensity: this.calculateAirDensity(temperature, humidity, pressure),
            dragCoefficient: this.calculateHumidityDrag(humidity),
            liftCoefficient: this.calculateHumidityLift(humidity),
            magnusEffect: this.calculateHumidityMagnus(humidity)
        };
    }

    /**
     * Fetch weather data from API
     * @param {Object} location - Location coordinates
     * @returns {Promise<Object>} Weather data
     */
    async fetchWeatherData(location) {
        const endpoint = `${this.baseUrl}/timelines`;
        const params = {
            location: `${location.latitude},${location.longitude}`,
            fields: [
                'temperature',
                'humidity',
                'windSpeed',
                'windDirection',
                'pressureSeaLevel',
                'precipitationProbability'
            ],
            timesteps: '1h',
            units: 'metric'
        };

        return this.makeApiRequest(endpoint, params);
    }

    /**
     * Fetch wind profile data
     * @param {Object} location - Location coordinates
     * @param {Array} heights - Heights in meters
     * @returns {Promise<Object>} Wind profile data
     */
    async fetchWindProfileData(location, heights) {
        const endpoint = `${this.baseUrl}/timelines`;
        const params = {
            location: `${location.latitude},${location.longitude}`,
            fields: ['windSpeed', 'windDirection'],
            timesteps: '1h',
            units: 'metric'
        };

        const data = await this.makeApiRequest(endpoint, params);
        return this.processWindProfileData(data, heights);
    }

    /**
     * Make API request with retry logic
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} API response
     */
    async makeApiRequest(endpoint, params) {
        let lastError;

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await axios.get(endpoint, {
                    params: {
                        ...params,
                        apikey: this.apiKey
                    },
                    timeout: 5000
                });

                return response.data;
            } catch (error) {
                lastError = error;
                if (!this.shouldRetry(error) || attempt === this.retryAttempts) {
                    break;
                }
                await this.delay(this.retryDelay * attempt);
            }
        }

        throw new WeatherError('API request failed', lastError);
    }

    /**
     * Calculate wind gradient
     * @param {Object} data - Wind profile data
     * @param {Array} heights - Heights in meters
     * @returns {Object} Wind gradient data
     */
    calculateWindGradient(data, heights) {
        const baseWind = data.timelines[0].intervals[0].values;
        const gradient = {};

        heights.forEach(height => {
            gradient[height] = {
                speed: this.calculateWindSpeedAtHeight(
                    baseWind.windSpeed,
                    height
                ),
                direction: this.calculateWindDirectionAtHeight(
                    baseWind.windDirection,
                    height
                )
            };
        });

        return gradient;
    }

    /**
     * Calculate wind speed at height
     * @param {number} baseSpeed - Base wind speed
     * @param {number} height - Height in meters
     * @returns {number} Wind speed at height
     */
    calculateWindSpeedAtHeight(baseSpeed, height) {
        // Power law wind profile
        const alpha = 0.143; // Roughness coefficient for open terrain
        const referenceHeight = 10; // Standard measurement height
        
        return baseSpeed * Math.pow(height / referenceHeight, alpha);
    }

    /**
     * Calculate air density
     * @param {number} temperature - Temperature in Celsius
     * @param {number} humidity - Relative humidity
     * @param {number} pressure - Pressure in hPa
     * @returns {number} Air density in kg/m³
     */
    calculateAirDensity(temperature, humidity, pressure) {
        const T = temperature + 273.15; // Convert to Kelvin
        const P = pressure * 100; // Convert hPa to Pa
        const Rv = 461.5; // Gas constant for water vapor
        const Rd = 287.05; // Gas constant for dry air
        
        const es = 611.2 * Math.exp(17.67 * temperature / (temperature + 243.5));
        const e = humidity / 100 * es;
        
        return (P - e) / (Rd * T) + e / (Rv * T);
    }

    /**
     * Calculate humidity effects on drag
     * @param {number} humidity - Relative humidity
     * @returns {number} Drag coefficient modifier
     */
    calculateHumidityDrag(humidity) {
        // Empirical relationship between humidity and drag
        const baseCoefficient = 0.47; // Base drag coefficient for a golf ball
        const humidityFactor = 1 + (humidity / 100) * 0.03;
        
        return baseCoefficient * humidityFactor;
    }

    /**
     * Calculate humidity effects on lift
     * @param {number} humidity - Relative humidity
     * @returns {number} Lift coefficient modifier
     */
    calculateHumidityLift(humidity) {
        // Empirical relationship between humidity and lift
        const baseCoefficient = 0.21; // Base lift coefficient for a golf ball
        const humidityFactor = 1 - (humidity / 100) * 0.02;
        
        return baseCoefficient * humidityFactor;
    }

    /**
     * Calculate humidity effects on Magnus force
     * @param {number} humidity - Relative humidity
     * @returns {number} Magnus effect modifier
     */
    calculateHumidityMagnus(humidity) {
        // Empirical relationship between humidity and Magnus effect
        const baseMagnus = 1.0;
        const humidityFactor = 1 - (humidity / 100) * 0.015;
        
        return baseMagnus * humidityFactor;
    }

    /**
     * Cache weather data
     * @param {Object} location - Location coordinates
     * @param {Object} data - Weather data
     */
    async cacheWeatherData(location, data) {
        const key = this.getCacheKey(location);
        await this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached weather data
     * @param {Object} location - Location coordinates
     * @returns {Object|null} Cached weather data
     */
    getCachedWeather(location) {
        const key = this.getCacheKey(location);
        return this.cache.get(key);
    }

    /**
     * Check if cached data is valid
     * @param {Object} cached - Cached data
     * @returns {boolean} True if cache is valid
     */
    isCacheValid(cached) {
        if (!cached) return false;
        const cacheAge = Date.now() - cached.timestamp;
        return cacheAge < 30 * 60 * 1000; // 30 minutes
    }

    /**
     * Generate cache key for location
     * @param {Object} location - Location coordinates
     * @returns {string} Cache key
     */
    getCacheKey(location) {
        return `weather_${location.latitude}_${location.longitude}`;
    }

    /**
     * Start periodic weather updates
     */
    startPeriodicUpdate() {
        setInterval(() => {
            this.updateAllCachedLocations();
        }, 15 * 60 * 1000); // Update every 15 minutes
    }

    /**
     * Switch to offline mode
     */
    switchToOfflineMode() {
        console.warn('Switching to offline mode');
        this.isOffline = true;
    }

    /**
     * Validate API key
     */
    async validateApiKey() {
        if (!this.apiKey) {
            throw new WeatherError('Missing Tomorrow.io API key');
        }
    }

    /**
     * Check if should retry request
     * @param {Error} error - Request error
     * @returns {boolean} True if should retry
     */
    shouldRetry(error) {
        return (
            error.response?.status >= 500 ||
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT'
        );
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const weatherService = new WeatherService();
