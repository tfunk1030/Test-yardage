/**
 * Altitude calculations module
 * @module altitude-calculations
 */

/**
 * Calculate altitude effect on shot distance
 * @param {number} altitude - Altitude in feet above sea level
 * @returns {number} Distance multiplier due to altitude
 */
export function calculateAltitudeEffect(altitude) {
    // Validate input
    if (typeof altitude !== 'number' || isNaN(altitude)) {
        throw new Error('Altitude must be a valid number');
    }
    if (altitude < 0) {
        throw new Error('Altitude must be non-negative');
    }
    if (altitude >= 20000) {
        throw new Error('Altitude must not exceed 20000 feet');
    }

    // For sea level, return exactly 1.0
    if (altitude === 0) {
        return 1.0;
    }

    // Base effect: approximately 1.1% increase per 1000 feet up to 5000 feet
    const baseRate = 0.011;
    let effect = 1.0 + (Math.min(altitude, 5000) / 1000) * baseRate;

    // Additional effect above 5000 feet: reduced rate of increase
    if (altitude > 5000) {
        const reducedRate = 0.009; // 0.9% per 1000 feet
        effect += ((altitude - 5000) / 1000) * reducedRate;
    }

    // Return rounded value to avoid floating-point precision issues
    return Number(effect.toFixed(6));
}

/**
 * Calculate comprehensive altitude effects on ball flight
 * @param {number} altitude - Altitude in feet above sea level
 * @param {Object} ballData - Ball flight characteristics
 * @returns {Object} Altitude effects on various aspects of ball flight
 */
export function calculateAltitudeEffects(altitude, ballData) {
    const altitudeMultiplier = calculateAltitudeEffect(altitude);
    
    return {
        distance: altitudeMultiplier,
        apex: Math.pow(altitudeMultiplier, 0.7),    // Apex height increases less than distance
        spinDecay: Math.pow(altitudeMultiplier, -0.3) // Spin decays slower at altitude
    };
}

/**
 * Calculate oxygen density at altitude
 * @param {number} altitude - Altitude in feet
 * @returns {number} Oxygen density ratio (1.0 = sea level)
 */
export function calculateOxygenDensity(altitude) {
    const alt = Number(altitude) || 0;
    return Math.exp(-alt / 27000);
}

/**
 * Calculate pressure at altitude
 * @param {number} altitude - Altitude in feet
 * @returns {number} Pressure in inHg
 */
export function calculatePressureAtAltitude(altitude) {
    const alt = Number(altitude) || 0;
    const standardPressure = 29.92; // inHg at sea level
    return standardPressure * Math.exp(-alt / 27000);
}

/**
 * Calculate temperature adjustment at altitude
 * @param {number} baseTemp - Base temperature in Fahrenheit
 * @param {number} altitude - Altitude in feet
 * @returns {number} Adjusted temperature in Fahrenheit
 */
export function calculateTemperatureAtAltitude(baseTemp, altitude) {
    const alt = Number(altitude) || 0;
    const tempLapseRate = 3.57; // °F per 1000ft
    return baseTemp - (alt / 1000) * tempLapseRate;
}
