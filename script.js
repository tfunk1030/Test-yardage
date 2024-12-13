// Cache DOM elements and constants
const DOM = {
    altitude: document.getElementById('altitude'),
    humidity: document.getElementById('humidity'),
    temperature: document.getElementById('temperature'),
    clubs: document.getElementById('clubs'),
    shotDistance: document.getElementById('shot-distance'),
    windStrength: document.getElementById('wind-strength'),
    windDirection: document.getElementById('wind-direction'),
    adjustedDistance: document.getElementById('adjusted-distance'),
    adjustedAim: document.getElementById('adjusted-aim')
};

const CONSTANTS = {
    API_KEY: 'jG9onLuVeiR4NWlVIO85EWWLCtQ2Uzqv',
    BASELINE: {
        ALTITUDE: 0,
        HUMIDITY: 50,
        TEMPERATURE: 70
    },
    WIND_FACTORS: {
        N: { dist: 0.01, aim: 0 },
        S: { dist: -0.005, aim: 0 },
        E: { dist: 0, aim: 0.0035 },
        W: { dist: 0, aim: -0.0035 },
        NE: { dist: 0.007071, aim: 0.0024715 },
        NW: { dist: 0.007071, aim: -0.0024715 },
        SE: { dist: -0.0035, aim: 0.00123575 },
        SW: { dist: -0.0035, aim: -0.00123575 }
    },
    DEFAULT_CLUBS: [
        'Driver', 'Three Wood', 'Five Wood', 'Four Iron', 'Five Iron',
        'Six Iron', 'Seven Iron', 'Eight Iron', 'Nine Iron', 'Pitching Wedge',
        'Gap Wedge', 'Sand Wedge', 'Lob Wedge'
    ]
};

// Environmental adjustment constants with more precise measurements
const ENV_CONSTANTS = {
    STANDARD_CONDITIONS: {
        TEMPERATURE: 70,    // °F
        HUMIDITY: 50,      // %
        ALTITUDE: 0,       // feet
        PRESSURE: 29.92    // inHg
    },
    // Coefficients based on precise measurements
    ADJUSTMENTS: {
        // Per degree Fahrenheit change
        TEMPERATURE: {
            AIR_DENSITY: 0.002,    // 0.2% per °F
            BALL_BEHAVIOR: 0.0015  // 0.15% per °F for ball/club physics
        },
        // Per 1% humidity change
        HUMIDITY: {
            AIR_DENSITY: 0.0002,   // 0.02% per 1% humidity
            VAPOR_COEFFICIENT: 0.095
        },
        // Altitude effects
        ALTITUDE: {
            PRESSURE_COEFFICIENT: 0.0000685,  // Barometric formula coefficient
            DENSITY_CHANGE: 0.00116          // 0.116% per 100 feet
        },
        // Per 0.1 inHg pressure change
        PRESSURE: 0.003  // 0.3% per 0.1 inHg
    }
};

// Debounce function for performance optimization
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Initialize club rows
function initializeClubRows() {
    DOM.clubs.innerHTML = '';
    for (let i = 0; i < CONSTANTS.DEFAULT_CLUBS.length; i++) {
        const row = document.createElement('div');
        row.className = 'club-row';
        row.innerHTML = `
            <input type="text" class="club-name" placeholder="Club Name" 
                value="${CONSTANTS.DEFAULT_CLUBS[i]}" aria-label="Enter club name">
            <input type="number" class="club-distance" placeholder="Distance" min="0" max="400" 
                step="1" aria-label="Enter standard distance">
            <input type="text" class="adjusted-value" readonly aria-label="Adjusted distance">
        `;
        DOM.clubs.appendChild(row);
    }
}

// Calculate vapor pressure using enhanced Magnus formula
function calculateVaporPressure(temp, humidity) {
    // More precise coefficients for Magnus formula
    const A = 6.1121; // mbar
    const b = 17.368;
    const c = 238.88; // °C
    
    // Convert temperature to Celsius for Magnus formula
    const tempC = (temp - 32) * 5/9;
    
    // Calculate saturation vapor pressure
    const saturationVaporPressure = A * Math.exp((b * tempC) / (c + tempC));
    
    // Convert to actual vapor pressure based on relative humidity
    return (humidity / 100) * saturationVaporPressure * ENV_CONSTANTS.ADJUSTMENTS.HUMIDITY.VAPOR_COEFFICIENT;
}

