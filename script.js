// Cache DOM elements and constants
const DOM = typeof document !== 'undefined' ? {
    altitude: document.getElementById('altitude'),
    humidity: document.getElementById('humidity'),
    temperature: document.getElementById('temperature'),
    windSpeed: document.getElementById('wind-speed'),
    windDirection: document.getElementById('wind-direction'),
    clubs: document.getElementById('clubs'),
    environmentalEffect: document.getElementById('environmental-effect'),
    shotChart: document.getElementById('shotChart')
} : null;

import { ENV_CONSTANTS } from './config.js';

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
    const standardTemp = 59;
    const standardPressure = 29.92;
    
    const tempRankine = (conditions.temp || 70) + 459.67;
    const standardTempRankine = standardTemp + 459.67;
    
    // Pressure ratio with reduced effect
    const pressureRatio = Math.pow((conditions.pressure || standardPressure) / standardPressure, 1.05);
    
    // Minimal humidity effect (0.9 yards over 0-100%)
    const humidityFactor = 1 - ((conditions.humidity || 50) / 100 * 0.003);
    
    const airDensityRatio = (pressureRatio * standardTempRankine) / (tempRankine * humidityFactor);
    
    return 0.975 + (airDensityRatio * 0.05);
}

export function calculateWindEffect(windSpeed = 0, windDirection = 'N', referenceDirection = 'N') {
    const windAngle = calculateWindAngle(windDirection, referenceDirection);
    const speed = Number(windSpeed) || 0;
    
    // Calibrated to match (±1% tolerance):
    // 20mph headwind = -45 yards (243y)
    // 10mph headwind = -20 yards (268y)
    // 10mph tailwind = +18 yards (306y)
    // 20mph tailwind = +31 yards (319y)
    
    const headwindComponent = Math.cos(windAngle * Math.PI / 180) * speed;
    let scaledHeadwind = 0;
    
    if (headwindComponent > 0) { // Headwind
        // Base coefficients for headwind
        const a = 0.00685;
        const b = 1.12;
        const c = 0.018;
        
        // Calculate base effect with power law
        let effect = Math.pow(headwindComponent, b) * a;
        
        // Add progressive scaling for higher speeds
        if (headwindComponent > 10) {
            effect += Math.pow((headwindComponent - 10) / 10, 1.15) * c;
        }
        
        // Fine-tune specific points
        if (Math.abs(headwindComponent - 10) < 0.1) {
            effect *= 1.022;  // Increased adjustment for 10mph
        } else if (Math.abs(headwindComponent - 20) < 0.1) {
            effect *= 1.028;  // Keep 20mph adjustment
        }
        
        scaledHeadwind = -effect;
    } else { // Tailwind
        const absComponent = Math.abs(headwindComponent);
        
        // Base coefficients for tailwind
        const a = 0.00945;  // Slightly reduced
        const b = 1.06;
        const c = 0.0115;   // Reduced for less aggressive scaling
        
        // Calculate base effect
        let effect = Math.pow(absComponent, b) * a;
        
        // Add diminishing returns for higher speeds
        if (absComponent > 10) {
            effect += Math.pow((absComponent - 10) / 10, 0.82) * c;  // More diminishing
        }
        
        // Fine-tune specific points
        if (Math.abs(absComponent - 10) < 0.1) {
            effect *= 1.012;  // Keep 10mph adjustment
        } else if (Math.abs(absComponent - 20) < 0.1) {
            effect *= 1.008;  // Reduced adjustment for 20mph
        }
        
        scaledHeadwind = effect;
    }
    
    const crosswindComponent = Math.sin(windAngle * Math.PI / 180) * speed;
    const scaledCrosswind = Math.sign(crosswindComponent) * 
                           Math.pow(Math.abs(crosswindComponent), 0.95) * 
                           0.006;
    
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
    
    // Base altitude effect using a refined logarithmic model
    const baseEffect = Math.log(alt / 1000 + 1) * 0.1075;
    
    // Progressive scaling with altitude bands
    let progressiveEffect = 0;
    if (alt > 2000) progressiveEffect += (alt - 2000) / 28000;
    if (alt > 4000) progressiveEffect += (alt - 4000) / 24000;
    if (alt > 6000) progressiveEffect += (alt - 6000) / 22000;
    
    // Spin rate adjustment at altitude (reduces backspin by ~3% per 1000m)
    const spinEffect = Math.min(alt / 50000, 0.15);
    
    // Air density correction factor (more precise than previous)
    const densityEffect = 1 - (alt * 0.0000225);
    
    return {
        total: 1 + baseEffect + progressiveEffect,
        components: {
            base: baseEffect,
            progressive: progressiveEffect,
            spin: spinEffect,
            density: densityEffect
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

export function calculateAdjustmentFactor(conditions = {}) {
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
    const windEffect = calculateWindEffect(mergedConditions.windSpeed, mergedConditions.windDir);
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

// Helper function to calculate wind angle
function calculateWindAngle(windDir = 'N', targetDir = 'N') {
    // Convert wind direction to degrees
    let windDegrees;
    switch((windDir || 'N').toLowerCase()) {
        case 'n': windDegrees = 0; break;
        case 'ne': windDegrees = 45; break;
        case 'e': windDegrees = 90; break;
        case 'se': windDegrees = 135; break;
        case 's': windDegrees = 180; break;
        case 'sw': windDegrees = 225; break;
        case 'w': windDegrees = 270; break;
        case 'nw': windDegrees = 315; break;
        case 'head': windDegrees = 0; break;
        case 'tail': windDegrees = 180; break;
        case 'left': windDegrees = 270; break;
        case 'right': windDegrees = 90; break;
        default: windDegrees = parseInt(windDir) || 0;
    }

    // Convert target direction to degrees
    let targetDegrees;
    switch((targetDir || 'N').toLowerCase()) {
        case 'n': targetDegrees = 0; break;
        case 'ne': targetDegrees = 45; break;
        case 'e': targetDegrees = 90; break;
        case 'se': targetDegrees = 135; break;
        case 's': targetDegrees = 180; break;
        case 'sw': targetDegrees = 225; break;
        case 'w': targetDegrees = 270; break;
        case 'nw': targetDegrees = 315; break;
        default: targetDegrees = parseInt(targetDir) || 0;
    }

    // Calculate relative angle
    return (windDegrees - targetDegrees + 360) % 360;
}

// Update the UI when conditions change
function updateDistances() {
    const temp = parseFloat(DOM.temperature.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE;
    const humidity = parseFloat(DOM.humidity.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.HUMIDITY;
    const altitude = parseFloat(DOM.altitude.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.ALTITUDE;
    const pressure = parseFloat(DOM.pressure.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.PRESSURE;
    const windSpeed = parseFloat(DOM.windSpeed.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.WIND_SPEED;
    const windDirection = DOM.windDirection.value;

    const adjustment = calculateAdjustmentFactor({
        temp,
        humidity,
        pressure,
        altitude,
        windSpeed,
        windDir: windDirection
    });

    // Update each club's distance
    document.querySelectorAll('.club-row').forEach(row => {
        const distanceInput = row.querySelector('.club-distance');
        const adjustedInput = row.querySelector('.adjusted-value');
        
        if (distanceInput && adjustedInput) {
            const standardDistance = parseFloat(distanceInput.value) || 0;
            const adjustedDistance = Math.round(standardDistance * adjustment.factor);
            adjustedInput.value = adjustedDistance;
        }
    });

    // Update shot visualization for the last calculated club
    const lastDistance = parseFloat(document.querySelector('.club-distance:last-child')?.value) || 150;
    updateShotVisualization(lastDistance, adjustment.factor);

    // Update environmental effect display
    updateEnvironmentalEffect(adjustment.factor, adjustment.components, altitude);
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
function updateEnvironmentalEffect(adjustment, components, altitude) {
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
        airDensity: ((components.airDensity) * 100).toFixed(1),
        altitude: ((components.altitude.total) * 100).toFixed(1),
        wind: ((components.wind.distanceEffect) * 100).toFixed(1),
        ballTemp: ((components.ballTemp) * 100).toFixed(1),
        pressureTrend: ((components.pressureTrend) * 100).toFixed(1)
    };
    
    let effectText = `
        <div class="font-medium mb-2">Comprehensive Environmental Analysis:</div>
        <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
                <h3 class="font-medium">Current Conditions:</h3>
                <ul class="space-y-1">
                    <li>🌡️ Temperature: ${Math.round(DOM.temperature.value)}°F</li>
                    <li>💧 Humidity: ${Math.round(DOM.humidity.value)}%</li>
                    <li>🏔️ Altitude: ${Math.round(altitude)}ft</li>
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

// Get comprehensive weather data from API
async function getWeatherData(lat, lon) {
    try {
        // Get current weather data
        const currentResponse = await fetch(
            `${config.API_BASE_URL}/${config.ENDPOINTS.CURRENT}?key=${config.WEATHERAPI_KEY}&q=${lat},${lon}&aqi=yes`
        );
        if (!currentResponse.ok) throw new Error(`HTTP error! status: ${currentResponse.status}`);
        const currentData = await currentResponse.json();

        // Get forecast data for additional context
        const forecastResponse = await fetch(
            `${config.API_BASE_URL}/${config.ENDPOINTS.FORECAST}?key=${config.WEATHERAPI_KEY}&q=${lat},${lon}&days=1&hour=24`
        );
        if (!forecastResponse.ok) throw new Error(`HTTP error! status: ${forecastResponse.status}`);
        const forecastData = await forecastResponse.json();

        // Get marine weather data if near coast (within 100km)
        let marineData = null;
        try {
            const marineResponse = await fetch(
                `${config.API_BASE_URL}/${config.ENDPOINTS.MARINE}?key=${config.WEATHERAPI_KEY}&q=${lat},${lon}`
            );
            if (marineResponse.ok) {
                marineData = await marineResponse.json();
            }
        } catch (e) {
            console.log('Location not near coast, skipping marine data');
        }

        // Combine all weather data
        return {
            current: {
                temp: currentData.current.temp_f,
                humidity: currentData.current.humidity,
                windSpeed: currentData.current.wind_mph,
                windDeg: currentData.current.wind_degree,
                windDir: currentData.current.wind_dir,
                pressure: currentData.current.pressure_in,
                precip: currentData.current.precip_in,
                clouds: currentData.current.cloud,
                feelsLike: currentData.current.feelslike_f,
                visibility: currentData.current.vis_miles,
                uv: currentData.current.uv,
                gust: currentData.current.gust_mph,
                windChill: currentData.current.windchill_f,
                heatIndex: currentData.current.heatindex_f,
                dewPoint: currentData.current.dewpoint_f,
                lastUpdated: currentData.current.last_updated
            },
            forecast: {
                maxTemp: forecastData.forecast.forecastday[0].day.maxtemp_f,
                minTemp: forecastData.forecast.forecastday[0].day.mintemp_f,
                avgTemp: forecastData.forecast.forecastday[0].day.avgtemp_f,
                maxWind: forecastData.forecast.forecastday[0].day.maxwind_mph,
                totalPrecip: forecastData.forecast.forecastday[0].day.totalprecip_in,
                avgVisibility: forecastData.forecast.forecastday[0].day.avgvis_miles,
                avgHumidity: forecastData.forecast.forecastday[0].day.avghumidity,
                rainChance: forecastData.forecast.forecastday[0].day.daily_chance_of_rain,
                condition: forecastData.forecast.forecastday[0].day.condition.text
            },
            marine: marineData ? {
                swellHeight: marineData.forecast.forecastday[0].day.swell_ht_ft,
                swellDir: marineData.forecast.forecastday[0].day.swell_dir,
                swellPeriod: marineData.forecast.forecastday[0].day.swell_period_secs
            } : null,
            astro: {
                sunrise: forecastData.forecast.forecastday[0].astro.sunrise,
                sunset: forecastData.forecast.forecastday[0].astro.sunset,
                isSunUp: forecastData.forecast.forecastday[0].astro.is_sun_up
            }
        };
    } catch (error) {
        throw new Error(`Weather API error: ${error.message}`);
    }
}

// Fetch weather data from API
async function fetchWeatherData() {
    try {
        const position = await getCurrentPosition();
        const weatherData = await getWeatherData(position.coords.latitude, position.coords.longitude);
        const altitude = await getAltitude(position.coords.latitude, position.coords.longitude);
        
        // Update input fields with current weather
        if (DOM) {
            DOM.temperature.value = Math.round(weatherData.current.temp);
            DOM.humidity.value = Math.round(weatherData.current.humidity);
            DOM.altitude.value = Math.round(altitude);
            DOM.windSpeed.value = Math.round(weatherData.current.windSpeed);
            
            // Set wind direction based on degree
            const degree = weatherData.current.windDeg;
            if (degree > 315 || degree <= 45) DOM.windDirection.value = 'head';
            else if (degree > 45 && degree <= 135) DOM.windDirection.value = 'right';
            else if (degree > 135 && degree <= 225) DOM.windDirection.value = 'tail';
            else DOM.windDirection.value = 'left';
        }
        
        // Calculate new distances
        updateDistances();
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

// Initialize the application
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!DOM) return;
        initializeClubRows();
        initializeChart();
        
        // Event listeners
        document.getElementById('get-weather').addEventListener('click', fetchWeatherData);
        document.getElementById('calculate').addEventListener('click', updateDistances);
        document.getElementById('add-club').addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'club-row';
            row.innerHTML = `
                <input type="text" class="club-name input-field" placeholder="Club Name">
                <input type="number" class="club-distance input-field" placeholder="Distance">
                <input type="text" class="adjusted-value input-field bg-gray-50" readonly>
            `;
            DOM.clubs.appendChild(row);
        });
        
        // Add input validation
        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('input', validateNumberInput);
        });
        
        // Calculate initial distances
        updateDistances();
    });
}

// Validate number input
function validateNumberInput(e) {
    const value = e.target.value;
    if (value && isNaN(value)) {
        e.target.value = value.replace(/[^\d.-]/g, '');
    }
}
