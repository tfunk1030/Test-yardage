/**
 * UI Manager for handling all UI interactions and updates
 * @module ui-manager
 */

import { calculationManager } from './calculation-manager.js';
import { validateNumeric, validateWindDirection, validateWeatherConditions } from '../utils/validation.js';
import { handleError, showErrorMessage } from '../utils/error-handling.js';

export class UIManager {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.setupTheme();
    }

    /**
     * Initialize UI elements
     */
    initializeElements() {
        // Main input elements
        this.elements = {
            windSpeed: document.getElementById('wind-speed'),
            windDirection: document.getElementById('wind-direction'),
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            pressure: document.getElementById('pressure'),
            altitude: document.getElementById('altitude'),
            baseYardage: document.getElementById('base-yardage'),
            shotHeight: document.getElementById('shot-height'),
            club: document.getElementById('club-selection'),
            
            // Results elements
            adjustedYardage: document.getElementById('adjusted-yardage'),
            windEffect: document.getElementById('wind-effect'),
            altitudeEffect: document.getElementById('altitude-effect'),
            
            // Buttons
            calculateButton: document.getElementById('calculate-button'),
            getCurrentWeather: document.getElementById('get-weather-button'),
            themeToggle: document.getElementById('theme-toggle'),
            
            // Containers
            errorContainer: document.getElementById('error-container'),
            loadingSpinner: document.getElementById('loading-spinner'),
            offlineMessage: document.getElementById('offline-message'),
            
            // Navigation
            navTabs: document.getElementById('nav-tabs')
        };
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Calculate button
        this.elements.calculateButton?.addEventListener('click', () => this.handleCalculate());
        
        // Get weather button
        this.elements.getCurrentWeather?.addEventListener('click', () => this.handleGetWeather());
        
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());
        
        // Input validation
        this.elements.windSpeed?.addEventListener('input', (e) => this.validateInput(e.target, validateNumeric));
        this.elements.windDirection?.addEventListener('change', (e) => this.validateInput(e.target, validateWindDirection));
        
        // Online/Offline handling
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    /**
     * Set up theme based on user preference
     */
    setupTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        const theme = savedTheme || (prefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    /**
     * Toggle between light and dark theme
     */
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    /**
     * Handle calculate button click
     */
    async handleCalculate() {
        try {
            this.showLoading(true);
            
            // Validate all inputs
            const inputs = this.validateAllInputs();
            if (!inputs.valid) {
                inputs.errors.forEach(error => showErrorMessage(error));
                return;
            }
            
            // Perform calculation using web worker
            const result = await calculationManager.calculate('fullCalculation', {
                windSpeed: inputs.data.windSpeed,
                windDirection: inputs.data.windDirection,
                shotHeight: inputs.data.shotHeight,
                altitude: inputs.data.altitude,
                conditions: {
                    temp: inputs.data.temperature,
                    humidity: inputs.data.humidity,
                    pressure: inputs.data.pressure
                },
                ballData: {
                    club: inputs.data.club,
                    baseYardage: inputs.data.baseYardage
                }
            });
            
            this.updateResults(result);
            
        } catch (error) {
            const errorDetails = handleError(error);
            showErrorMessage(errorDetails);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Handle get weather button click
     */
    async handleGetWeather() {
        try {
            this.showLoading(true);
            
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }
            
            // Get current position
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            // Fetch weather data
            const weather = await this.fetchWeatherData(position.coords);
            
            // Update UI with weather data
            this.updateWeatherInputs(weather);
            
        } catch (error) {
            const errorDetails = handleError(error);
            showErrorMessage(errorDetails);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Fetch weather data from API
     * @param {Object} coords - Coordinates object
     * @returns {Promise} Weather data
     */
    async fetchWeatherData(coords) {
        const response = await fetch(`/api/weather?lat=${coords.latitude}&lon=${coords.longitude}`);
        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }
        return response.json();
    }

    /**
     * Update UI with weather data
     * @param {Object} weather - Weather data
     */
    updateWeatherInputs(weather) {
        if (this.elements.temperature) this.elements.temperature.value = weather.temperature;
        if (this.elements.humidity) this.elements.humidity.value = weather.humidity;
        if (this.elements.pressure) this.elements.pressure.value = weather.pressure;
        if (this.elements.windSpeed) this.elements.windSpeed.value = weather.windSpeed;
        if (this.elements.windDirection) this.elements.windDirection.value = weather.windDirection;
        if (this.elements.altitude) this.elements.altitude.value = weather.altitude;
    }

    /**
     * Update results in UI
     * @param {Object} result - Calculation results
     */
    updateResults(result) {
        const { wind, altitude, airDensity, total } = result.result;
        
        if (this.elements.adjustedYardage) {
            const adjustedYards = Math.round(total.distanceEffect * 100) / 100;
            this.elements.adjustedYardage.textContent = `${adjustedYards} yards`;
        }
        
        if (this.elements.windEffect) {
            const windEffect = Math.round(wind.distanceEffect * 100);
            this.elements.windEffect.textContent = `${windEffect}%`;
        }
        
        if (this.elements.altitudeEffect) {
            const altEffect = Math.round((altitude.total - 1) * 100);
            this.elements.altitudeEffect.textContent = `${altEffect}%`;
        }
    }

    /**
     * Show/hide loading spinner
     * @param {boolean} show - Whether to show loading spinner
     */
    showLoading(show) {
        if (this.elements.loadingSpinner) {
            this.elements.loadingSpinner.style.display = show ? 'block' : 'none';
        }
        
        if (this.elements.calculateButton) {
            this.elements.calculateButton.disabled = show;
        }
    }

    /**
     * Handle online/offline status
     * @param {boolean} online - Whether device is online
     */
    handleOnlineStatus(online) {
        if (this.elements.offlineMessage) {
            this.elements.offlineMessage.style.display = online ? 'none' : 'block';
        }
        
        if (this.elements.getCurrentWeather) {
            this.elements.getCurrentWeather.disabled = !online;
        }
    }

    /**
     * Validate all inputs
     * @returns {Object} Validation result
     */
    validateAllInputs() {
        const errors = [];
        const data = {};
        
        // Validate wind inputs
        const windSpeedValidation = validateNumeric(this.elements.windSpeed?.value, {
            min: 0,
            max: 50,
            name: 'Wind speed'
        });
        if (!windSpeedValidation.valid) errors.push(windSpeedValidation);
        else data.windSpeed = Number(this.elements.windSpeed?.value);
        
        const windDirValidation = validateWindDirection(this.elements.windDirection?.value);
        if (!windDirValidation.valid) errors.push(windDirValidation);
        else data.windDirection = this.elements.windDirection?.value;
        
        // Validate weather conditions
        const conditions = {
            temp: this.elements.temperature?.value,
            humidity: this.elements.humidity?.value,
            pressure: this.elements.pressure?.value
        };
        
        const weatherValidation = validateWeatherConditions(conditions);
        if (!weatherValidation.valid) errors.push(...weatherValidation.errors);
        else {
            data.temperature = Number(conditions.temp);
            data.humidity = Number(conditions.humidity);
            data.pressure = Number(conditions.pressure);
        }
        
        return {
            valid: errors.length === 0,
            errors,
            data
        };
    }
}

// Export singleton instance
export const uiManager = new UIManager();
