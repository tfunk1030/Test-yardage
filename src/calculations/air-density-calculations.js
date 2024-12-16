/**
 * Calculate air density based on temperature and pressure
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {number} pressure - Pressure in inHg
 * @returns {number} Air density in kg/m^3
 */
export function calculateAirDensity(temperature, pressure) {
    if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error('Temperature must be a valid number');
    }
    if (typeof pressure !== 'number' || isNaN(pressure)) {
        throw new Error('Pressure must be a valid number');
    }

    // Convert temperature to Kelvin
    const tempK = (temperature + 459.67) * 5 / 9;

    // Calculate air density using the ideal gas law
    const density = (pressure * 0.0338639) / (tempK * 0.287042);
    
    return Math.round(density * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Calculate dew point based on temperature and humidity
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {number} humidity - Relative humidity in percentage
 * @returns {number} Dew point in Fahrenheit
 */
export function calculateDewPoint(temperature, humidity) {
    if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error('Temperature must be a valid number');
    }
    if (typeof humidity !== 'number' || isNaN(humidity) || humidity < 0 || humidity > 100) {
        throw new Error('Humidity must be a valid percentage between 0 and 100');
    }

    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);

    return Math.round(dewPoint * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate vapor pressure based on temperature
 * @param {number} temperature - Temperature in Fahrenheit
 * @returns {number} Vapor pressure in inHg
 */
export function calculateVaporPressure(temperature) {
    if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error('Temperature must be a valid number');
    }

    const vaporPressure = 0.61078 * Math.exp((17.27 * temperature) / (temperature + 237.3));
    return Math.round(vaporPressure * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Calculate air density effects based on temperature, pressure, humidity, and altitude
 * @param {number} temperature - Temperature in Fahrenheit
 * @param {number} pressure - Pressure in inHg
 * @param {number} humidity - Relative humidity in percentage
 * @param {number} altitude - Altitude in feet
 * @returns {Object} Air density effects
 */
export function calculateAirDensityEffects(temperature, pressure, humidity, altitude) {
    const airDensity = calculateAirDensity(temperature, pressure);
    const dewPoint = calculateDewPoint(temperature, humidity);
    const vaporPressure = calculateVaporPressure(temperature);
    
    return {
        airDensity,
        dewPoint,
        vaporPressure,
        altitude
    };
}
