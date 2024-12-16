/**
 * Core calculation functions module containing all physics and adjustment calculations
 * @module core-calculations
 */

/**
 * Calculate wind effect on shot distance and direction
 * @param {number} windSpeed - Wind speed in mph
 * @param {string} windDirection - Wind direction (N, S, E, W, NE, etc.)
 * @param {string} shotHeight - Shot trajectory height (low, medium, high)
 * @returns {Object} Distance and lateral effects
 */
export function calculateWindEffect(windSpeed, windDirection, shotHeight = 'medium') {
    // Input validation
    if (typeof windSpeed !== 'number' || isNaN(windSpeed)) {
        throw new Error('Shot distance must be a valid number');
    }
    
    // Height-specific adjustments
    const heightMultipliers = {
        'low': 0.65,
        'medium': 1.0,
        'high': 1.35
    };
    
    // Convert wind speed to number
    const speed = Number(windSpeed);
    
    // Get wind angle and calculate components
    const angle = calculateWindAngle(windDirection);
    const headwindComponent = Math.cos(angle * Math.PI / 180) * speed;
    const crosswindComponent = Math.sin(angle * Math.PI / 180) * speed;
    
    // Calculate base effects
    const baseWindEffect = -0.0065; // Negative for headwind effect
    const crosswindFactor = 0.0045;
    
    let heightMultiplier = heightMultipliers[shotHeight] || 1.0;
    
    // Calculate final effects
    const distanceEffect = headwindComponent * baseWindEffect * heightMultiplier;
    const lateralEffect = crosswindComponent * crosswindFactor * heightMultiplier;
    
    return {
        distanceEffect,
        lateralEffect
    };
}

/**
 * Calculate altitude effect on shot distance
 * @param {number} altitude - Altitude in feet
 * @returns {number} Altitude effect (multiplier)
 */
export function calculateAltitudeEffect(altitude = 0) {
    if (altitude < 0) {
        throw new Error('Altitude must be non-negative');
    }
    
    // Convert to number and handle invalid input
    const alt = Number(altitude);
    if (isNaN(alt)) {
        return 1.0;
    }
    
    // Base effect: 2.2% per 1000ft
    const baseEffect = (alt / 1000) * 0.022;
    
    // Progressive effect for higher altitudes
    let progressiveEffect = 0;
    if (alt > 5000) {
        progressiveEffect = ((alt - 5000) / 1000) * 0.001;
    }
    
    return 1 + baseEffect + progressiveEffect;
}

/**
 * Calculate air density ratio compared to sea level
 * @param {Object} conditions - Weather conditions
 * @returns {number} Air density ratio
 */
export function calculateAirDensityRatio(conditions) {
    const standardTemp = 59;
    const standardPressure = 29.92;
    const standardHumidity = 50;
    
    const tempRankine = (conditions.temp || standardTemp) + 459.67;
    const standardTempRankine = standardTemp + 459.67;
    
    const pressureRatio = Math.pow((conditions.pressure || standardPressure) / standardPressure, 0.45);
    const temperatureRatio = Math.pow(standardTempRankine / tempRankine, 0.5);
    
    const humidity = conditions.humidity || standardHumidity;
    const humidityFactor = 1 - ((humidity - standardHumidity) / 100 * 0.008);
    
    const densityRatio = (pressureRatio * temperatureRatio * humidityFactor);
    
    return Math.round(densityRatio * 1000) / 1000;
}

/**
 * Helper function to calculate wind angle
 * @param {string} windDirection - Wind direction (N, S, E, W, NE, etc.)
 * @returns {number} Wind angle in degrees
 */
function calculateWindAngle(windDirection) {
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
    
    return directions[windDirection] || 0;
}