// Calculate precise air density ratio
function calculateAirDensityRatio(temp, humidity, altitude, pressure = null) {
    // Convert temperature to absolute (Rankine) for precise gas calculations
    const tempR = temp + 459.67;
    const standardTempR = ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE + 459.67;
    
    // Calculate vapor pressure with enhanced precision
    const vaporPressure = calculateVaporPressure(temp, humidity);
    const standardVaporPressure = calculateVaporPressure(
        ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE,
        ENV_CONSTANTS.STANDARD_CONDITIONS.HUMIDITY
    );
    
    // Calculate pressure with altitude if not provided
    // Using barometric formula with more precise coefficients
    const altitudePressure = pressure || 
        ENV_CONSTANTS.STANDARD_CONDITIONS.PRESSURE * 
        Math.exp(-ENV_CONSTANTS.ADJUSTMENTS.ALTITUDE.PRESSURE_COEFFICIENT * altitude);
    
    // Calculate density ratio with enhanced precision
    // Including virtual temperature correction for humidity
    const virtualTempCorrection = 1 - (0.378 * vaporPressure / altitudePressure);
    const standardVirtualTempCorrection = 1 - (0.378 * standardVaporPressure / ENV_CONSTANTS.STANDARD_CONDITIONS.PRESSURE);
    
    const densityRatio = (altitudePressure / tempR) * virtualTempCorrection;
    const standardDensityRatio = (ENV_CONSTANTS.STANDARD_CONDITIONS.PRESSURE / standardTempR) * standardVirtualTempCorrection;
    
    // Return ratio of current density to standard density
    return densityRatio / standardDensityRatio;
}

// Calculate precise ball behavior adjustment
function calculateBallBehaviorAdjustment(temp, humidity) {
    // Temperature effect on ball compression and aerodynamics
    // Roughly 0.15% increase per degree F above standard temp
    const tempEffect = 1 + (temp - ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE) * 
        ENV_CONSTANTS.ADJUSTMENTS.TEMPERATURE.BALL_BEHAVIOR;
    
    // Humidity effect on ball spin and compression
    const humidityEffect = 1 + (humidity - ENV_CONSTANTS.STANDARD_CONDITIONS.HUMIDITY) * 
        ENV_CONSTANTS.ADJUSTMENTS.HUMIDITY.AIR_DENSITY;
    
    return tempEffect * humidityEffect;
}

// Calculate total adjustment factor with enhanced precision
function calculateAdjustmentFactor(temp, humidity, altitude, pressure = null) {
    console.log('Calculating adjustment factor for:', {
        temp,
        humidity,
        altitude,
        pressure,
        standardTemp: ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE,
        standardHumidity: ENV_CONSTANTS.STANDARD_CONDITIONS.HUMIDITY,
        standardAltitude: ENV_CONSTANTS.STANDARD_CONDITIONS.ALTITUDE
    });

    // Calculate air density ratio
    const airDensityRatio = calculateAirDensityRatio(temp, humidity, altitude, pressure);
    
    // Calculate ball behavior adjustment
    const ballBehavior = calculateBallBehaviorAdjustment(temp, humidity);
    
    // Calculate altitude effect (roughly 1.5% per 1000ft)
    const altitudeEffect = 1 + (altitude / 1000) * 0.015;
    
    // Combine effects with appropriate weighting
    const totalAdjustment = (
        0.5 * airDensityRatio +    // Air density primary effect
        0.3 * ballBehavior +       // Ball/club behavior secondary effect
        0.2 * altitudeEffect       // Direct altitude effect
    );
    
    console.log('Adjustment components:', {
        airDensityRatio,
        ballBehavior,
        altitudeEffect,
        totalAdjustment
    });

    return totalAdjustment;
}

