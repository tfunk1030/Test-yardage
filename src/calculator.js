// Shot calculator functionality
const calculateBtn = document.getElementById('calculate-btn');
const resultsSection = document.getElementById('results');
const adjustedDistanceDisplay = document.getElementById('adjusted-distance');
const clubOption1Display = document.getElementById('club-option-1');
const clubOption2Display = document.getElementById('club-option-2');

// Load clubs from localStorage
function getClubs() {
    return JSON.parse(localStorage.getItem('clubs') || '[]');
}

// Get cached weather data
function getCachedWeather() {
    const cachedData = localStorage.getItem('weatherData');
    if (!cachedData) return null;

    const { data, timestamp } = JSON.parse(cachedData);
    const cacheAge = Date.now() - timestamp;
    const cacheTimeout = 30 * 60 * 1000; // 30 minutes

    return cacheAge < cacheTimeout ? data : null;
}

import { calculateWindEffect } from './calculations/wind-calculations.js';
import { calculateAirDensity } from './calculations/air-density-calculations.js';
import { calculateAltitudeEffect } from './calculations/core-calculations.js';

// Calculate adjusted distance based on weather conditions
async function getAdjustedDistance(distance) {
    try {
        let weatherData = getCachedWeather();

        if (!weatherData) {
            // Get current weather conditions
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            const { latitude, longitude } = position.coords;
            const apiKey = process.env.TOMORROW_API_KEY;
            const url = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&apikey=${apiKey}&units=imperial`;

            const response = await fetch(url);
            const data = await response.json();
            weatherData = data.data;

            // Cache the weather data
            localStorage.setItem('weatherData', JSON.stringify({
                data: weatherData,
                timestamp: Date.now()
            }));
        }

        // Get environmental parameters
        const temperature = weatherData.values.temperature;
        const pressure = weatherData.values.pressureSeaLevel || 29.92; // Default to standard pressure if not available
        const humidity = weatherData.values.humidity || 0;
        const altitude = weatherData.values.altitude || 0;

        // Log weather conditions
        console.log('Weather conditions:', {
            temperature: `${temperature}°F`,
            pressure: `${pressure} inHg`,
            humidity: `${humidity}%`,
            altitude: `${altitude} ft`
        });
        
        // Calculate air density effects
        const airDensity = calculateAirDensity(temperature, pressure, humidity);
        
        // Calculate altitude effects
        const altitudeEffects = calculateAltitudeEffect(altitude);

        // Log calculations
        console.log('Environmental effects:', {
            airDensityMultiplier: airDensity,
            altitudeMultiplier: altitudeEffects.total
        });

        // Calculate distance adjustments
        const airDensityEffect = (airDensity - 1) * distance;
        const altitudeEffect = (altitudeEffects.total - 1) * distance;

        // Log adjustments
        console.log('Distance adjustments:', {
            airDensityEffect: `${Math.round(airDensityEffect)} yards (${((airDensity - 1) * 100).toFixed(1)}%)`,
            altitudeEffect: `${Math.round(altitudeEffect)} yards (${((altitudeEffects.total - 1) * 100).toFixed(1)}%)`,
            total: `${Math.round(airDensityEffect + altitudeEffect)} yards`
        });

        // Calculate final adjusted distance
        const adjustedDistance = Math.round(distance + airDensityEffect + altitudeEffect);

        // Validate final distance
        if (adjustedDistance < distance * 0.85 || adjustedDistance > distance * 1.15) {
            console.warn('Large distance adjustment detected:', {
                originalDistance: distance,
                adjustedDistance,
                percentageChange: ((adjustedDistance - distance) / distance * 100).toFixed(1) + '%'
            });
        }
        
        return adjustedDistance;
    } catch (error) {
        console.error('Error calculating adjusted distance:', error);
        return distance; // Return unadjusted distance if calculation fails
    }
}

// Find the best club options for a given distance
function findClubOptions(distance) {
    const clubs = getClubs();
    if (clubs.length === 0) {
        return ['No clubs saved', 'Please add clubs first'];
    }

    // Sort clubs by distance
    clubs.sort((a, b) => b.distance - a.distance);

    // Find clubs that are closest to the target distance
    let option1 = clubs[0];
    let option2 = clubs[0];

    for (let i = 0; i < clubs.length; i++) {
        if (clubs[i].distance < distance) {
            option1 = clubs[i - 1] || clubs[i];
            option2 = clubs[i];
            break;
        }
    }

    return [
        `${option1.type} (${option1.distance} yards)`,
        `${option2.type} (${option2.distance} yards)`
    ];
}

// Calculate shot
calculateBtn.addEventListener('click', async () => {
    const distance = parseInt(document.getElementById('shot-distance').value);
    
    if (!distance) {
        alert('Please enter a valid distance');
        return;
    }

    // Show loading state
    calculateBtn.disabled = true;
    calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Calculating...';

    try {
        // Get adjusted distance based on conditions
        const adjustedDistance = await getAdjustedDistance(distance);
        
        // Find club options
        const [club1, club2] = findClubOptions(adjustedDistance);

        // Display results
        resultsSection.style.display = 'block';
        adjustedDistanceDisplay.textContent = `${adjustedDistance} yards`;
        clubOption1Display.textContent = club1;
        clubOption2Display.textContent = club2;
    } catch (error) {
        console.error('Error:', error);
        alert('Error calculating distance. Please try again.');
    } finally {
        // Reset button state
        calculateBtn.disabled = false;
        calculateBtn.innerHTML = 'Calculate';
    }
});
