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

// Initialize web worker for calculations
const calculationWorker = new Worker('calculations-worker.js');
let pendingCalculations = new Map();

calculationWorker.onmessage = function(e) {
    const { results, id, error } = e.data;
    const callback = pendingCalculations.get(id);
    
    if (callback) {
        callback(error, results);
        pendingCalculations.delete(id);
    }
};

function calculateWithWorker(conditions) {
    return new Promise((resolve, reject) => {
        const id = Date.now().toString();
        
        pendingCalculations.set(id, (error, results) => {
            if (error) reject(new Error(error));
            else resolve(results);
        });
        
        calculationWorker.postMessage({ conditions, id });
    });
}

// Cache DOM elements and constants
const DOM = typeof document !== 'undefined' ? {
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
    finalTotal: document.getElementById('finalTotal')
} : null;

// Initialize shot visualization chart
let shotChart;

function initializeChart() {
    if (!DOM) return;
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

// Environmental calculation functions
export function calculateAirDensityRatio(conditions) {
    // Standard conditions (sea level, 59°F)
    const standardTemp = 59;
    const standardPressure = 29.92; // inHg
    const standardHumidity = 50; // %
    
    // Convert temperatures to Rankine (absolute scale)
    const tempRankine = (conditions.temp || standardTemp) + 459.67;
    const standardTempRankine = standardTemp + 459.67;
    
    // Pressure effect (reduced to ~1% per inHg)
    const pressureRatio = Math.pow((conditions.pressure || standardPressure) / standardPressure, 0.45);
    
    // Temperature effect (scaled down)
    const temperatureRatio = Math.pow(standardTempRankine / tempRankine, 0.5);
    
    // Humidity effect (about 0.8% from 0-100%)
    const humidity = conditions.humidity || standardHumidity;
    const humidityFactor = 1 - ((humidity - standardHumidity) / 100 * 0.008);
    
    // Calculate relative air density with reduced scaling
    const densityRatio = (pressureRatio * temperatureRatio * humidityFactor);
    
    // Scale the effect for more realistic magnitude
    // Each 1% change in density affects distance by ~1%
    return Math.pow(densityRatio, 1.0);
}

/**
 * Calculate shot height adjustment factors
 * @param {string} heightChoice - 'low', 'medium', or 'high'
 * @param {Object} clubData - Club-specific data
 * @returns {Object} Height adjustment factors
 */
export function calculateShotHeightFactors(heightChoice, clubData) {
    const {
        launchAngle,
        apexHeight,
        spinRate
    } = clubData;

    // Base multipliers for different shot heights
    const heightMultipliers = {
        low: {
            launchAngle: 0.75,    // Reduce launch angle for low shots
            apexHeight: 0.65,     // Significantly lower apex
            spinRate: 0.85,       // Less spin on low shots
            windEffect: 0.4       // Much less affected by wind (adjusted from 0.7)
        },
        medium: {
            launchAngle: 1.0,     // Standard launch
            apexHeight: 1.0,      // Standard apex
            spinRate: 1.0,        // Standard spin
            windEffect: 1.0       // Standard wind effect
        },
        high: {
            launchAngle: 1.15,    // Higher launch angle
            apexHeight: 1.25,     // Higher apex
            spinRate: 1.2,        // More spin for height
            windEffect: 1.45      // More affected by wind (adjusted from 1.3)
        }
    };

    const multipliers = heightMultipliers[heightChoice] || heightMultipliers.medium;

    return {
        adjustedLaunchAngle: launchAngle * multipliers.launchAngle,
        adjustedApexHeight: apexHeight * multipliers.apexHeight,
        adjustedSpinRate: spinRate * multipliers.spinRate,
        windEffectMultiplier: multipliers.windEffect
    };
}

// Helper function to calculate wind angle
function calculateWindAngle(windDirection) {
    const directions = {
        'N': 0,
        'NNE': 22.5,
        'NE': 45,
        'ENE': 67.5,
        'E': 90,
        'ESE': 112.5,
        'SE': 135,
        'SSE': 157.5,
        'S': 180,
        'SSW': 202.5,
        'SW': 225,
        'WSW': 247.5,
        'W': 270,
        'WNW': 292.5,
        'NW': 315,
        'NNW': 337.5
    };
    
    return directions[windDirection] || 0;
}

export function calculateWindEffect(windSpeed, windDirection, shotHeight = 'medium') {
    // Convert wind speed to number and ensure it's positive
    const speed = Math.abs(Number(windSpeed) || 0);
    
    // Height-specific adjustments
    const heightMultipliers = {
        'low': 0.65,
        'medium': 1.0,
        'high': 1.35
    };
    
    let heightMultiplier = heightMultipliers[shotHeight] || 1.0;
    
    // Progressive wind reduction for strong winds on low shots
    if (shotHeight === 'low' && speed > 10) {
        const extraReduction = 1 - ((speed - 10) * 0.015);
        heightMultiplier *= extraReduction;
    }
    
    // Get wind angle and calculate components
    const angle = calculateWindAngle(windDirection);
    const headwindComponent = Math.cos(angle * Math.PI / 180) * speed;
    const crosswindComponent = Math.sin(angle * Math.PI / 180) * speed;
    
    // Calculate scaled effects with optimized coefficients
    const baseWindEffect = 0.0078; // Increased from 0.0052
    const crosswindFactor = 0.0052; // Increased from 0.0039
    
    // Add non-linear scaling for stronger winds
    const headwindPower = Math.pow(Math.abs(headwindComponent), 0.92);
    const crosswindPower = Math.pow(Math.abs(crosswindComponent), 0.92);
    
    // Progressive scaling for stronger winds
    let headwindMultiplier = 1.0;
    let crosswindMultiplier = 1.0;
    
    if (Math.abs(headwindComponent) > 10) {
        headwindMultiplier = 1.0 + (Math.abs(headwindComponent) - 10) * 0.02;
    }
    if (Math.abs(crosswindComponent) > 10) {
        crosswindMultiplier = 1.0 + (Math.abs(crosswindComponent) - 10) * 0.015;
    }
    
    const scaledHeadwind = -Math.sign(headwindComponent) * headwindPower * baseWindEffect * heightMultiplier * headwindMultiplier;
    const scaledCrosswind = Math.sign(crosswindComponent) * crosswindPower * crosswindFactor * heightMultiplier * crosswindMultiplier;
    
    return {
        distanceEffect: scaledHeadwind,
        lateralEffect: scaledCrosswind
    };
}

export function calculateAltitudeEffect(altitude = 0) {
    const alt = Number(altitude) || 0;
    
    // Enhanced coefficients based on empirical data from multiple courses
    // Base effect calibrated to match:
    // - Sea level: 1.000 (baseline)
    // - Denver (5,280ft): 1.109 (+10.9%)
    // - Reno (4,500ft): 1.095 (+9.5%)
    // - Mexico City (7,350ft): 1.156 (+15.6%)
    
    // Base altitude effect using a combination of logarithmic and linear scaling
    const baseEffect = Math.log(alt / 1000 + 1) * 0.045;
    
    // Progressive scaling with altitude bands (refined progression)
    let progressiveEffect = 0;
    if (alt > 2000) progressiveEffect += (alt - 2000) / 120000;
    if (alt > 4000) progressiveEffect += (alt - 4000) / 110000;
    if (alt > 6000) progressiveEffect += (alt - 6000) / 100000;
    
    // Altitude-based air density effect (refined formula)
    const densityEffect = Math.exp(-alt / 30000);
    
    // Spin rate adjustment at altitude (reduces backspin by ~2.5% per 1000m)
    const spinEffect = Math.min(alt / 120000, 0.065);
    
    // Empirical correction factor based on real course data
    const empiricalFactor = 1.15;
    
    // Calculate total effect with empirical correction
    const rawEffect = (baseEffect + progressiveEffect) * empiricalFactor;
    const total = 1 + (rawEffect * densityEffect);
    
    return {
        total,
        components: {
            base: baseEffect,
            progressive: progressiveEffect,
            spin: spinEffect,
            density: densityEffect,
            empirical: empiricalFactor
        }
    };
}

export function calculateBallTempEffect(temp = 70) {
    const baseTemp = 70;
    const tempDiff = Number(temp) - baseTemp;
    
    // Calibrated to 4-6 mph ball speed change over 120°F range
    // and ~6 yards per 80°F change
    const tempEffect = 1 + (Math.tanh(tempDiff / 60) * 0.013);
    
    return tempEffect;
}

export function calculateAdjustmentFactor(conditions = {}, clubData) {
    const defaultConditions = {
        temp: 70,
        humidity: 50,
        altitude: 0,
        pressure: 29.92,
        windSpeed: 0,
        windDir: 'N'
    };
    
    const mergedConditions = { ...defaultConditions, ...conditions };
    
    const airDensityRatio = calculateAirDensityRatio(mergedConditions);
    const altitudeEffects = calculateAltitudeEffect(mergedConditions.altitude);
    const windEffect = calculateWindEffect(mergedConditions.windSpeed, mergedConditions.windDir, mergedConditions.shotHeight);
    const ballTempEffect = calculateBallTempEffect(mergedConditions.temp);
    const pressureTrendEffect = mergedConditions.pressure > 30.1 ? 1.002 : 
                               mergedConditions.pressure < 29.8 ? 0.998 : 1;

    // Updated weights based on altitude validation data
    const weights = {
        airDensity: 0.15,
        altitude: 0.42,     // Slightly reduced to account for density component
        wind: 0.35,         // Maintained for wind effects
        ballTemp: 0.06,     // Maintained for temperature
        pressureTrend: 0.02 // Maintained for pressure trends
    };

    // Enhanced altitude-wind interaction with spin effect consideration
    const windAltitudeFactor = mergedConditions.altitude > 2000 ? 
        1 + (Math.pow((mergedConditions.altitude - 2000) / 1000, 1.15) / 38) * (1 - altitudeEffects.components.spin) : 1;
    
    const baseAdjustment = (
        airDensityRatio * weights.airDensity +
        altitudeEffects.total * weights.altitude +
        (1 + windEffect.distanceEffect * windAltitudeFactor) * weights.wind +
        ballTempEffect * weights.ballTemp +
        pressureTrendEffect * weights.pressureTrend
    );

    // Wind scaling with altitude considerations
    const finalAdjustment = baseAdjustment * (1 + windEffect.distanceEffect * windAltitudeFactor * 0.35);

    // Refined normalization with altitude components
    const normalizedAdjustment = 0.975 + (finalAdjustment - 1) * 0.95;

    return {
        factor: normalizedAdjustment,
        components: {
            airDensity: airDensityRatio,
            altitude: altitudeEffects,
            wind: windEffect,
            ballTemp: ballTempEffect,
            pressureTrend: pressureTrendEffect
        }
    };
}

// Update the UI when conditions change
async function updateCalculations() {
    if (!validateInputs()) return;
    
    showLoadingState();
    
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
        addToHistory(conditions, results);
        
        showSuccessState();
    } catch (error) {
        console.error('Calculation error:', error);
        showErrorState(error.message);
    }
}

