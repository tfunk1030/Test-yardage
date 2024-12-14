// Wind calculation and UI handling
import { calculateWindEffect } from './calculations/wind-calculations.js';
import { calculateAirDensity } from './calculations/air-density-calculations.js';
import { calculateAltitudeEffect } from './calculations/core-calculations.js';

class WindCalculator {
    constructor() {
        console.log('Initializing WindCalculator...');
        this.initializeElements();
        this.setupChart();
        this.setupEventListeners();
        this.fetchWeatherData();
    }

    initializeElements() {
        console.log('Initializing elements...');
        // Input elements
        this.windSpeedInput = document.getElementById('wind-speed');
        this.windAngleInput = document.getElementById('wind-angle');
        this.shotDistanceInput = document.getElementById('shot-distance');
        this.shotHeightInput = document.getElementById('shot-height');
        this.shotDirectionInput = document.getElementById('shot-direction');

        // Display elements
        this.windSpeedDisplay = document.getElementById('current-wind-speed');
        this.windDirectionDisplay = document.getElementById('current-wind-direction');
        this.lastUpdatedDisplay = document.getElementById('last-updated');
        this.adjustedDistanceDisplay = document.getElementById('adjusted-distance');
        this.distanceEffectDisplay = document.getElementById('distance-effect');
        this.tempEffectDisplay = document.getElementById('temp-effect');
        this.lateralEffectDisplay = document.getElementById('lateral-effect');

        // Canvas element
        this.canvas = document.getElementById('shot-chart');
        if (!this.canvas) {
            console.error('Shot chart canvas not found');
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        // Log element states
        console.log('Elements initialized:', {
            windSpeedInput: !!this.windSpeedInput,
            windAngleInput: !!this.windAngleInput,
            shotDistanceInput: !!this.shotDistanceInput,
            shotHeightInput: !!this.shotHeightInput,
            shotDirectionInput: !!this.shotDirectionInput,
            canvas: !!this.canvas
        });
    }

    setupChart() {
        if (!this.ctx) {
            console.error('Chart context not available');
            return;
        }

        // Set canvas size
        this.canvas.width = 400;
        this.canvas.height = 400;

        // Initial draw
        this.drawChart();
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        // Add input event listeners
        const inputs = [
            this.windSpeedInput,
            this.windAngleInput,
            this.shotDistanceInput,
            this.shotHeightInput,
            this.shotDirectionInput
        ];

        inputs.forEach((input, index) => {
            if (input) {
                input.addEventListener('input', () => {
                    console.log(`Input changed: ${input.id}`);
                    this.handleWindChange();
                });
            } else {
                console.error(`Input element at index ${index} not found`);
            }
        });

        // Add refresh button listener
        const refreshButton = document.getElementById('refresh-weather');
        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                console.log('Refresh button clicked');
                this.fetchWeatherData();
            });
        } else {
            console.error('Refresh button not found');
        }
    }

    drawChart() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw compass circle
        this.ctx.beginPath();
        this.ctx.arc(200, 200, 180, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#ccc';
        this.ctx.stroke();

        // Draw compass points
        this.drawCompassPoint('N', 200, 20);
        this.drawCompassPoint('E', 380, 200);
        this.drawCompassPoint('S', 200, 380);
        this.drawCompassPoint('W', 20, 200);

        // Draw wind vector if we have data
        if (this.windSpeedInput && this.windAngleInput) {
            const windSpeed = parseFloat(this.windSpeedInput.value) || 0;
            const windAngle = parseFloat(this.windAngleInput.value) || 0;
            this.drawWindVector(windSpeed, windAngle);
        }

        // Draw shot vector if we have data
        if (this.shotDistanceInput && this.shotDirectionInput) {
            const shotDistance = parseFloat(this.shotDistanceInput.value) || 0;
            const shotDirection = parseFloat(this.shotDirectionInput.value) || 0;
            this.drawShotVector(shotDistance, shotDirection);
        }
    }

    drawCompassPoint(label, x, y) {
        if (!this.ctx) return;
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#666';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(label, x, y);
    }

    drawWindVector(speed, angle) {
        if (!this.ctx) return;
        console.log('Drawing wind vector:', { speed, angle });

        const radians = (angle - 90) * (Math.PI / 180);
        const length = Math.min(speed * 5, 150);
        
        const startX = 200;
        const startY = 200;
        const endX = startX + length * Math.cos(radians);
        const endY = startY + length * Math.sin(radians);

        // Draw arrow line
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'blue';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrow head
        const headLength = 10;
        const angle1 = radians - Math.PI / 6;
        const angle2 = radians + Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle1),
            endY - headLength * Math.sin(angle1)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle2),
            endY - headLength * Math.sin(angle2)
        );
        this.ctx.stroke();
    }

    drawShotVector(distance, direction) {
        if (!this.ctx) return;
        console.log('Drawing shot vector:', { distance, direction });

        const radians = (direction - 90) * (Math.PI / 180);
        const length = Math.min(distance / 2, 150);
        
        const startX = 200;
        const startY = 200;
        const endX = startX + length * Math.cos(radians);
        const endY = startY + length * Math.sin(radians);

        // Draw arrow line
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = 'red';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw arrow head
        const headLength = 10;
        const angle1 = radians - Math.PI / 6;
        const angle2 = radians + Math.PI / 6;

        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle1),
            endY - headLength * Math.sin(angle1)
        );
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(
            endX - headLength * Math.cos(angle2),
            endY - headLength * Math.sin(angle2)
        );
        this.ctx.stroke();
    }

    updateShotPath() {
        console.log('Updating shot path...');
        if (!this.ctx) {
            console.error('Chart not initialized');
            return;
        }

        // Get input values
        const windSpeed = parseFloat(this.windSpeedInput?.value) || 0;
        const windDirection = parseFloat(this.windAngleInput?.value) || 0;
        const shotDistance = parseFloat(this.shotDistanceInput?.value) || 0;
        const shotHeight = parseFloat(this.shotHeightInput?.value) || 0;
        const shotDirection = parseFloat(this.shotDirectionInput?.value) || 0;

        console.log('Input values:', {
            windSpeed,
            windDirection,
            shotDistance,
            shotHeight,
            shotDirection
        });

        // Get weather data from cache if available
        const weatherData = this.getCachedWeather();
        const temperature = weatherData?.values?.temperature || 70;
        const pressure = weatherData?.values?.pressureSeaLevel || 29.92;
        const humidity = weatherData?.values?.humidity || 0;
        const altitude = weatherData?.values?.altitude || 0;

        // Calculate wind effects
        const windEffects = calculateWindEffect(windSpeed, windDirection, shotDistance, shotHeight);
        
        // Calculate air density effects
        const airDensity = calculateAirDensity(temperature, pressure, humidity);
        
        // Calculate altitude effects
        const altitudeEffects = calculateAltitudeEffect(altitude);

        // Calculate total effects
        const windDistanceEffect = windEffects.distance * shotDistance;
        const lateralEffect = windEffects.lateral * shotDistance;
        const airDensityEffect = (airDensity - 1) * shotDistance;
        const altitudeEffect = (altitudeEffects.total - 1) * shotDistance;

        // Calculate final adjusted distance
        const adjustedDistance = Math.round(shotDistance + windDistanceEffect + airDensityEffect + altitudeEffect);

        // Update displays
        if (this.adjustedDistanceDisplay) {
            this.adjustedDistanceDisplay.textContent = `${adjustedDistance} yards`;
        }
        
        if (this.distanceEffectDisplay) {
            this.distanceEffectDisplay.textContent = `${Math.round(windDistanceEffect)} yards`;
        }

        if (this.tempEffectDisplay) {
            this.tempEffectDisplay.textContent = `${Math.round(airDensityEffect + altitudeEffect)} yards`;
        }
        
        if (this.lateralEffectDisplay) {
            const lateralEffectText = lateralEffect > 0 ? 'right' : 'left';
            this.lateralEffectDisplay.textContent = `${Math.round(lateralEffect)} yards ${lateralEffectText}`;
        }

        // Redraw chart
        this.drawChart();
    }

    async fetchWeatherData() {
        try {
            console.log('Fetching weather data...');
            // Check for cached weather data first
            const cachedData = localStorage.getItem('weatherData');
            if (cachedData) {
                const weatherData = JSON.parse(cachedData);
                const now = new Date().getTime();
                const isExpired = (now - weatherData.timestamp) > weatherData.expiresIn;

                if (!isExpired) {
                    console.log('Using cached weather data for wind calculations');
                    const data = weatherData.data;
                    
                    // Update UI with weather data
                    if (this.windSpeedInput) this.windSpeedInput.value = Math.round(data.values.windSpeed);
                    if (this.windAngleInput) this.windAngleInput.value = data.values.windDirection;
                    if (this.windSpeedDisplay) this.windSpeedDisplay.textContent = `${Math.round(data.values.windSpeed)} mph`;
                    if (this.windDirectionDisplay) this.windDirectionDisplay.textContent = this.getDirectionLabel(data.values.windDirection);
                    if (this.lastUpdatedDisplay) this.lastUpdatedDisplay.textContent = `Updated: ${new Date(weatherData.timestamp).toLocaleTimeString()}`;
                    
                    // Store temperature for later use
                    this.currentTemperature = data.values.temperature;
                    
                    // Update calculations
                    this.handleWindChange();
                    return;
                }
            }

            // If no cached data or expired, fetch new data
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            const url = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&units=imperial&apikey=jG9onLuVeiR4NWlVIO85EWWLCtQ2Uzqv`;
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Weather data fetch failed');
            }
            
            const data = await response.json();
            console.log('Weather data fetched:', data);
            
            // Update UI with weather data
            if (this.windSpeedInput) this.windSpeedInput.value = Math.round(data.data.values.windSpeed);
            if (this.windAngleInput) this.windAngleInput.value = data.data.values.windDirection;
            if (this.windSpeedDisplay) this.windSpeedDisplay.textContent = `${Math.round(data.data.values.windSpeed)} mph`;
            if (this.windDirectionDisplay) this.windDirectionDisplay.textContent = this.getDirectionLabel(data.data.values.windDirection);
            if (this.lastUpdatedDisplay) this.lastUpdatedDisplay.textContent = `Updated: ${new Date().toLocaleTimeString()}`;
            
            // Store temperature for later use
            this.currentTemperature = data.data.values.temperature;
            
            // Update calculations
            this.handleWindChange();
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.updateWithMockData();
        }
    }

    updateWithMockData() {
        console.log('Using mock data...');
        // Mock data for testing
        const mockWindSpeed = 10;
        const mockWindDirection = 45;
        this.currentTemperature = 70; // Default temperature

        if (this.windSpeedInput) this.windSpeedInput.value = mockWindSpeed;
        if (this.windAngleInput) this.windAngleInput.value = mockWindDirection;
        if (this.windSpeedDisplay) this.windSpeedDisplay.textContent = `${mockWindSpeed} mph`;
        if (this.windDirectionDisplay) this.windDirectionDisplay.textContent = this.getDirectionLabel(mockWindDirection);
        if (this.lastUpdatedDisplay) this.lastUpdatedDisplay.textContent = 'Using mock data';

        // Update calculations with mock data
        this.handleWindChange();
    }

    getCachedWeather() {
        try {
            const cachedData = localStorage.getItem('weatherData');
            if (!cachedData) {
                console.log('No cached weather data found');
                return null;
            }

            const { data, timestamp } = JSON.parse(cachedData);
            const cacheAge = Date.now() - timestamp;
            const cacheTimeout = 30 * 60 * 1000; // 30 minutes

            if (cacheAge >= cacheTimeout) {
                console.log('Weather cache expired:', {
                    cacheAge: Math.round(cacheAge / 1000 / 60) + ' minutes',
                    timeout: Math.round(cacheTimeout / 1000 / 60) + ' minutes'
                });
                localStorage.removeItem('weatherData');
                return null;
            }

            console.log('Using cached weather data:', {
                data,
                cacheAge: Math.round(cacheAge / 1000 / 60) + ' minutes',
                expiresIn: Math.round((cacheTimeout - cacheAge) / 1000 / 60) + ' minutes'
            });

            return data;
        } catch (error) {
            console.error('Error reading weather cache:', error);
            localStorage.removeItem('weatherData');
            return null;
        }
    }

    getDirectionLabel(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    handleWindChange() {
        console.log('Wind changed, updating shot path...');
        this.updateShotPath();
    }
}

// Initialize the calculator when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing WindCalculator...');
    new WindCalculator();
});

export default WindCalculator;
