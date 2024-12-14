// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

import WindCalculator from './wind.js';

// Initialize web worker for calculations
const calculationWorker = new Worker('calculations-worker.js', { type: 'module' });
const pendingCalculations = new Map();
const calculationCache = new Map();

// Handle worker messages
calculationWorker.onmessage = function(e) {
    const { results, id, error, cached } = e.data;
    const callback = pendingCalculations.get(id);
    
    if (callback) {
        if (error) {
            callback.reject(new Error(error));
        } else {
            // Update UI with loading state if not cached
            if (!cached) {
                updateLoadingState(false);
            }
            callback.resolve(results);
        }
        pendingCalculations.delete(id);
    }
};

// Error handler for worker
calculationWorker.onerror = function(error) {
    console.error('Worker error:', error);
    updateLoadingState(false);
    showErrorMessage('Calculation error occurred. Please try again.');
};

// Function to perform calculations using worker
function calculateWithWorker(conditions) {
    return new Promise((resolve, reject) => {
        const id = Date.now().toString();
        
        // Show loading state
        updateLoadingState(true);
        
        // Store promise callbacks
        pendingCalculations.set(id, { resolve, reject });
        
        // Send calculation request to worker
        calculationWorker.postMessage({ conditions, id });
    });
}

// Update loading state
function updateLoadingState(isLoading) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }
    
    // Disable inputs while loading
    document.querySelectorAll('.input-field').forEach(input => {
        input.disabled = isLoading;
    });
}

// Cache DOM elements
const DOM = {
    altitude: document.getElementById('altitude'),
    humidity: document.getElementById('humidity'),
    temperature: document.getElementById('temperature'),
    windSpeed: document.getElementById('wind-speed'),
    windDirection: document.getElementById('wind-direction'),
    shotHeight: document.getElementById('shot-height'),
    clubs: document.getElementById('clubs'),
    environmentalEffect: document.getElementById('environmental-effect'),
    shotChart: document.getElementById('shotChart'),
    windDistanceEffect: document.getElementById('windDistanceEffect'),
    windLateralEffect: document.getElementById('windLateralEffect'),
    maxHeight: document.getElementById('maxHeight'),
    landingAngle: document.getElementById('landingAngle'),
    finalCarry: document.getElementById('finalCarry'),
    finalTotal: document.getElementById('finalTotal'),
    loadingIndicator: document.getElementById('loading-indicator')
};

// Initialize shot visualization chart
let shotChart;

function initializeChart() {
    if (!DOM.shotChart) return;
    const ctx = DOM.shotChart.getContext('2d');
    shotChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Shot Trajectory',
                data: [],
                borderColor: 'rgb(14, 165, 233)',
                backgroundColor: 'rgba(14, 165, 233, 0.5)',
                showLine: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Distance (yards)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Height (yards)'
                    }
                }
            }
        }
    });
}

// Update the UI when conditions change
async function updateCalculations() {
    if (!validateInputs()) return;
    
    try {
        const conditions = {
            temperature: parseFloat(DOM.temperature.value),
            humidity: parseFloat(DOM.humidity.value),
            altitude: parseFloat(DOM.altitude.value),
            windSpeed: parseFloat(DOM.windSpeed.value),
            windDirection: DOM.windDirection.value,
            shotHeight: DOM.shotHeight.value
        };
        
        // Store current conditions in local storage
        localStorage.setItem('lastConditions', JSON.stringify(conditions));
        
        // Perform calculations in web worker
        const results = await calculateWithWorker(conditions);
        
        // Update UI with results
        updateUI(results);
        updateShotVisualization(results.trajectory);
        updateEnvironmentalEffect(results);
        
    } catch (error) {
        console.error('Calculation error:', error);
        showErrorMessage(error.message);
    }
}

// Update shot trajectory visualization
function updateShotVisualization(trajectory) {
    if (!shotChart) return;
    
    shotChart.data.datasets[0].data = trajectory.points.map(point => ({
        x: point.x,
        y: point.y
    }));
    shotChart.update();
}