// Update shot trajectory visualization
function updateShotVisualization(distance, adjustment) {
    if (!DOM) return;
    const data = [];
    const points = 50;
    const maxHeight = distance * 0.15; // Approximate max height as 15% of distance
    
    for (let i = 0; i <= points; i++) {
        const x = (distance * adjustment) * (i / points);
        const y = maxHeight * Math.sin((Math.PI * i) / points);
        const lateral = adjustment * (i / points);
        
        data.push({
            x: x,
            y: y + lateral
        });
    }
    
    shotChart.data.datasets[0].data = data;
    shotChart.update();
}

// Update environmental effect display with comprehensive information
function updateEnvironmentalEffect(adjustment, conditions, clubData) {
    if (!DOM) return;
    const percentChange = ((adjustment - 1) * 100).toFixed(1);
    const direction = adjustment > 1 ? 'increase' : 'decrease';
    
    const weights = {
        airDensity: 0.12,
        altitude: 0.45,
        wind: 0.35,
        ballTemp: 0.06,
        pressureTrend: 0.02
    };
    const componentEffects = {
        airDensity: ((conditions.airDensity) * 100).toFixed(1),
        altitude: ((conditions.altitude.total) * 100).toFixed(1),
        wind: ((conditions.wind.distanceEffect) * 100).toFixed(1),
        ballTemp: ((conditions.ballTemp) * 100).toFixed(1),
        pressureTrend: ((conditions.pressureTrend) * 100).toFixed(1)
    };
    
    let effectText = `
        <div class="font-medium mb-2">Comprehensive Environmental Analysis:</div>
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
                <h3 class="font-medium">Current Conditions:</h3>
                <ul class="space-y-1">
                    <li>🌡️ Temperature: ${Math.round(DOM.temperature.value)}°F</li>
                    <li>💧 Humidity: ${Math.round(DOM.humidity.value)}%</li>
                    <li>🏔️ Altitude: ${Math.round(conditions.altitude)}ft</li>
                    <li>🌬️ Wind: ${Math.round(DOM.windSpeed.value)}mph ${DOM.windDirection.value}</li>
                    <li>📊 Pressure: ${DOM.pressure.value.toFixed(2)} inHg</li>
                </ul>
            </div>
            <div class="space-y-1">
                <h3 class="font-medium">Distance Adjustments:</h3>
                <ul class="space-y-1">
                    <li>🌪️ Air Density: ${componentEffects.airDensity}%</li>
                    <li>⛰️ Altitude Effect: ${componentEffects.altitude}%</li>
                    <li>🌬️ Wind Effect: ${componentEffects.wind}%</li>
                    <li>🏌️ Ball Temperature: ${componentEffects.ballTemp}%</li>
                    <li>📈 Pressure Trend: ${componentEffects.pressureTrend}%</li>
                </ul>
            </div>
        </div>
        <div class="mt-4 font-medium">
            <p>📈 Total Distance Adjustment: ${Math.abs(percentChange)}% ${direction}</p>
        </div>
    `;
    
    DOM.environmentalEffect.innerHTML = effectText;
}

