// Wind calculation and UI handling
import { weatherService } from './services/weather.service';

class WindCalculator {
    constructor() {
        console.log('Initializing WindCalculator...');
        this.elements = {};
        this.weatherData = null;
        this.cachedWeather = null;
        this.lastFetch = null;
        this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.initializeElements();
        this.setupEventListeners();
        this.updateCalculations();
    }

    async fetchWeatherData(latitude, longitude) {
        try {
            // Check cache first
            if (this.isCacheValid()) {
                console.log('Using cached weather data');
                return this.cachedWeather;
            }

            const location = { lat: latitude, lon: longitude };
            this.weatherData = await weatherService.fetchWeatherData(location);
            
            // Cache the new data
            this.cachedWeather = this.weatherData;
            this.lastFetch = Date.now();
            
            return this.weatherData;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            // The weather service will automatically fall back to mock data
            return weatherService.getMockWeatherData();
        }
    }

    isCacheValid() {
        return this.cachedWeather && this.lastFetch && 
               (Date.now() - this.lastFetch < this.CACHE_DURATION);
    }

    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    // Use default coordinates if location access fails
                    resolve({
                        lat: 40.7128,
                        lon: -74.0060
                    });
                }
            );
        });
    }

    async fetchWeatherDataForCurrentLocation() {
        const position = await this.getCurrentPosition();
        return this.fetchWeatherData(position.lat, position.lon);
    }

    updateWeatherDisplay(weather) {
        console.log('Updating weather display:', weather);
        // Update input fields
        if (this.elements.temperature) this.elements.temperature.value = Math.round(weather.temperature);
        if (this.elements.humidity) this.elements.humidity.value = Math.round(weather.humidity);
        if (this.elements.windSpeed) this.elements.windSpeed.value = Math.round(weather.windSpeed);
        if (this.elements.windDirection) this.elements.windDirection.value = Math.round(weather.windDirection);

        // Trigger recalculation
        this.updateCalculations();
    }

    updateCalculations() {
        // Get input values with validation
        const inputs = {
            windSpeed: Math.max(0, this.getInputValue('windSpeed', 10)),
            windDirection: this.getInputValue('windDirection', 0) % 360,
            shotDistance: Math.max(0, this.getInputValue('shotDistance', 200)),
            shotHeight: Math.max(0, this.getInputValue('shotHeight', 30)),
            shotDirection: this.getInputValue('shotDirection', 0) % 360,
            temperature: this.getInputValue('temperature', 70),
            humidity: Math.min(100, Math.max(0, this.getInputValue('humidity', 50)))
        };

        console.log('Calculating with inputs:', inputs);

        // Calculate effects
        const windEffect = this.calculateWindEffect(inputs.windSpeed, inputs.windDirection, inputs.shotDirection, inputs.shotDistance);
        const temperatureEffect = this.calculateTemperatureEffect(inputs.temperature, inputs.shotDistance);
        const lateralMovement = this.calculateLateralMovement(inputs.windSpeed, inputs.windDirection, inputs.shotDirection);
        const adjustedDistance = this.calculateAdjustedDistance(inputs.shotDistance, windEffect, temperatureEffect);
        
        // Update display
        this.updateDisplay(inputs, windEffect, temperatureEffect, lateralMovement, adjustedDistance);
    }

    getInputValue(elementId, defaultValue) {
        const element = this.elements[elementId];
        if (!element) return defaultValue;
        const value = parseFloat(element.value);
        return isNaN(value) ? defaultValue : value;
    }

    calculateWindEffect(windSpeed, windDirection, shotDirection, shotDistance) {
        // Convert angles to radians
        const windAngle = (windDirection * Math.PI) / 180;
        const shotAngle = (shotDirection * Math.PI) / 180;

        // Calculate relative wind angle
        const relativeAngle = windAngle - shotAngle;

        // Calculate headwind/tailwind component
        const headwindComponent = windSpeed * Math.cos(relativeAngle);

        // Basic wind effect calculation (negative means headwind reduces distance)
        const windEffect = -(headwindComponent * 1.8); // 1.8 yards per mph of headwind

        return windEffect;
    }

    calculateTemperatureEffect(temperature, shotDistance) {
        // Base temperature is 70°F
        const baseTemp = 70;
        
        // Calculate temperature difference
        const tempDiff = temperature - baseTemp;
        
        // Each degree above/below base temp affects distance by 0.1%
        const tempEffect = (tempDiff * 0.001) * shotDistance;
        
        return tempEffect;
    }

    calculateLateralMovement(windSpeed, windDirection, shotDirection) {
        // Convert angles to radians
        const windAngle = (windDirection * Math.PI) / 180;
        const shotAngle = (shotDirection * Math.PI) / 180;

        // Calculate relative wind angle
        const relativeAngle = windAngle - shotAngle;

        // Calculate crosswind component
        const crosswindComponent = windSpeed * Math.sin(relativeAngle);

        // Basic crosswind effect calculation (positive means movement to the left)
        const lateralMovement = crosswindComponent * 2.0; // 2.0 yards per mph of crosswind

        return lateralMovement;
    }

    calculateAdjustedDistance(shotDistance, windEffect, temperatureEffect) {
        return shotDistance + windEffect + temperatureEffect;
    }

    updateDisplay(inputs, windEffect, temperatureEffect, lateralMovement, adjustedDistance) {
        // Ensure all values are numbers
        const totalEffect = (windEffect || 0) + (temperatureEffect || 0);
        
        // Update display elements with validation
        if (this.elements.adjustedDistance) {
            const distance = Math.round(adjustedDistance) || 0;
            this.elements.adjustedDistance.textContent = `${distance} yards`;
        }

        if (this.elements.distanceEffect) {
            const effect = Math.round(windEffect) || 0;
            const effectText = effect < 0 ? 'shorter' : 'longer';
            this.elements.distanceEffect.textContent = `${Math.abs(effect)} yards ${effectText}`;
        }

        if (this.elements.tempEffect) {
            const effect = Math.round(temperatureEffect) || 0;
            this.elements.tempEffect.textContent = `${effect} yards`;
        }

        if (this.elements.lateralEffect) {
            const effect = Math.round(lateralMovement) || 0;
            const directionText = effect > 0 ? 'left' : 'right';
            this.elements.lateralEffect.textContent = `${Math.abs(effect)} yards ${directionText}`;
        }
    }

    initializeElements() {
        console.log('Initializing elements...');
        
        // Input elements
        this.elements = {
            windSpeed: document.getElementById('wind-speed'),
            windDirection: document.getElementById('wind-direction'),
            shotDistance: document.getElementById('shot-distance'),
            shotHeight: document.getElementById('shot-height'),
            shotDirection: document.getElementById('shot-direction'),
            temperature: document.getElementById('temperature'),
            humidity: document.getElementById('humidity'),
            refreshButton: document.getElementById('refresh-button'),
            // Display elements
            adjustedDistance: document.getElementById('adjusted-distance'),
            distanceEffect: document.getElementById('distance-effect'),
            tempEffect: document.getElementById('temp-effect'),
            lateralEffect: document.getElementById('lateral-effect')
        };
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Add input event listeners to all input elements
        Object.entries(this.elements).forEach(([key, element]) => {
            if (element && element.tagName === 'INPUT') {
                element.addEventListener('input', () => this.updateCalculations());
            }
        });

        // Add refresh button listener
        if (this.elements.refreshButton) {
            this.elements.refreshButton.addEventListener('click', async () => {
                console.log('Refreshing weather data...');
                try {
                    const weatherData = await this.fetchWeatherDataForCurrentLocation();
                    this.updateWeatherDisplay(weatherData);
                } catch (error) {
                    console.error('Error refreshing weather data:', error);
                }
            });
        }
    }
}

// Initialize the calculator
new WindCalculator();
