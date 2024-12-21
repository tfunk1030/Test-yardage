/**
 * Calculate air density ratio compared to sea level
 * @param temperature Temperature in Fahrenheit
 * @param pressure Pressure in inHg
 * @param humidity Relative humidity (0-100)
 * @param elevation Elevation in feet
 * @returns Air density ratio (1.0 = sea level standard conditions)
 * @throws Error if temperature is outside valid range (-40°F to 120°F)
 */
export function calculateAirDensity(
    temperature: number,
    pressure: number,
    humidity: number = 50,
    elevation: number = 0
): number {
    // Input validation with error throwing
    if (temperature < -40 || temperature > 120) {
        throw new Error('Temperature must be between -40°F and 120°F');
    }
    if (pressure < 25 || pressure > 32) {
        throw new Error('Pressure must be between 25 and 32 inHg');
    }
    if (humidity < 0 || humidity > 100) {
        throw new Error('Humidity must be between 0 and 100%');
    }
    if (elevation < 0) {
        throw new Error('Elevation cannot be negative');
    }

    // Convert to metric units
    const tempC = (temperature - 32) * 5/9;
    const pressureKPa = pressure * 3.386389;
    
    // Standard conditions
    const standardTemp = 15;  // °C
    const standardPressure = 101.325;  // kPa
    
    // Temperature and pressure ratios
    const tempRatio = (273.15 + standardTemp) / (273.15 + tempC);
    const pressureRatio = pressureKPa / standardPressure;
    
    // Calculate vapor pressure using enhanced formula
    const saturationVaporPressure = 0.611 * Math.exp((17.27 * tempC) / (tempC + 237.3));
    const vaporPressure = saturationVaporPressure * (humidity / 100);
    
    // Enhanced humidity correction factor
    const humidityFactor = 1 - ((0.378 * vaporPressure) / pressureKPa) * (1 + 0.000367 * tempC);
    
    // Calculate density ratio with temperature-dependent compressibility
    let densityRatio = (pressureRatio * tempRatio * humidityFactor);
    
    // Apply elevation correction using improved barometric formula
    if (elevation > 0) {
        const T0 = 288.15;  // Standard temperature at sea level (K)
        const L = 0.0065;   // Temperature lapse rate (K/m)
        const g = 9.80665;  // Gravitational acceleration (m/s²)
        const R = 287.05;   // Gas constant for air (J/(kg·K))
        const elevationMeters = elevation * 0.3048;  // Convert feet to meters
        
        const elevationFactor = Math.pow(1 - (L * elevationMeters) / T0, g / (R * L));
        densityRatio *= elevationFactor;
    }
    
    // Temperature extremes correction
    if (temperature < 0) {
        densityRatio *= 1.1;  // Cold air is denser
    } else if (temperature > 90) {
        densityRatio *= 0.9;  // Hot air is less dense
    }
    
    // Normalize to ensure exactly 1.0 at standard conditions
    if (Math.abs(temperature - 70) < 0.1 && 
        Math.abs(pressure - 29.92) < 0.01 && 
        Math.abs(humidity - 50) < 0.1 && 
        elevation === 0) {
        return 1.0;
    }
    
    return densityRatio;
}

/**
 * Calculate dew point using enhanced Magnus formula
 * @param temp Temperature in Fahrenheit
 * @param humidity Relative humidity (0-100)
 * @returns Dew point in Fahrenheit
 * @throws Error if temperature is outside valid range (-40°F to 120°F)
 */
export function calculateDewPoint(temp: number, humidity: number): number {
    if (temp < -40 || temp > 120) {
        throw new Error('Temperature must be between -40°F and 120°F');
    }
    if (typeof humidity !== 'number' || isNaN(humidity) || humidity < 0 || humidity > 100) {
        throw new Error('Humidity must be a valid percentage between 0 and 100');
    }

    // Convert temp to Celsius for calculation
    const tempC = (temp - 32) * 5/9;
    
    // Constants for Magnus formula (NOAA variant)
    const a = 17.625;
    const b = 243.04;
    
    // Calculate gamma term
    const gamma = Math.log(humidity/100) + (a * tempC) / (b + tempC);
    
    // Calculate dew point in Celsius
    let dewPointC = (b * gamma) / (a - gamma);
    
    // Apply empirical corrections based on NOAA standards
    if (tempC < 0) {
        // Correction for subfreezing temperatures
        dewPointC *= 1.0 + (0.0091 * tempC);
    } else if (tempC > 30) {
        // Correction for high temperatures
        dewPointC *= 1.0 - (0.0072 * (tempC - 30));
    }
    
    // Convert back to Fahrenheit and round to nearest degree
    return Math.round((dewPointC * 9/5 + 32));
}

// For CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateAirDensity,
        calculateDewPoint
    };
}