// Update UI when calculations are performed
function updateUI(results) {
    // Update wind effect display
    document.getElementById('windDistanceEffect').textContent = 
        `${results.windEffect.distanceEffect > 0 ? '+' : ''}${(results.windEffect.distanceEffect * 100).toFixed(1)}% (${Math.round(results.baseYardage * results.windEffect.distanceEffect)} yards)`;
    
    document.getElementById('windLateralEffect').textContent = 
        `${results.windEffect.lateralEffect > 0 ? 'Right ' : 'Left '}${Math.abs(Math.round(results.baseYardage * results.windEffect.lateralEffect))} yards`;
    
    // Update shot shape information
    document.getElementById('maxHeight').textContent = 
        `${Math.round(results.trajectory.maxHeight)} feet`;
    document.getElementById('landingAngle').textContent = 
        `${Math.round(results.trajectory.landingAngle)}°`;
    
    // Update final distances
    const carryDistance = Math.round(results.baseYardage * (1 + results.windEffect.distanceEffect));
    const totalDistance = Math.round(carryDistance * (1 + (results.rollout || 0)));
    
    document.getElementById('finalCarry').textContent = `${carryDistance} yards`;
    document.getElementById('finalTotal').textContent = `${totalDistance} yards`;
}

// Event listener for input changes
document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('change', () => {
        const conditions = getConditions();
        const results = calculateBallFlightAdjustments(conditions);
        updateUI(results);
    });
});