function calculateAllDistances() {
    console.log('Calculating distances with:', {
        altitude: DOM.altitude.value,
        humidity: DOM.humidity.value,
        temperature: DOM.temperature.value
    });

    const altitude = parseFloat(DOM.altitude.value) || 0;
    const humidity = parseFloat(DOM.humidity.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.HUMIDITY;
    const temperature = parseFloat(DOM.temperature.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE;
    
    // Get precise adjustment factor
    const adjustmentFactor = calculateAdjustmentFactor(temperature, humidity, altitude);
    console.log('Adjustment factor:', adjustmentFactor, {
        standardConditions: ENV_CONSTANTS.STANDARD_CONDITIONS,
        currentConditions: {
            temperature,
            humidity,
            altitude
        }
    });

    document.querySelectorAll('.club-row').forEach(row => {
        const distanceInput = row.querySelector('.club-distance');
        const adjustedInput = row.querySelector('.adjusted-value');
        
        if (!distanceInput || !adjustedInput) {
            console.error('Missing required elements in club row');
            return;
        }

        const standardDistance = parseFloat(distanceInput.value);
        console.log('Processing distance:', standardDistance);

        if (!standardDistance) {
            adjustedInput.value = '';
            return;
        }

        // Apply the precise adjustment factor to the standard distance
        const adjustedDistance = standardDistance * adjustmentFactor;
        console.log('Adjusted distance:', adjustedDistance, {
            standardDistance,
            adjustmentFactor,
            change: ((adjustmentFactor - 1) * 100).toFixed(2) + '%'
        });
        
        // Show precise adjustment to tenth of a yard
        adjustedInput.value = adjustedDistance.toFixed(1);
        
        // Add detailed tooltip showing individual effects
        const details = calculateDetailedEffects(temperature, humidity, altitude, standardDistance);
        console.log('Adjustment details:', details);
        
        adjustedInput.setAttribute('title', 
            `Temperature effect: ${details.tempEffect}\n` +
            `Humidity effect: ${details.humidityEffect}\n` +
            `Altitude effect: ${details.altitudeEffect}\n` +
            `Total adjustment: ${((adjustmentFactor - 1) * 100).toFixed(2)}%`
        );
    });
    
    // Update environmental effect display
    updateEnvironmentalEffect();
}

// Calculate detailed effects for tooltip
function calculateDetailedEffects(temp, humidity, altitude, standardDistance) {
    const baseConditions = ENV_CONSTANTS.STANDARD_CONDITIONS;
    
    // Calculate individual effects
    const tempOnly = calculateAdjustmentFactor(temp, baseConditions.HUMIDITY, baseConditions.ALTITUDE);
    const humidityOnly = calculateAdjustmentFactor(baseConditions.TEMPERATURE, humidity, baseConditions.ALTITUDE);
    const altitudeOnly = calculateAdjustmentFactor(baseConditions.TEMPERATURE, baseConditions.HUMIDITY, altitude);
    
    console.log('Individual effects:', {
        tempOnly,
        humidityOnly,
        altitudeOnly,
        baseConditions
    });

    return {
        tempEffect: `${((tempOnly - 1) * 100).toFixed(2)}%`,
        humidityEffect: `${((humidityOnly - 1) * 100).toFixed(2)}%`,
        altitudeEffect: `${((altitudeOnly - 1) * 100).toFixed(2)}%`
    };
}

// Update environmental effect display with more precise information
function updateEnvironmentalEffect() {
    const altitude = parseFloat(DOM.altitude.value) || 0;
    const humidity = parseFloat(DOM.humidity.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.HUMIDITY;
    const temperature = parseFloat(DOM.temperature.value) || ENV_CONSTANTS.STANDARD_CONDITIONS.TEMPERATURE;
    
    const adjustmentFactor = calculateAdjustmentFactor(temperature, humidity, altitude);
    const details = calculateDetailedEffects(temperature, humidity, altitude, 100);
    
    const message = `
        Current conditions affect ball flight by ${((adjustmentFactor - 1) * 100).toFixed(2)}%
        Temperature: ${details.tempEffect}
        Humidity: ${details.humidityEffect}
        Altitude: ${details.altitudeEffect}
    `;
    
    showEffect(message);
}

function showEffect(message) {
    const effectDiv = document.createElement('div');
    effectDiv.className = 'environmental-effect';
    effectDiv.textContent = message;
    document.querySelector('.input-section').appendChild(effectDiv);
    setTimeout(() => effectDiv.remove(), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
    initializeClubRows();
    loadClubData();
    fetchWeatherData();
    
    // Event delegation for better performance
    DOM.clubs.addEventListener('input', debounce(e => {
        if (e.target.classList.contains('club-name') || e.target.classList.contains('club-distance')) {
            saveClubData();
            if (e.target.classList.contains('club-distance')) {
                calculateAllDistances();
            }
        }
    }, 500));
    
    // Add error handling for inputs
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', validateNumberInput);
    });
    
    const environmentalInputs = [DOM.altitude, DOM.humidity, DOM.temperature];
    environmentalInputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            calculateAllDistances();
            updateEnvironmentalEffect();
        }, 500));
    });
});