// Update environmental effect display
function updateEnvironmentalEffect(results) {
    if (!DOM.environmentalEffect) return;
    
    const percentChange = ((results.factor - 1) * 100).toFixed(1);
    const direction = results.factor > 1 ? 'increase' : 'decrease';
    
    let effectText = `
        <div class="font-medium mb-2">Environmental Effects:</div>
        <div class="grid grid-cols-2 gap-4">
            <div>
                <h3 class="font-medium">Conditions:</h3>
                <ul class="space-y-1">
                    <li>Temperature: ${results.components.temperature}°F</li>
                    <li>Humidity: ${results.components.humidity}%</li>
                    <li>Altitude: ${results.components.altitude}ft</li>
                    <li>Wind: ${results.components.windSpeed}mph ${results.components.windDirection}</li>
                </ul>
            </div>
            <div>
                <h3 class="font-medium">Adjustments:</h3>
                <ul class="space-y-1">
                    <li>Air Density: ${(results.components.airDensity * 100 - 100).toFixed(1)}%</li>
                    <li>Wind Effect: ${(results.components.wind.distanceEffect * 100).toFixed(1)}%</li>
                    <li>Total: ${Math.abs(percentChange)}% ${direction}</li>
                </ul>
            </div>
        </div>
    `;
    
    DOM.environmentalEffect.innerHTML = effectText;
}

// Update UI with calculation results
function updateUI(results) {
    if (!results) return;
    
    // Update wind effects
    if (DOM.windDistanceEffect) {
        DOM.windDistanceEffect.textContent = 
            `${results.windEffect.distanceEffect > 0 ? '+' : ''}${(results.windEffect.distanceEffect * 100).toFixed(1)}%`;
    }
    
    if (DOM.windLateralEffect) {
        DOM.windLateralEffect.textContent = 
            `${results.windEffect.lateralEffect > 0 ? 'Right ' : 'Left '}${Math.abs(Math.round(results.carryDistance * results.windEffect.lateralEffect))} yards`;
    }
    
    // Update trajectory info
    if (DOM.maxHeight) {
        DOM.maxHeight.textContent = `${Math.round(results.maxHeight)} feet`;
    }
    
    if (DOM.landingAngle) {
        DOM.landingAngle.textContent = `${Math.round(results.landingAngle)}°`;
    }
    
    // Update distances
    if (DOM.finalCarry) {
        DOM.finalCarry.textContent = `${Math.round(results.carryDistance)} yards`;
    }
    
    if (DOM.finalTotal) {
        const totalDistance = Math.round(results.carryDistance * (1 + (results.rollout || 0)));
        DOM.finalTotal.textContent = `${totalDistance} yards`;
    }
}

// Validate input values
function validateInputs() {
    const validators = {
        temperature: { min: -50, max: 120, message: 'Temperature must be between -50°F and 120°F' },
        humidity: { min: 0, max: 100, message: 'Humidity must be between 0% and 100%' },
        altitude: { min: -1000, max: 15000, message: 'Altitude must be between -1000ft and 15000ft' },
        windSpeed: { min: 0, max: 50, message: 'Wind speed must be between 0mph and 50mph' }
    };
    
    let isValid = true;
    
    Object.entries(validators).forEach(([field, rules]) => {
        const element = DOM[field];
        if (!element) return;
        
        const value = parseFloat(element.value);
        if (isNaN(value) || value < rules.min || value > rules.max) {
            showErrorMessage(rules.message);
            element.classList.add('error');
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });
    
    return isValid;
}

// Show error message
function showErrorMessage(message) {
    alert(message);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    setupEventListeners();
    loadLastConditions();
    
    // Initialize wind calculator if on wind page
    if (window.location.pathname.includes('wind.html')) {
        new WindCalculator();
    }
    
    window.golfApp = new GolfApp();
});

// Set up event listeners
function setupEventListeners() {
    // Update calculations when inputs change
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('change', debounce(updateCalculations, 500));
    });
    
    // Get weather button
    const getWeatherBtn = document.getElementById('get-weather');
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', getCurrentWeather);
    }
}