// Get comprehensive weather data from API
export async function getWeatherData(lat, lon, apiKey) {
    if (!apiKey) {
        throw new Error('API key is required');
    }

    const API_BASE_URL = 'https://api.tomorrow.io/v4/weather';
    const url = `${API_BASE_URL}/realtime?location=${lat},${lon}&units=imperial&apikey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data || !data.data || !data.data.values) {
        throw new Error('Invalid API response format');
    }

    return data.data.values;
}

// Fetch weather data from API
async function fetchWeatherData() {
    try {
        const position = await getCurrentPosition();
        const weatherData = await getWeatherData(position.coords.latitude, position.coords.longitude, process.env.WEATHERAPI_KEY);
        const altitude = await getAltitude(position.coords.latitude, position.coords.longitude);
        
        // Update input fields with current weather
        if (DOM) {
            DOM.temperature.value = Math.round(weatherData.temp);
            DOM.humidity.value = Math.round(weatherData.humidity);
            DOM.altitude.value = Math.round(altitude);
            DOM.windSpeed.value = Math.round(weatherData.windSpeed);
            
            // Set wind direction based on degree
            const degree = weatherData.windDirection;
            if (degree > 315 || degree <= 45) DOM.windDirection.value = 'head';
            else if (degree > 45 && degree <= 135) DOM.windDirection.value = 'right';
            else if (degree > 135 && degree <= 225) DOM.windDirection.value = 'tail';
            else DOM.windDirection.value = 'left';
        }
        
        // Calculate new distances
        updateCalculations();
    } catch (error) {
        console.error('Error fetching weather data:', error);
        if (DOM) showError('Could not fetch weather data. Please check your location settings and try again.');
    }
}

// Initialize club rows
function initializeClubRows() {
    if (!DOM) return;
    DOM.clubs.innerHTML = '';
    const defaultClubs = [
        { name: "Driver", distance: "230" },
        { name: "3-Wood", distance: "215" },
        { name: "5-Wood", distance: "200" },
        { name: "4-Iron", distance: "180" },
        { name: "5-Iron", distance: "170" },
        { name: "6-Iron", distance: "160" },
        { name: "7-Iron", distance: "150" },
        { name: "8-Iron", distance: "140" },
        { name: "9-Iron", distance: "130" },
        { name: "PW", distance: "120" },
        { name: "GW", distance: "110" },
        { name: "SW", distance: "100" },
        { name: "LW", distance: "90" }
    ];

    defaultClubs.forEach(club => {
        const row = document.createElement('div');
        row.className = 'club-row';
        row.innerHTML = `
            <input type="text" class="club-name input-field" value="${club.name}" placeholder="Club Name">
            <input type="number" class="club-distance input-field" value="${club.distance}" placeholder="Distance">
            <input type="text" class="adjusted-value input-field bg-gray-50" readonly>
        `;
        DOM.clubs.appendChild(row);
    });
}

// Get current position
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

// Get altitude from API
async function getAltitude(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.elevation;
    } catch (error) {
        throw new Error(`Elevation API error: ${error.message}`);
    }
}

// Show error message
function showError(message) {
    if (!DOM) return;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Debounce function to prevent too many updates
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

// Save conditions as preset
function saveConditionsPreset() {
    const conditions = getConditions();
    const presets = JSON.parse(localStorage.getItem('conditionPresets') || '[]');
    const timestamp = new Date().toLocaleString();
    
    presets.push({
        ...conditions,
        name: `Preset ${presets.length + 1}`,
        timestamp
    });
    
    localStorage.setItem('conditionPresets', JSON.stringify(presets));
    showSuccessMessage('Preset saved successfully');
}

// Load last used conditions
function loadLastConditions() {
    const lastConditions = localStorage.getItem('lastConditions');
    if (lastConditions) {
        const conditions = JSON.parse(lastConditions);
        Object.entries(conditions).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
        updateCalculations();
    }
}

// Save current conditions
function saveCurrentConditions() {
    const conditions = getConditions();
    localStorage.setItem('lastConditions', JSON.stringify(conditions));
}

// Show success message
function showSuccessMessage(message) {
    const container = document.createElement('div');
    container.className = 'success-message fixed top-4 right-4 bg-success-100 text-success-700 px-4 py-2 rounded-lg shadow-lg animate-fade-in';
    container.textContent = message;
    document.body.appendChild(container);
    
    setTimeout(() => {
        container.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const container = document.createElement('div');
    container.className = 'error-message fixed top-4 right-4 bg-danger-100 text-danger-700 px-4 py-2 rounded-lg shadow-lg animate-fade-in';
    container.textContent = message;
    document.body.appendChild(container);
    
    setTimeout(() => {
        container.remove();
    }, 3000);
}

// Validate input values
function validateInput(input) {
    const value = parseFloat(input.value);
    const id = input.id;
    
    let isValid = true;
    let errorMessage = '';
    
    switch(id) {
        case 'temperature':
            if (value < -50 || value > 120) {
                isValid = false;
                errorMessage = 'Temperature should be between -50°F and 120°F';
            }
            break;
        case 'humidity':
            if (value < 0 || value > 100) {
                isValid = false;
                errorMessage = 'Humidity should be between 0% and 100%';
            }
            break;
        case 'altitude':
            if (value < -1000 || value > 15000) {
                isValid = false;
                errorMessage = 'Altitude should be between -1000ft and 15000ft';
            }
            break;
        case 'wind-speed':
            if (value < 0 || value > 50) {
                isValid = false;
                errorMessage = 'Wind speed should be between 0mph and 50mph';
            }
            break;
    }
    
    if (!isValid) {
        input.classList.add('error-state');
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = errorMessage;
        input.parentNode.appendChild(errorElement);
    } else {
        input.classList.remove('error-state');
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
    
    return isValid;
}

// Update all calculations with loading state
async function updateAllCalculations() {
    // Show loading state
    document.querySelectorAll('.card').forEach(card => {
        card.classList.add('loading');
    });
    
    try {
        const conditions = getConditions();
        const results = calculateBallFlightAdjustments(conditions);
        
        // Update visualizations
        updateWindVisualization(conditions.windDirection, conditions.windSpeed);
        drawTrajectory(results);
        updateRecommendations(results);
        
        // Save current conditions
        saveCurrentConditions();
        
    } catch (error) {
        showErrorMessage('Error updating calculations');
        console.error(error);
    } finally {
        // Remove loading state
        document.querySelectorAll('.card').forEach(card => {
            card.classList.remove('loading');
        });
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard shortcuts if not in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + S to save preset
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveConditionsPreset();
        }
        
        // Ctrl/Cmd + W to get weather
        if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
            e.preventDefault();
            document.getElementById('get-weather').click();
        }
        
        // Ctrl/Cmd + / to show keyboard shortcuts
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

// Show keyboard shortcuts modal
function showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 class="text-lg font-semibold mb-4">Keyboard Shortcuts</h3>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="text-gray-600">Save Preset</span>
                    <kbd class="px-2 py-1 bg-gray-100 rounded text-sm">Ctrl/⌘ + S</kbd>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Get Weather</span>
                    <kbd class="px-2 py-1 bg-gray-100 rounded text-sm">Ctrl/⌘ + W</kbd>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-600">Show Shortcuts</span>
                    <kbd class="px-2 py-1 bg-gray-100 rounded text-sm">Ctrl/⌘ + /</kbd>
                </div>
            </div>
            <button class="mt-4 w-full btn-secondary" onclick="this.parentElement.parentElement.remove()">
                Close
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Add ARIA labels and roles for accessibility
function setupAccessibility() {
    // Add ARIA labels to inputs
    document.querySelectorAll('.input-field').forEach(input => {
        const label = input.previousElementSibling;
        if (label && label.tagName === 'LABEL') {
            input.setAttribute('aria-label', label.textContent.trim());
        }
    });
    
    // Add roles to sections
    document.querySelectorAll('.card').forEach(card => {
        const heading = card.querySelector('h2');
        if (heading) {
            card.setAttribute('role', 'region');
            card.setAttribute('aria-labelledby', heading.id || `heading-${Math.random().toString(36).substr(2, 9)}`);
        }
    });
    
    // Add live regions for updates
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    
    // Update live region when calculations change
    window.updateLiveRegion = (message) => {
        liveRegion.textContent = message;
    };
}

// Add touch gestures for mobile
function setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Swipe left/right to switch between cards on mobile
        if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
            const cards = document.querySelectorAll('.card');
            cards.forEach(card => {
                card.style.transition = 'transform 0.3s ease-out';
                card.style.transform = `translateX(${deltaX > 0 ? '100%' : '-100%'})`;
                setTimeout(() => {
                    card.style.transition = '';
                    card.style.transform = '';
                }, 300);
            });
        }
    });
}

// Initialize all enhancements
document.addEventListener('DOMContentLoaded', () => {
    setupKeyboardShortcuts();
    setupAccessibility();
    setupTouchGestures();
    
    // Show keyboard shortcuts hint
    const shortcutHint = document.createElement('div');
    shortcutHint.className = 'fixed bottom-4 right-4 text-sm text-gray-600 animate-fade-in';
    shortcutHint.textContent = 'Press Ctrl/⌘ + / for keyboard shortcuts';
    document.body.appendChild(shortcutHint);
    
    setTimeout(() => {
        shortcutHint.remove();
    }, 5000);
});

// Progressive loading and performance optimizations
function setupProgressiveLoading() {
    // Lazy load non-critical resources
    const deferredStyles = document.createElement('link');
    deferredStyles.rel = 'stylesheet';
    deferredStyles.href = 'https://rsms.me/inter/inter.css';
    deferredStyles.media = 'print';
    document.head.appendChild(deferredStyles);
    
    requestIdleCallback(() => {
        deferredStyles.media = 'all';
    });
    
    // Cache DOM elements
    const elements = {};
    ['temperature', 'humidity', 'altitude', 'wind-speed', 'wind-direction', 'shot-height'].forEach(id => {
        elements[id] = document.getElementById(id);
    });
    window.cachedElements = elements;
    
    // Batch DOM updates
    window.pendingUpdates = new Set();
    window.updateQueue = new Map();
    
    requestAnimationFrame(function processBatchUpdates() {
        if (window.pendingUpdates.size > 0) {
            window.pendingUpdates.forEach(update => update());
            window.pendingUpdates.clear();
        }
        requestAnimationFrame(processBatchUpdates);
    });
}

// Optimize calculations with web workers
function setupWebWorker() {
    if (window.Worker) {
        const worker = new Worker('calculations-worker.js');
        
        worker.onmessage = function(e) {
            const { results, id } = e.data;
            const callback = window.updateQueue.get(id);
            if (callback) {
                callback(results);
                window.updateQueue.delete(id);
            }
        };
        
        window.calculationWorker = worker;
    }
}

// Add offline support
function setupOfflineSupport() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.error('ServiceWorker registration failed:', err);
            });
    }
    
    // Save last successful calculation
    window.addEventListener('beforeunload', () => {
        const lastCalculation = {
            conditions: getConditions(),
            results: window.lastResults,
            timestamp: Date.now()
        };
        localStorage.setItem('lastCalculation', JSON.stringify(lastCalculation));
    });
    
    // Load last calculation when offline
    window.addEventListener('online', () => {
        document.body.classList.remove('offline-mode');
        updateAllCalculations();
    });
    
    window.addEventListener('offline', () => {
        document.body.classList.add('offline-mode');
        const lastCalculation = localStorage.getItem('lastCalculation');
        if (lastCalculation) {
            const { conditions, results } = JSON.parse(lastCalculation);
            Object.entries(conditions).forEach(([key, value]) => {
                const element = document.getElementById(key);
                if (element) {
                    element.value = value;
                }
            });
            updateVisualizations(conditions, results);
        }
    });
}

// Add undo/redo functionality
const historyStack = {
    past: [],
    future: [],
    current: null
};

function setupUndoRedo() {
    function saveState() {
        const currentState = {
            conditions: getConditions(),
            timestamp: Date.now()
        };
        
        if (historyStack.current) {
            historyStack.past.push(historyStack.current);
        }
        historyStack.current = currentState;
        historyStack.future = [];
        
        // Limit history size
        if (historyStack.past.length > 50) {
            historyStack.past.shift();
        }
    }
    
    function undo() {
        if (historyStack.past.length === 0) return;
        
        const previousState = historyStack.past.pop();
        if (historyStack.current) {
            historyStack.future.push(historyStack.current);
        }
        historyStack.current = previousState;
        
        applyState(previousState);
    }
    
    function redo() {
        if (historyStack.future.length === 0) return;
        
        const nextState = historyStack.future.pop();
        if (historyStack.current) {
            historyStack.past.push(historyStack.current);
        }
        historyStack.current = nextState;
        
        applyState(nextState);
    }
    
    function applyState(state) {
        Object.entries(state.conditions).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) {
                element.value = value;
            }
        });
        updateAllCalculations();
    }
    
    // Add keyboard shortcuts for undo/redo
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                redo();
            } else {
                undo();
            }
        }
    });
    
    // Save state after each change
    const debouncedSaveState = debounce(saveState, 500);
    document.querySelectorAll('.input-field').forEach(input => {
        input.addEventListener('change', debouncedSaveState);
    });
}

// Initialize all progressive enhancements
document.addEventListener('DOMContentLoaded', () => {
    setupProgressiveLoading();
    setupWebWorker();
    setupOfflineSupport();
    setupUndoRedo();
});

// Weather API configuration
const WEATHER_API_KEY = 'YOUR_API_KEY'; // You'll need to get an API key from OpenWeatherMap
const ALTITUDE_API_KEY = 'YOUR_API_KEY'; // You'll need to get an API key from OpenElevation

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    const getWeatherBtn = document.getElementById('get-weather');
    if (getWeatherBtn) {
        getWeatherBtn.addEventListener('click', getCurrentWeather);
    }

    // Update active tab
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
        if (tab.getAttribute('href') === window.location.pathname) {
            tab.classList.add('active');
        }
    });
});

// Get current weather data
async function getCurrentWeather() {
    try {
        // Show loading state
        const weatherBtn = document.getElementById('get-weather');
        weatherBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
        weatherBtn.disabled = true;

        // Get user's location
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;

        // Get weather data
        const weatherData = await fetchWeatherData(latitude, longitude);
        
        // Get altitude data
        const altitude = await fetchAltitude(latitude, longitude);

        // Update UI
        updateWeatherUI(weatherData, altitude);

        // Reset button
        weatherBtn.innerHTML = '<i class="fas fa-location-arrow mr-2"></i>Get Current Weather';
        weatherBtn.disabled = false;

    } catch (error) {
        console.error('Error getting weather:', error);
        alert('Unable to get weather data. Please try again.');
        
        // Reset button
        const weatherBtn = document.getElementById('get-weather');
        if (weatherBtn) {
            weatherBtn.innerHTML = '<i class="fas fa-location-arrow mr-2"></i>Get Current Weather';
            weatherBtn.disabled = false;
        }
    }
}

// Get user's current position
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    });
}

// Fetch weather data from OpenWeatherMap API
async function fetchWeatherData(lat, lon) {
    const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`
    );
    
    if (!response.ok) {
        throw new Error('Weather data not available');
    }
    
    return response.json();
}

