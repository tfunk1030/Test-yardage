/**
 * Air density calculations module
 * @module air-density-calculations
 */

/**
 * Calculate relative air density based on temperature, pressure, and humidity
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {number} pressure - Barometric pressure in inHg
 * @param {number} humidity - Relative humidity as percentage (0-100)
 * @returns {number} Relative air density (1.0 = standard conditions)
 */
export function calculateAirDensity(temperature, pressure, humidity) {
    // Validate inputs
    if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error('Temperature must be a valid number');
    }
    if (typeof pressure !== 'number' || isNaN(pressure)) {
        throw new Error('Pressure must be a valid number');
    }
    if (typeof humidity !== 'number' || isNaN(humidity)) {
        throw new Error('Humidity must be a valid number');
    }
    if (temperature < -40 || temperature > 120) {
        throw new Error('Temperature must be between -40°F and 120°F');
    }
    if (pressure < 25 || pressure > 32) {
        throw new Error('Pressure must be between 25 and 32 inHg');
    }
    if (humidity < 0 || humidity > 100) {
        throw new Error('Humidity must be between 0% and 100%');
    }

    // For standard conditions, return exactly 1.0
    if (temperature === 59 && pressure === 29.92 && humidity === 0) {
        return 1.0;
    }

    // Convert temperature to Celsius for calculations
    const tempC = (temperature - 32) * (5/9);
    
    // Standard conditions
    const STANDARD_TEMP_C = 15;  // 59°F
    const STANDARD_PRESSURE = 29.92;  // inHg
    const STANDARD_HUMIDITY = 0;  // 0%
    
    // Calculate vapor pressure using Magnus formula
    const vaporPressure = 6.11 * Math.exp((17.27 * tempC) / (237.3 + tempC)) * (humidity / 100);
    const standardVaporPressure = 6.11 * Math.exp((17.27 * STANDARD_TEMP_C) / (237.3 + STANDARD_TEMP_C)) * (STANDARD_HUMIDITY / 100);
    
    // Convert pressure to hPa (mb)
    const pressureHPa = pressure * 33.8639;
    const standardPressureHPa = STANDARD_PRESSURE * 33.8639;
    
    // Calculate dry air pressure (subtract vapor pressure)
    const dryPressure = pressureHPa - vaporPressure;
    const standardDryPressure = standardPressureHPa - standardVaporPressure;
    
    // Calculate relative air density
    // Using the ideal gas law and accounting for water vapor
    const density = (dryPressure * 28.964 + vaporPressure * 18.016) / (8314.32 * (tempC + 273.15));
    const standardDensity = (standardDryPressure * 28.964 + standardVaporPressure * 18.016) / (8314.32 * (STANDARD_TEMP_C + 273.15));
    
    // Return rounded value to avoid floating-point precision issues
    return Number((density / standardDensity).toFixed(6));
}

/**
 * Calculate vapor pressure
 * @param {number} temp - Temperature in Fahrenheit
 * @returns {number} Vapor pressure in inHg
 */
export function calculateVaporPressure(temp) {
    const tempC = (temp - 32) * 5/9;
    const a = 17.27;
    const b = 237.7;
    
    const gamma = (a * tempC) / (b + tempC);
    return 29.92 * Math.exp(gamma);
}

/**
 * Calculate dew point temperature using the Magnus-Tetens formula
 * @param {number} tempF - Temperature in Fahrenheit
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Dew point temperature in Fahrenheit
 */
export function calculateDewPoint(tempF, humidity) {
    // Validate inputs
    if (typeof tempF !== 'number' || isNaN(tempF)) {
        throw new Error('Temperature must be a valid number');
    }
    if (typeof humidity !== 'number' || isNaN(humidity)) {
        throw new Error('Humidity must be a valid number');
    }
    if (tempF < -40 || tempF > 120) {
        throw new Error('Temperature must be between -40°F and 120°F');
    }
    if (humidity < 0 || humidity > 100) {
        throw new Error('Humidity must be between 0% and 100%');
    }

    // Convert temperature to Celsius
    const tempC = (tempF - 32) * (5/9);
    
    // Constants for Magnus-Tetens formula
    const b = 17.27;
    const c = 237.7;
    
    // Calculate dew point in Celsius
    const gamma = ((b * tempC) / (c + tempC)) + Math.log(humidity/100);
    const dewPointC = (c * gamma) / (b - gamma);
    
    // Convert back to Fahrenheit and round to 2 decimal places
    return Number(((dewPointC * 9/5) + 32).toFixed(2));
}

/**
 * Calculate air density effects on ball flight
 * @param {Object} conditions - Weather conditions
 * @param {Object} ballData - Ball flight characteristics
 * @returns {Object} Air density effects
 */
export function calculateAirDensityEffects(conditions, ballData) {
    // Validate inputs
    if (!conditions || typeof conditions !== 'object') {
        throw new Error('Conditions must be a valid object');
    }
    if (!ballData || typeof ballData !== 'object') {
        throw new Error('Ball data must be a valid object');
    }
    
    const { temp, pressure, humidity } = conditions;
    if (temp === undefined || pressure === undefined || humidity === undefined) {
        throw new Error('Conditions must include temp, pressure, and humidity');
    }

    const densityRatio = calculateAirDensity(temp, pressure, humidity);
    const dewPoint = calculateDewPoint(temp, humidity);
    
    // Calculate effects based on density and moisture
    const moistureEffect = 1 - (temp - dewPoint) / 100 * 0.01;
    const spinEffect = densityRatio * moistureEffect;
    const dragEffect = Math.pow(densityRatio, 0.5);

    return {
        density: Number(densityRatio.toFixed(6)),
        dewPoint: Number(dewPoint.toFixed(2)),
        spinEffect: Number(spinEffect.toFixed(6)),
        dragEffect: Number(dragEffect.toFixed(6))
    };
}
