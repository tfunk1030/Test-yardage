import { calculateWindEffect } from './wind-calculations.js';
import { calculateTemperatureEffect } from './temperature-calculations.js';

/**
 * Calculate total shot adjustments based on environmental conditions
 * @param {Object} params - Shot parameters
 * @param {number} params.shotDistance - Base shot distance in yards
 * @param {number} params.shotHeight - Maximum shot height in yards
 * @param {number} params.shotDirection - Shot direction in degrees
 * @param {number} params.windSpeed - Wind speed in mph
 * @param {number} params.windDirection - Wind direction in degrees
 * @param {number} params.temperature - Temperature in °F
 * @returns {Object} Shot adjustments and final distances
 */
export function calculateShotAdjustments(params) {
    // Validate required parameters
    const {
        shotDistance = 200,
        shotHeight = 30,
        shotDirection = 0,
        windSpeed = 0,
        windDirection = 0,
        temperature = 70
    } = params;

    // Calculate wind effects
    const windEffects = calculateWindEffect(windSpeed, windDirection, shotDistance, shotHeight);
    
    // Calculate temperature effect
    const temperatureEffect = calculateTemperatureEffect(temperature, shotDistance);

    // Calculate total adjustments
    const totalAdjustment = windEffects.distance + temperatureEffect;
    
    // Calculate final adjusted distance
    const adjustedDistance = Math.round(shotDistance + totalAdjustment);

    return {
        windEffect: Math.round(windEffects.distance),
        temperatureEffect,
        lateralMovement: Math.round(windEffects.lateral),
        adjustedDistance,
        totalAdjustment: Math.round(totalAdjustment)
    };
}
