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
            showError(rules.message);
            element.classList.add('error');
            isValid = false;
        } else {
            element.classList.remove('error');
        }
    });
    
    return isValid;
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fixed top-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeChart();
    setupEventListeners();
    loadLastConditions();
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
