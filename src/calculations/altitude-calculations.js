/**
 * Altitude calculations module
 * @module altitude-calculations
 */

/**
 * Calculate altitude effect on shot distance
 * @param {number} altitude - Altitude in feet
 * @returns {Object} Altitude effect components
 */
export function calculateAltitudeEffect(altitude = 0) {
    // Input validation with detailed error messages
    if (typeof altitude !== 'number' || isNaN(altitude)) {
        console.error('Invalid altitude value:', altitude);
        throw new Error('Altitude must be a valid number');
    }
    if (altitude < 0) {
        console.error('Negative altitude:', altitude);
        throw new Error('Altitude cannot be negative');
    }
    if (altitude > 15000) {
        console.error('Altitude too high:', altitude);
        throw new Error('Altitude cannot exceed 15,000 feet');
    }

    // For sea level, return no effect
    if (altitude === 0) {
        console.log('Sea level - no altitude effect');
        return {
            total: 1,
            components: {
                base: 0,
                progressive: 0,
                density: 1,
                spin: 0
            }
        };
    }

    // Calculate base effect (logarithmic scaling)
    const baseEffect = Math.log(altitude / 1000 + 1) * 0.045;

    // Progressive scaling with altitude bands
    let progressiveEffect = 0;
    if (altitude > 2000) progressiveEffect += (altitude - 2000) / 120000;
    if (altitude > 4000) progressiveEffect += (altitude - 4000) / 110000;
    if (altitude > 6000) progressiveEffect += (altitude - 6000) / 100000;

    // Air density effect
    const densityEffect = Math.exp(-altitude / 30000);

    // Spin effect
    const spinEffect = Math.min(altitude / 120000, 0.065);

    // Calculate total effect
    const totalEffect = 1 + ((baseEffect + progressiveEffect) * densityEffect);

    // Log calculation results
    console.log('Altitude calculation results:', {
        altitude,
        baseEffect,
        progressiveEffect,
        densityEffect,
        spinEffect,
        totalEffect
    });

    return {
        total: Number(totalEffect.toFixed(6)),
        components: {
            base: Number(baseEffect.toFixed(6)),
            progressive: Number(progressiveEffect.toFixed(6)),
            density: Number(densityEffect.toFixed(6)),
            spin: Number(spinEffect.toFixed(6))
        }
    };
}

/**
 * Calculate comprehensive altitude effects on ball flight
 * @param {number} altitude - Altitude in feet
 * @param {Object} ballData - Ball flight characteristics
 * @returns {Object} Altitude effects on various aspects of ball flight
 */
export function calculateAltitudeEffects(altitude, ballData) {
    const altitudeMultiplier = calculateAltitudeEffect(altitude).total;
    
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
 * Calculate pressure at a given altitude
 * @param {number} altitude - Altitude in feet
 * @returns {number} Pressure in inHg
 */
export function calculatePressureAtAltitude(altitude) {
    if (typeof altitude !== 'number' || isNaN(altitude)) {
        return 29.92; // Return sea level pressure for invalid inputs
    }

    // Base pressure at sea level (inHg)
    const seaLevelPressure = 29.92;
    
    // For negative altitudes, increase pressure linearly
    if (altitude < 0) {
        return Number((seaLevelPressure + Math.abs(altitude) * 0.00113).toFixed(4));
    }
    
    // Using empirically calibrated lookup table
    const pressurePoints = [
        { alt: 0, pressure: 29.92 },
        { alt: 5000, pressure: 24.86 },
        { alt: 10000, pressure: 20.67 },
        { alt: 15000, pressure: 17.18 }
    ];
    
    // Find the appropriate range and interpolate
    for (let i = 0; i < pressurePoints.length - 1; i++) {
        const lower = pressurePoints[i];
        const upper = pressurePoints[i + 1];
        
        if (altitude <= lower.alt) {
            return lower.pressure;
        }
        
        if (altitude <= upper.alt) {
            const ratio = (altitude - lower.alt) / (upper.alt - lower.alt);
            const pressure = lower.pressure + (upper.pressure - lower.pressure) * ratio;
            return Number(pressure.toFixed(4));
        }
    }
    
    // For altitudes above the highest point, use exponential decay
    const last = pressurePoints[pressurePoints.length - 1];
    return Number((last.pressure * Math.exp(-0.0000508 * (altitude - last.alt))).toFixed(4));
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
