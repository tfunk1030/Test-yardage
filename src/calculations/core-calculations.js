/**
 * Core calculation functions module containing all physics and adjustment calculations
 * @module core-calculations
 */

/**
 * Calculate wind effect on ball trajectory
 * @param {number} windSpeed Wind speed in mph
 * @param {number} windDirection Wind direction in degrees
 * @returns {Object} Wind effect on distance and lateral movement
 */
export function calculateWindEffect(windSpeed, windDirection) {
    // Convert wind direction to radians
    const windRad = windDirection * Math.PI / 180;
    
    // Calculate headwind/tailwind and crosswind components
    const headwind = windSpeed * Math.cos(windRad);
    const crosswind = windSpeed * Math.sin(windRad);
    
    // Calculate distance effect (positive for tailwind, negative for headwind)
    const distanceEffect = -headwind * 0.0068; // Calibrated coefficient
    
    // Calculate lateral effect
    const lateralEffect = crosswind * 0.068; // Calibrated coefficient
    
    return {
        distanceEffect,
        lateralEffect
    };
}

/**
 * Calculate altitude effect on ball flight
 * @param {number} altitude Altitude in feet
 * @returns {Object} Altitude effect factors
 */
export function calculateAltitudeEffect(altitude) {
    if (altitude < 0) return { total: 1, density: 1, carry: 1 };
    
    // Calculate air density ratio (exponential decay model)
    const densityRatio = Math.exp(-altitude / 29000);
    
    // Calculate carry distance factor (empirical model)
    const carryFactor = 1 + (1 - densityRatio) * 1.17;
    
    // Calculate total effect
    const totalEffect = carryFactor / densityRatio;
    
    return {
        total: totalEffect,
        density: densityRatio,
        carry: carryFactor
    };
}

/**
 * Calculate air density ratio based on altitude
 * @param {number} altitude Altitude in feet
 * @returns {number} Air density ratio (relative to sea level)
 */
export function calculateAirDensityRatio(altitude) {
    if (altitude < 0) return 1;
    return Math.exp(-altitude / 29000);
}

/**
 * Calculate air density based on conditions
 * @param {Object} params Environmental parameters
 * @returns {number} Air density in kg/m³
 */
export function calculateAirDensity(params) {
    const {
        temperature = 20, // °C
        pressure = 101325, // Pa
        humidity = 50, // %
        altitude = 0 // meters
    } = params;
    
    // Convert temperature to Kelvin
    const T = temperature + 273.15;
    
    // Calculate saturation vapor pressure (Magnus formula)
    const es = 611.2 * Math.exp(17.67 * temperature / (temperature + 243.5));
    
    // Calculate actual vapor pressure
    const e = es * (humidity / 100);
    
    // Calculate pressure at altitude (barometric formula)
    const p = pressure * Math.exp(-0.0289644 * altitude / (8.31447 * T));
    
    // Calculate air density using enhanced equation
    const Rd = 287.058; // Gas constant for dry air
    const Rv = 461.495; // Gas constant for water vapor
    
    return (p - e) / (Rd * T) + e / (Rv * T);
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