// Load last used conditions
function loadLastConditions() {
    const lastConditions = localStorage.getItem('lastConditions');
    if (lastConditions) {
        const conditions = JSON.parse(lastConditions);
        Object.entries(conditions).forEach(([key, value]) => {
            const element = DOM[key];
            if (element) {
                element.value = value;
            }
        });
        updateCalculations();
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

class GolfApp {
    constructor() {
        this.clubs = [
            { name: 'Driver', distance: 260 },
            { name: '3-Wood', distance: 230 },
            { name: '5-Wood', distance: 210 },
            { name: '4-Iron', distance: 190 },
            { name: '5-Iron', distance: 180 },
            { name: '6-Iron', distance: 170 },
            { name: '7-Iron', distance: 160 },
            { name: '8-Iron', distance: 150 },
            { name: '9-Iron', distance: 140 },
            { name: 'PW', distance: 130 },
            { name: 'GW', distance: 120 },
            { name: 'SW', distance: 110 },
            { name: 'LW', distance: 90 }
        ];
        
        this.recentCalculations = [];
        this.initializeApp();
    }

    initializeApp() {
        this.renderClubs();
        this.fetchWeather();
        this.setupEventListeners();
        this.loadRecentCalculations();
    }

    renderClubs() {
        const clubList = document.getElementById('club-list');
        if (!clubList) return;

        clubList.innerHTML = this.clubs.map(club => `
            <div class="flex justify-between items-center p-3 bg-gray-700/50 rounded-xl">
                <span class="text-gray-200">${club.name}</span>
                <span class="text-green-400">${club.distance} yards</span>
            </div>
        `).join('');
    }

    async fetchWeather() {
        try {
            // Get user's location
            let lat = process.env.DEFAULT_LAT;
            let lon = process.env.DEFAULT_LON;

            try {
                if (navigator.geolocation) {
                    const position = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    lat = position.coords.latitude;
                    lon = position.coords.longitude;
                }
            } catch (error) {
                console.warn('Using default location:', error);
            }

            const apiKey = process.env.WEATHER_API_KEY;
            if (!apiKey) {
                throw new Error('Weather API key not configured');
            }

            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
            );

            if (!response.ok) {
                throw new Error('Weather data fetch failed');
            }

            const data = await response.json();
            this.updateWeatherDisplay(data);
        } catch (error) {
            console.error('Error fetching weather:', error);
            this.updateWithMockWeather();
        }
    }

    updateWeatherDisplay(data) {
        // Update current wind preview
        const currentWind = document.getElementById('current-wind');
        if (currentWind) {
            currentWind.textContent = `${Math.round(data.wind.speed)} mph ${this.getWindDirection(data.wind.deg)}`;
        }

        // Update detailed weather info
        const temperature = document.getElementById('temperature');
        const wind = document.getElementById('wind');
        const humidity = document.getElementById('humidity');
        const pressure = document.getElementById('pressure');

        if (temperature) temperature.textContent = `${Math.round(data.main.temp)}°F`;
        if (wind) wind.textContent = `${Math.round(data.wind.speed)} mph`;
        if (humidity) humidity.textContent = `${data.main.humidity}%`;
        if (pressure) pressure.textContent = `${data.main.pressure} hPa`;
    }

    updateWithMockWeather() {
        const mockData = {
            main: {
                temp: 72,
                humidity: 65,
                pressure: 1013
            },
            wind: {
                speed: 10,
                deg: 45
            }
        };
        this.updateWeatherDisplay(mockData);
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                          'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(((degrees % 360) / 22.5)) % 16;
        return directions[index];
    }

    addClub() {
        const name = prompt('Enter club name:');
        const distance = parseInt(prompt('Enter typical distance (yards):'));
        
        if (name && !isNaN(distance)) {
            this.clubs.push({ name, distance });
            this.renderClubs();
            this.saveClubs();
        }
    }

    saveClubs() {
        localStorage.setItem('golfClubs', JSON.stringify(this.clubs));
    }

    loadClubs() {
        const saved = localStorage.getItem('golfClubs');
        if (saved) {
            this.clubs = JSON.parse(saved);
            this.renderClubs();
        }
    }

    addRecentCalculation(calculation) {
        this.recentCalculations.unshift(calculation);
        if (this.recentCalculations.length > 5) {
            this.recentCalculations.pop();
        }
        this.renderRecentCalculations();
        this.saveRecentCalculations();
    }

    renderRecentCalculations() {
        const recentCalcs = document.getElementById('recent-calcs');
        if (!recentCalcs) return;

        recentCalcs.innerHTML = this.recentCalculations.length ? 
            this.recentCalculations.map(calc => `
                <div class="flex justify-between items-center p-4 bg-gray-700/50 rounded-xl">
                    <div>
                        <div class="text-white">${calc.club} • ${calc.distance} yards</div>
                        <div class="text-sm text-gray-400">Wind: ${calc.wind} mph ${calc.direction}</div>
                    </div>
                    <div class="text-green-400">${calc.adjustment}</div>
                </div>
            `).join('') :
            '<div class="text-gray-400 text-center p-4">No recent calculations</div>';
    }

    saveRecentCalculations() {
        localStorage.setItem('recentCalculations', JSON.stringify(this.recentCalculations));
    }

    loadRecentCalculations() {
        const saved = localStorage.getItem('recentCalculations');
        if (saved) {
            this.recentCalculations = JSON.parse(saved);
            this.renderRecentCalculations();
        }
    }

    setupEventListeners() {
        // Add club button
        window.addClub = () => this.addClub();
        
        // Refresh weather button
        window.refreshWeather = () => this.fetchWeather();
    }
}

// Weather functionality
document.addEventListener('DOMContentLoaded', () => {
    const weatherButton = document.getElementById('get-weather');
    const weatherDisplay = document.getElementById('weather-display');
    const lastUpdated = document.getElementById('last-updated');
    const tempDisplay = document.getElementById('temperature');
    const windDisplay = document.getElementById('wind');
    const humidityDisplay = document.getElementById('humidity');
    const pressureDisplay = document.getElementById('pressure');

    // Error handling function
    function showErrorMessage(message) {
        alert(message);
    }

    function saveWeatherData(data) {
        const weatherData = {
            data: data,
            timestamp: new Date().getTime(),
            expiresIn: 30 * 60 * 1000 // 30 minutes in milliseconds
        };
        localStorage.setItem('weatherData', JSON.stringify(weatherData));
    }

    function getStoredWeatherData() {
        const storedData = localStorage.getItem('weatherData');
        if (!storedData) return null;

        const weatherData = JSON.parse(storedData);
        const now = new Date().getTime();
        const isExpired = (now - weatherData.timestamp) > weatherData.expiresIn;

        if (isExpired) {
            localStorage.removeItem('weatherData');
            return null;
        }

        return weatherData.data;
    }

    function updateWeatherDisplay(data) {
        tempDisplay.textContent = `${Math.round(data.values.temperature)}°F`;
        windDisplay.textContent = `${Math.round(data.values.windSpeed)} mph ${getWindDirection(data.values.windDirection)}`;
        humidityDisplay.textContent = `${Math.round(data.values.humidity)}%`;
        pressureDisplay.textContent = `${Math.round(data.values.pressureSurfaceLevel)} hPa`;

        weatherDisplay.classList.remove('hidden');
        const timestamp = new Date(data.time || new Date()).toLocaleTimeString();
        lastUpdated.textContent = `Updated ${timestamp}`;
    }

    async function getWeather() {
        try {
            // Check for cached weather data first
            const cachedData = getStoredWeatherData();
            if (cachedData) {
                console.log('Using cached weather data');
                updateWeatherDisplay(cachedData);
                return;
            }

            weatherButton.disabled = true;
            weatherButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            // Get the user's location
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            console.log('Location:', { latitude, longitude });
            
            // Call Tomorrow.io API
            const url = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&units=imperial&apikey=jG9onLuVeiR4NWlVIO85EWWLCtQ2Uzqv`;
            console.log('API URL:', url);

            const response = await fetch(url);
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                throw new Error(`Weather API request failed: ${response.status} ${errorText}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data);

            // Save the weather data
            saveWeatherData(data.data);
            
            // Update display
            updateWeatherDisplay(data.data);

        } catch (error) {
            console.error('Detailed error:', error);
            showErrorMessage(`Unable to fetch weather data: ${error.message}`);
        } finally {
            weatherButton.disabled = false;
            weatherButton.innerHTML = '<i class="fas fa-location-arrow"></i> Get Current Weather';
        }
    }

    function getWindDirection(degrees) {
        const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const index = Math.round(degrees / 22.5) % 16;
        return directions[index];
    }

    // Event listeners
    if (weatherButton) {
        weatherButton.addEventListener('click', getWeather);
        
        // Check for cached weather data on page load
        const cachedData = getStoredWeatherData();
        if (cachedData) {
            updateWeatherDisplay(cachedData);
        }
    }
});
