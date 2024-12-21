/**
 * Calculate air density based on temperature, pressure, and humidity
 * @param {number} temperature - Temperature in °F
 * @param {number} pressure - Barometric pressure in inHg
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Air density ratio compared to standard conditions
 */
export function calculateAirDensity(temperature, pressure, humidity = 50) {
    if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error('Temperature must be a valid number');
    }
    if (typeof pressure !== 'number' || isNaN(pressure)) {
        throw new Error('Pressure must be a valid number');
    }
    if (typeof humidity !== 'number' || isNaN(humidity) || humidity < 0 || humidity > 100) {
        throw new Error('Humidity must be a valid percentage between 0 and 100');
    }

    // Convert temperature to Celsius
    const tempC = (temperature - 32) * 5/9;
    
    // Calculate vapor pressure
    const vaporPressure = calculateVaporPressure(tempC);
    
    // Calculate actual vapor pressure based on humidity
    const actualVaporPressure = vaporPressure * (humidity / 100);
    
    // Convert pressure from inHg to kPa
    const pressureKPa = pressure * 3.386389;
    
    // Calculate dry air pressure (total pressure - vapor pressure)
    const dryAirPressure = pressureKPa - actualVaporPressure;
    
    // Calculate air density using the ideal gas law
    const R = 287.05; // Gas constant for dry air in J/(kg·K)
    const Rv = 461.495; // Gas constant for water vapor in J/(kg·K)
    const T = tempC + 273.15; // Convert to Kelvin
    
    const dryAirDensity = dryAirPressure * 1000 / (R * T);
    const vaporDensity = actualVaporPressure * 1000 / (Rv * T);
    
    const totalDensity = dryAirDensity + vaporDensity;
    
    // Calculate density ratio compared to standard conditions
    const standardDensity = 1.225; // kg/m³ at sea level, 15°C
    return totalDensity / standardDensity;
}

/**
 * Calculate dew point temperature
 * @param {number} temperature - Temperature in °F
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Dew point temperature in °F
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
    
    // Convert temperature to Celsius
    const tempC = (temperature - 32) * 5/9;
    
    // Calculate gamma
    const gamma = ((a * tempC) / (b + tempC)) + Math.log(humidity / 100.0);
    
    // Calculate dew point in Celsius
    const dewPointC = (b * gamma) / (a - gamma);
    
    // Convert back to Fahrenheit
    return (dewPointC * 9/5) + 32;
}

/**
 * Calculate saturation vapor pressure
 * @param {number} tempC - Temperature in Celsius
 * @returns {number} Vapor pressure in kPa
 */
export function calculateVaporPressure(tempC) {
    if (typeof tempC !== 'number' || isNaN(tempC)) {
        throw new Error('Temperature must be a valid number');
    }

    // Magnus formula for vapor pressure
    return 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
}

/**
 * Calculate all air density effects
 * @param {Object} conditions - Environmental conditions
 * @param {Object} ballData - Ball characteristics
 * @returns {Object} Combined effects on ball flight
 */
export function calculateAirDensityEffects(conditions, ballData) {
    // Validate inputs
    if (!conditions || typeof conditions !== 'object') {
        throw new Error('Conditions must be a valid object');
    }
    if (!ballData || typeof ballData !== 'object') {
        throw new Error('Ball data must be a valid object');
    }

    const { temperature, pressure, humidity } = conditions;
    const density = calculateAirDensity(temperature, pressure, humidity);
    
    // Calculate effects based on density ratio
    const dragEffect = Math.pow(density, 0.5);
    const liftEffect = Math.pow(density, 0.5);
    
    // Adjust ball characteristics
    const { dragCoefficient = 0.3, liftCoefficient = 0.2 } = ballData;
    
    return {
        density,
        dragEffect,
        liftEffect,
        adjustedDrag: dragCoefficient * dragEffect,
        adjustedLift: liftCoefficient * liftEffect
    };
}
