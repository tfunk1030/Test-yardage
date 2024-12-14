/**
 * Web Worker for handling heavy calculations
 */

import { calculateWindEffect } from '../calculations/wind-calculations.js';
import { calculateAltitudeEffect } from '../calculations/altitude-calculations.js';
import { calculateAirDensityEffects } from '../calculations/air-density-calculations.js';

// Cache for storing calculation results
const calculationCache = new Map();

// Handle messages from the main thread
self.onmessage = function(e) {
    const { type, data, cacheKey } = e.data;
    
    // Check cache first
    if (cacheKey && calculationCache.has(cacheKey)) {
        self.postMessage({
            type: type,
            result: calculationCache.get(cacheKey),
            cached: true
        });
        return;
    }
    
    let result;
    
    try {
        switch (type) {
            case 'wind':
                result = calculateWindEffect(
                    data.windSpeed,
                    data.windDirection,
                    data.shotHeight
                );
                break;
                
            case 'altitude':
                result = calculateAltitudeEffect(data.altitude);
                break;
                
            case 'airDensity':
                result = calculateAirDensityEffects(
                    data.conditions,
                    data.ballData
                );
                break;
                
            case 'fullCalculation':
                // Perform all calculations
                const windEffect = calculateWindEffect(
                    data.windSpeed,
                    data.windDirection,
                    data.shotHeight
                );
                
                const altitudeEffect = calculateAltitudeEffect(data.altitude);
                
                const airDensityEffects = calculateAirDensityEffects(
                    data.conditions,
                    data.ballData
                );
                
                result = {
                    wind: windEffect,
                    altitude: altitudeEffect,
                    airDensity: airDensityEffects,
                    total: {
                        distanceEffect: windEffect.distanceEffect * altitudeEffect.total * airDensityEffects.effects.carry,
                        spinEffect: airDensityEffects.effects.spin
                    }
                };
                break;
                
            default:
                throw new Error(`Unknown calculation type: ${type}`);
        }
        
        // Cache the result
        if (cacheKey) {
            calculationCache.set(cacheKey, result);
            
            // Limit cache size
            if (calculationCache.size > 1000) {
                const firstKey = calculationCache.keys().next().value;
                calculationCache.delete(firstKey);
            }
        }
        
        self.postMessage({
            type: type,
            result: result,
            cached: false
        });
        
    } catch (error) {
        self.postMessage({
            type: type,
            error: error.message
        });
    }
};

// Handle cache clearing
self.onclear = function() {
    calculationCache.clear();
    self.postMessage({ type: 'cacheClear', success: true });
};
