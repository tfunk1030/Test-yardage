/**
 * Wind calculations module
 * @module wind-calculations
 */

/**
 * Calculate wind effect on shot distance and direction
 * @param {number} windSpeed - Wind speed in mph
 * @param {number} windDirection - Wind direction in degrees (0-360)
 * @param {number} shotHeight - Maximum shot height in yards
 * @returns {Object} Object containing distance and lateral effects as percentages
 */
export function calculateWindEffect(windSpeed, windDirection, shotHeight) {
    // Input validation
    if (typeof windSpeed !== 'number' || isNaN(windSpeed)) {
        console.error('Invalid wind speed:', windSpeed);
        throw new Error('Wind speed must be a valid number');
    }
    if (typeof windDirection !== 'number' || isNaN(windDirection)) {
        console.error('Invalid wind direction:', windDirection);
        throw new Error('Wind direction must be a valid number');
    }
    if (windDirection < 0 || windDirection > 360) {
        console.error('Wind direction out of range:', windDirection);
        throw new Error('Wind direction must be between 0 and 360 degrees');
    }
    if (typeof shotHeight !== 'number' || isNaN(shotHeight)) {
        console.error('Invalid shot height:', shotHeight);
        throw new Error('Shot height must be a valid number');
    }
    if (windSpeed < 0) {
        console.error('Negative wind speed:', windSpeed);
        throw new Error('Wind speed must be non-negative');
    }
    if (windSpeed > 50) {
        console.error('Wind speed too high:', windSpeed);
        throw new Error('Wind speed must not exceed 50 mph');
    }
    if (shotHeight <= 0) {
        console.error('Invalid shot height:', shotHeight);
        throw new Error('Shot height must be non-negative');
    }

    // For zero wind speed, return no effect
    if (windSpeed === 0) {
        console.log('Zero wind speed - no effect');
        return {
            distance: 0,
            lateral: 0
        };
    }

    // Convert wind direction to radians and calculate components
    const windAngleRad = (windDirection * Math.PI) / 180;
    const headwindComponent = -Math.cos(windAngleRad); // Negative because 0° is headwind
    const crosswindComponent = -Math.sin(windAngleRad); // Negative because 90° should push ball left

    // Calculate height factor (higher shots are affected more by wind)
    const heightFactor = 1 + (shotHeight / 100) * 0.5;

    // Calculate headwind effect (1% per mph for headwind, 0.6% per mph for tailwind)
    let distanceEffect;
    if (headwindComponent > 0) { // Headwind
        distanceEffect = -headwindComponent * windSpeed * 0.01 * heightFactor;
    } else { // Tailwind
        distanceEffect = -headwindComponent * windSpeed * 0.006 * heightFactor;
    }

    // Calculate crosswind effect (2% per 5mph)
    const crosswindEffect = crosswindComponent * windSpeed * 0.004 * heightFactor;

    // Apply maximum effects to prevent unrealistic results
    const maxEffect = 0.3; // Maximum 30% change
    const finalDistanceEffect = Number(Math.max(Math.min(distanceEffect, maxEffect), -maxEffect).toFixed(6)) || 0;
    const finalLateralEffect = Number(Math.max(Math.min(crosswindEffect, maxEffect), -maxEffect).toFixed(6)) || 0;

    console.log('Wind calculation results:', {
        windSpeed,
        windDirection,
        shotHeight,
        headwindComponent,
        crosswindComponent,
        heightFactor,
        distanceEffect: finalDistanceEffect,
        lateralEffect: finalLateralEffect
    });

    return {
        distance: finalDistanceEffect,
        lateral: finalLateralEffect
    };
}

/**
 * Calculate wind angle from direction string
 * @param {string} windDirection - Wind direction (N, S, E, W, NE, etc.)
 * @returns {number} Wind angle in degrees
 */
export function calculateWindAngle(windDirection) {
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
    
    return directions[windDirection?.toUpperCase()] || 0;
}

/**
 * Calculate effective wind speed based on elevation
 * @param {number} windSpeed - Base wind speed in mph
 * @param {number} elevation - Elevation in feet
 * @returns {number} Adjusted wind speed
 */
export function calculateEffectiveWindSpeed(windSpeed, elevation) {
    const baseSpeed = Math.abs(Number(windSpeed) || 0);
    const elevationFactor = 1 + Math.min(0.3, (elevation / 10000) * 0.15);
    return baseSpeed * elevationFactor;
}
