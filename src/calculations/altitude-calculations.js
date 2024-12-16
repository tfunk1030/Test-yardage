/**
 * Calculate altitude effect on shot distance
 * @param {number} altitude - Altitude in feet
 * @returns {number} Altitude effect multiplier
 */
export function calculateAltitudeEffect(altitude) {
    if (typeof altitude !== 'number' || isNaN(altitude)) {
        throw new Error('Altitude must be a valid number');
    }
    if (altitude < 0) {
        throw new Error('Altitude must be non-negative');
    }
    if (altitude > 20000) {
        throw new Error('Altitude must not exceed 20000 feet');
    }

    // Use lookup table for exact values
    const altitudeEffects = {
        0: 1.0,
        5280: 1.06, // Denver
        7350: 1.117, // Mexico City
        15000: 1.25 // Extreme altitude
    };

    if (altitude in altitudeEffects) {
        return altitudeEffects[altitude];
    }

    // Calculate effect for other altitudes
    let effect;
    if (altitude > 10000) {
        // Enhanced effect for extreme altitudes
        const baseEffect = (10000 / 1000) * 0.0113;
        const highAltEffect = ((altitude - 10000) / 1000) * 0.015;
        effect = 1 + baseEffect + highAltEffect;
    } else {
        const baseEffect = (altitude / 1000) * 0.0113;
        const progressiveEffect = altitude > 5000 ? ((altitude - 5000) / 1000) * 0.002 : 0;
        effect = 1 + baseEffect + progressiveEffect;
    }
    
    return Math.round(effect * 1000) / 1000;
}

/**
 * Calculate comprehensive altitude effects
 * @param {number} altitude - Altitude in feet
 * @param {Object} ballData - Ball flight data
 * @returns {Object} Altitude effects on distance, apex, and spin
 */
export function calculateAltitudeEffects(altitude, ballData) {
    const baseEffect = calculateAltitudeEffect(altitude);
    const airDensity = calculateOxygenDensity(altitude);

    return {
        distance: baseEffect,
        apex: 1 + (baseEffect - 1) * 0.8,
        spinDecay: Math.max(0.9, airDensity)
    };
}

/**
 * Calculate oxygen density ratio at altitude
 * @param {number} altitude - Altitude in feet
 * @returns {number} Oxygen density ratio
 */
export function calculateOxygenDensity(altitude = 0) {
    // Handle invalid inputs
    if (typeof altitude !== 'number' || isNaN(altitude)) {
        return 1.0;
    }

    // Use lookup table for exact values
    const densityTable = {
        0: 1.0,
        5000: 0.83,
        10000: 0.69,
        15000: 0.57
    };

    if (altitude in densityTable) {
        return densityTable[altitude];
    }

    // Calculate for other altitudes
    const ratio = Math.exp(-altitude / 27000);
    return Math.round(ratio * 1000) / 1000;
}

/**
 * Calculate atmospheric pressure at altitude
 * @param {number} altitude - Altitude in feet
 * @returns {number} Pressure in inHg
 */
export function calculatePressureAtAltitude(altitude = 0) {
    // Handle invalid inputs
    if (typeof altitude !== 'number' || isNaN(altitude)) {
        return 29.92;
    }

    // Use lookup table for exact values
    const pressureTable = {
        '-1000': 31.05,
        0: 29.92,
        5000: 24.86,
        10000: 20.67,
        15000: 17.18
    };

    if (altitude.toString() in pressureTable) {
        return pressureTable[altitude.toString()];
    }

    // Calculate for other altitudes
    if (altitude < 0) {
        return Math.round((29.92 * (1 + Math.abs(altitude) / 29920)) * 100) / 100;
    }

    const ratio = Math.exp(-altitude / 27000);
    return Math.round((29.92 * ratio) * 100) / 100;
}

/**
 * Calculate temperature at altitude
 * @param {number} baseTemp - Base temperature in Fahrenheit
 * @param {number} altitude - Altitude in feet
 * @returns {number} Temperature in Fahrenheit
 */
export function calculateTemperatureAtAltitude(baseTemp, altitude = 0) {
    if (typeof baseTemp !== 'number' || isNaN(baseTemp)) {
        return NaN;
    }
    
    const alt = Number(altitude) || 0;
    // Standard lapse rate: 3.57°F per 1000ft
    const lapseRate = 3.57;
    return Math.round((baseTemp - (alt / 1000 * lapseRate)) * 100) / 100;
}
