/**
 * Wind calculations module
 * @module wind-calculations
 */

/**
 * Calculate wind effect on shot
 * @param {number} windSpeed - Wind speed in mph
 * @param {number} windDirection - Wind direction in degrees (0 = N, 90 = E, 180 = S, 270 = W)
 * @param {number} shotDistance - Shot distance in yards
 * @param {number} shotHeight - Maximum shot height in yards
 * @returns {Object} Wind effect on distance and lateral movement
 */
export function calculateWindEffect(windSpeed, windDirection, shotDistance, shotHeight) {
    // Validate inputs
    if (typeof windSpeed !== 'number' || isNaN(windSpeed)) {
        throw new Error('Wind speed must be a valid number');
    }
    if (windSpeed < 0) {
        throw new Error('Wind speed must be non-negative');
    }
    if (windSpeed > 50) {
        throw new Error('Wind speed must not exceed 50 mph');
    }
    if (typeof windDirection !== 'number' || isNaN(windDirection)) {
        throw new Error('Wind direction must be a valid number');
    }
    if (windDirection < 0 || windDirection > 360) {
        throw new Error('Wind direction must be between 0 and 360 degrees');
    }
    if (typeof shotDistance !== 'number' || isNaN(shotDistance)) {
        throw new Error('Shot distance must be a valid number');
    }
    if (shotDistance <= 0) {
        throw new Error('Shot distance must be positive');
    }
    if (typeof shotHeight !== 'number' || isNaN(shotHeight)) {
        throw new Error('Shot height must be a valid number');
    }
    if (shotHeight < 0) {
        throw new Error('Shot height must be non-negative');
    }

    // For zero wind speed, return exactly zero to avoid -0
    if (windSpeed === 0) {
        return {
            distance: 0,
            lateral: 0
        };
    }

    // Convert wind direction to radians and normalize
    const windRad = (windDirection * Math.PI) / 180;
    
    // Calculate headwind/tailwind component (N/S)
    const headwind = -windSpeed * Math.cos(windRad);
    
    // Calculate crosswind component (E/W)
    const crosswind = -windSpeed * Math.sin(windRad);
    
    // Calculate height factor (wind has more effect on higher shots)
    const heightFactor = Math.sqrt(shotHeight / 30); // Normalize to typical 30-yard height
    
    // Calculate normalized effects (max 50% effect at 50mph)
    const maxEffect = 0.5;
    const speedFactor = windSpeed / 50;
    
    // Calculate distance effect (headwind decreases distance, tailwind increases)
    const distanceEffect = (headwind / windSpeed) * maxEffect * speedFactor * heightFactor;
    
    // Calculate lateral effect (positive = right, negative = left)
    const lateralEffect = (crosswind / windSpeed) * maxEffect * speedFactor * heightFactor;
    
    // Return normalized effects
    return {
        distance: Number((distanceEffect * shotDistance).toFixed(2)),
        lateral: Number((lateralEffect * shotDistance).toFixed(2))
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