function validateNumberInput(e) {
    const value = e.target.value;
    if (value && isNaN(value)) {
        e.target.value = value.replace(/[^\d.-]/g, '');
    }
}

async function fetchWeatherData() {
    try {
        const position = await getCurrentPosition();
        const { latitude: lat, longitude: lon } = position.coords;
        await Promise.all([
            getWeatherData(lat, lon),
            getAltitude(lat, lon)
        ]);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Unable to fetch weather data. Please enter values manually.');
    }
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject);
    });
}

async function getWeatherData(lat, lon) {
    try {
        const response = await fetch(
            `https://api.tomorrow.io/v4/weather/realtime?location=${lat},${lon}&units=imperial&apikey=${CONSTANTS.API_KEY}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        
        DOM.temperature.value = data.data.values.temperature;
        DOM.humidity.value = data.data.values.humidity;
    } catch (error) {
        throw new Error(`Weather API error: ${error.message}`);
    }
}

async function getAltitude(lat, lon) {
    try {
        const response = await fetch(
            `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`
        );
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        DOM.altitude.value = (data.elevation * 3.28084).toFixed(2);
    } catch (error) {
        throw new Error(`Elevation API error: ${error.message}`);
    }
}

function saveClubData() {
    const clubData = [];
    document.querySelectorAll('.club-row').forEach(row => {
        clubData.push({
            name: row.querySelector('.club-name').value,
            distance: row.querySelector('.club-distance').value
        });
    });
    localStorage.setItem('clubData', JSON.stringify(clubData));
}

function loadClubData() {
    const savedData = localStorage.getItem('clubData');
    if (savedData) {
        const clubData = JSON.parse(savedData);
        document.querySelectorAll('.club-row').forEach((row, index) => {
            if (clubData[index]) {
                row.querySelector('.club-name').value = clubData[index].name;
                row.querySelector('.club-distance').value = clubData[index].distance;
            }
        });
        calculateAllDistances();
    }
}

function calculateWindAdjustment() {
    const direction = DOM.windDirection.value;
    const strength = parseFloat(DOM.windStrength.value) || 0;
    const distance = parseFloat(DOM.shotDistance.value) || 0;

    if (!distance) {
        showError('Please enter a valid shot distance');
        return;
    }

    const windFactor = CONSTANTS.WIND_FACTORS[direction];
    const adjustedDistance = distance + (distance * windFactor.dist * strength);
    const aimAdjustment = distance * windFactor.aim * strength;

    DOM.adjustedDistance.value = adjustedDistance.toFixed(1);
    DOM.adjustedAim.value = aimAdjustment === 0 ? 'Straight' : 
        `${Math.abs(aimAdjustment).toFixed(1)} yards ${aimAdjustment > 0 ? 'right' : 'left'}`;
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').prepend(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

function toggleScreens() {
    const mainScreen = document.querySelector('.container');
    const windScreen = document.querySelector('.wind-adjustment-screen');

    mainScreen.style.display = (mainScreen.style.display !== 'none') ? 'none' : 'block';
    windScreen.style.display = (windScreen.style.display !== 'none') ? 'none' : 'block';
}
