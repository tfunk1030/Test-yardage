// Import required functions
import { calculateWindEffect, calculateAltitudeEffect, calculateAirDensityRatio } from '../calculations/core-calculations.js';
import { calculateTrajectory } from '../ball-physics.js';

// Cache for calculations
const calculationCache = new Map();

// Generate cache key from conditions
function generateCacheKey(conditions) {
    return JSON.stringify({
        temperature: Math.round(conditions.temperature),
        humidity: Math.round(conditions.humidity),
        altitude: Math.round(conditions.altitude),
        windSpeed: Math.round(conditions.windSpeed),
        windDirection: conditions.windDirection,
        shotHeight: conditions.shotHeight
    });
}

// Handle calculation requests
self.onmessage = function(e) {
    const { conditions, id } = e.data;
    
    try {
        // Check cache first
        const cacheKey = generateCacheKey(conditions);
        if (calculationCache.has(cacheKey)) {
            self.postMessage({
                results: calculationCache.get(cacheKey),
                id,
                error: null,
                cached: true
            });
            return;
        }

        // Perform calculations
        const results = calculateBallFlightAdjustments(conditions);
        
        // Cache results
        calculationCache.set(cacheKey, results);
        
        // Limit cache size to prevent memory issues
        if (calculationCache.size > 100) {
            const firstKey = calculationCache.keys().next().value;
            calculationCache.delete(firstKey);
        }
        
        // Send results back to main thread
        self.postMessage({
            results,
            id,
            error: null,
            cached: false
        });
    } catch (error) {
        self.postMessage({
            results: null,
            id,
            error: error.message,
            cached: false
        });
    }
};

// Main calculation function
function calculateBallFlightAdjustments(conditions) {
    const {
        temperature,
        humidity,
        altitude,
        windSpeed,
        windDirection,
        shotHeight
    } = conditions;
    
    // Calculate air density ratio
    const airDensity = calculateAirDensityRatio({
        temp: temperature,
        humidity: humidity,
        altitude: altitude
    });
    
    // Calculate wind effect
    const windEffect = calculateWindEffect(windSpeed, windDirection, shotHeight);
    
    // Calculate altitude effect
    const altitudeEffect = calculateAltitudeEffect(altitude);
    
    // Calculate trajectory with all effects combined
    const trajectory = calculateTrajectory({
        airDensity,
        windEffect,
        altitudeEffect
    });
    
    return {
        airDensityFactor: airDensity,
        windEffect: windEffect,
        altitudeEffect: altitudeEffect,
        trajectory: trajectory,
        maxHeight: trajectory.maxHeight,
        landingAngle: trajectory.landingAngle,
        carryDistance: trajectory.carryDistance,
        timestamp: Date.now()
    };
}