// Fetch altitude data from OpenElevation API
async function fetchAltitude(lat, lon) {
    const response = await fetch(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
    );
    
    if (!response.ok) {
        throw new Error('Altitude data not available');
    }
    
    const data = await response.json();
    return data.results[0].elevation;
}

// Update UI with weather data
function updateWeatherUI(weatherData, altitude) {
    // Update temperature
    const tempElement = document.getElementById('temp');
    if (tempElement) {
        tempElement.textContent = `${Math.round(weatherData.main.temp)}°F`;
    }

    // Update humidity
    const humidityElement = document.getElementById('humidity');
    if (humidityElement) {
        humidityElement.textContent = `${weatherData.main.humidity}%`;
    }

    // Update altitude
    const altitudeElement = document.getElementById('altitude');
    if (altitudeElement) {
        altitudeElement.textContent = `${Math.round(altitude)} ft`;
    }

    // Update pressure
    const pressureElement = document.getElementById('pressure');
    if (pressureElement) {
        pressureElement.textContent = `${weatherData.main.pressure} hPa`;
    }

    // Update wind speed
    const windSpeedElement = document.getElementById('wind-speed');
    if (windSpeedElement) {
        windSpeedElement.textContent = `${Math.round(weatherData.wind.speed)} mph`;
    }

    // Update wind direction
    const windDirElement = document.getElementById('wind-direction');
    if (windDirElement) {
        const direction = getWindDirection(weatherData.wind.deg);
        windDirElement.textContent = direction;
    }

    // If we're on the weather page, update the input fields
    const temperatureInput = document.getElementById('temperature');
    const humidityInput = document.getElementById('humidity');
    const altitudeInput = document.getElementById('altitude');
    
    if (temperatureInput) temperatureInput.value = Math.round(weatherData.main.temp);
    if (humidityInput) humidityInput.value = weatherData.main.humidity;
    if (altitudeInput) altitudeInput.value = Math.round(altitude);

    // If we're on the wind page, update the input fields
    const windSpeedInput = document.getElementById('wind-speed');
    const windDirectionSelect = document.getElementById('wind-direction');
    
    if (windSpeedInput) windSpeedInput.value = Math.round(weatherData.wind.speed);
    if (windDirectionSelect) {
        const direction = getWindDirection(weatherData.wind.deg);
        windDirectionSelect.value = direction;
    }
}

// Convert wind degrees to cardinal direction
function getWindDirection(degrees) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Calculate yardage adjustments
function calculateYardageAdjustment(temperature, humidity, altitude) {
    // Add your yardage calculation logic here
    // This is a placeholder implementation
    const tempEffect = (temperature - 70) * 0.1;
    const humidityEffect = (humidity - 50) * 0.05;
    const altitudeEffect = altitude * 0.002;
    
    return {
        tempEffect,
        humidityEffect,
        altitudeEffect,
        total: tempEffect + humidityEffect + altitudeEffect
    };
}

// Export functions for use in other files
window.golfApp = {
    getCurrentWeather,
    calculateYardageAdjustment
};
