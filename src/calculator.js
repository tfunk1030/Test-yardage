// Shot calculator functionality
import React, { useState, useEffect } from 'react';
import { calculateWindEffect } from './calculations/wind-calculations.js';
import { calculateAirDensity } from './calculations/air-density-calculations.js';
import { calculateAltitudeEffect } from './calculations/core-calculations.js';

export function Calculator({ onCalculate }) {
    const [distance, setDistance] = useState('');
    const [results, setResults] = useState({
        adjustedDistance: null,
        clubOption1: '',
        clubOption2: '',
        loading: false
    });

    // Load clubs from localStorage
    const getClubs = () => {
        return JSON.parse(localStorage.getItem('clubs') || '[]');
    };

    // Get cached weather data
    const getCachedWeather = () => {
        const cachedData = localStorage.getItem('weatherData');
        if (!cachedData) return null;

        const { data, timestamp } = JSON.parse(cachedData);
        const cacheAge = Date.now() - timestamp;
        const cacheTimeout = 30 * 60 * 1000; // 30 minutes

        return cacheAge < cacheTimeout ? data : null;
    };

    // Calculate adjusted distance based on weather conditions
    const getAdjustedDistance = async (shotDistance) => {
        try {
            let weatherData = getCachedWeather();

            if (!weatherData) {
                // Get current weather conditions
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                const { latitude, longitude } = position.coords;
                const apiKey = process.env.TOMORROW_IO_API_KEY;
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
            const pressure = weatherData.values.pressureSeaLevel || 29.92;
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
            const airDensityEffect = (airDensity - 1) * shotDistance;
            const altitudeEffect = (altitudeEffects.total - 1) * shotDistance;

            // Log adjustments
            console.log('Distance adjustments:', {
                airDensityEffect: `${Math.round(airDensityEffect)} yards (${((airDensity - 1) * 100).toFixed(1)}%)`,
                altitudeEffect: `${Math.round(altitudeEffect)} yards (${((altitudeEffects.total - 1) * 100).toFixed(1)}%)`,
                total: `${Math.round(airDensityEffect + altitudeEffect)} yards`
            });

            // Calculate final adjusted distance
            const adjustedDistance = Math.round(shotDistance + airDensityEffect + altitudeEffect);

            // Validate final distance
            if (adjustedDistance < shotDistance * 0.85 || adjustedDistance > shotDistance * 1.15) {
                console.warn('Large distance adjustment detected:', {
                    originalDistance: shotDistance,
                    adjustedDistance,
                    percentageChange: ((adjustedDistance - shotDistance) / shotDistance * 100).toFixed(1) + '%'
                });
            }
            
            return adjustedDistance;
        } catch (error) {
            console.error('Error calculating adjusted distance:', error);
            return shotDistance; // Return unadjusted distance if calculation fails
        }
    };

    // Find the best club options for a given distance
    const findClubOptions = (adjustedDistance) => {
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
            if (clubs[i].distance < adjustedDistance) {
                option1 = clubs[i - 1] || clubs[i];
                option2 = clubs[i];
                break;
            }
        }

        return [
            `${option1.type} (${option1.distance} yards)`,
            `${option2.type} (${option2.distance} yards)`
        ];
    };

    const handleCalculate = async () => {
        if (!distance) {
            alert('Please enter a valid distance');
            return;
        }

        setResults(prev => ({ ...prev, loading: true }));

        try {
            const adjustedDistance = await getAdjustedDistance(parseInt(distance));
            const [club1, club2] = findClubOptions(adjustedDistance);

            setResults({
                adjustedDistance,
                clubOption1: club1,
                clubOption2: club2,
                loading: false
            });

            if (onCalculate) {
                onCalculate({
                    originalDistance: parseInt(distance),
                    adjustedDistance,
                    clubOption1: club1,
                    clubOption2: club2
                });
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error calculating distance. Please try again.');
            setResults(prev => ({ ...prev, loading: false }));
        }
    };

    return (
        <div className="calculator">
            <div className="input-group">
                <input
                    type="number"
                    id="shot-distance"
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="Enter shot distance"
                />
                <button
                    onClick={handleCalculate}
                    disabled={results.loading}
                >
                    {results.loading ? (
                        <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Calculating...
                        </>
                    ) : (
                        'Calculate'
                    )}
                </button>
            </div>

            {results.adjustedDistance && (
                <div id="results" className="results-section">
                    <p>Adjusted Distance: <span id="adjusted-distance">{results.adjustedDistance} yards</span></p>
                    <p>Club Option 1: <span id="club-option-1">{results.clubOption1}</span></p>
                    <p>Club Option 2: <span id="club-option-2">{results.clubOption2}</span></p>
                </div>
            )}
        </div>
    );
}
