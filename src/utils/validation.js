/**
 * Validation utilities
 * @module validation
 */

/**
 * Validate numeric input
 * @param {any} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export function validateNumeric(value, options = {}) {
    const {
        min = -Infinity,
        max = Infinity,
        required = true,
        name = 'Value'
    } = options;
    
    if (required && (value === null || value === undefined || value === '')) {
        return {
            valid: false,
            error: `${name} is required`
        };
    }
    
    if (value === '' && !required) {
        return { valid: true };
    }
    
    const num = Number(value);
    
    if (isNaN(num)) {
        return {
            valid: false,
            error: `${name} must be a number`
        };
    }
    
    if (num < min) {
        return {
            valid: false,
            error: `${name} must be at least ${min}`
        };
    }
    
    if (num > max) {
        return {
            valid: false,
            error: `${name} must be at most ${max}`
        };
    }
    
    return { valid: true };
}

/**
 * Validate wind direction
 * @param {string} direction - Wind direction to validate
 * @returns {Object} Validation result
 */
export function validateWindDirection(direction) {
    const validDirections = [
        'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    
    if (!direction) {
        return {
            valid: false,
            error: 'Wind direction is required'
        };
    }
    
    if (!validDirections.includes(direction.toUpperCase())) {
        return {
            valid: false,
            error: 'Invalid wind direction'
        };
    }
    
    return { valid: true };
}

/**
 * Validate weather conditions
 * @param {Object} conditions - Weather conditions to validate
 * @returns {Object} Validation result
 */
export function validateWeatherConditions(conditions) {
    const errors = [];
    
    // Temperature validation
    const tempValidation = validateNumeric(conditions.temp, {
        min: -50,
        max: 150,
        name: 'Temperature'
    });
    if (!tempValidation.valid) errors.push(tempValidation.error);
    
    // Humidity validation
    const humidityValidation = validateNumeric(conditions.humidity, {
        min: 0,
        max: 100,
        name: 'Humidity'
    });
    if (!humidityValidation.valid) errors.push(humidityValidation.error);
    
    // Pressure validation
    const pressureValidation = validateNumeric(conditions.pressure, {
        min: 20,
        max: 35,
        name: 'Pressure'
    });
    if (!pressureValidation.valid) errors.push(pressureValidation.error);
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate altitude
 * @param {number} altitude - Altitude to validate
 * @returns {Object} Validation result
 */
export function validateAltitude(altitude) {
    return validateNumeric(altitude, {
        min: -1000,
        max: 20000,
        name: 'Altitude'
    });
}

/**
 * Validate shot data
 * @param {Object} shotData - Shot data to validate
 * @returns {Object} Validation result
 */
export function validateShotData(shotData) {
    const errors = [];
    
    // Club validation
    if (!shotData.club) {
        errors.push('Club selection is required');
    }
    
    // Base yardage validation
    const yardageValidation = validateNumeric(shotData.baseYardage, {
        min: 0,
        max: 400,
        name: 'Base yardage'
    });
    if (!yardageValidation.valid) errors.push(yardageValidation.error);
    
    // Shot height validation
    const validHeights = ['low', 'medium', 'high'];
    if (!validHeights.includes(shotData.shotHeight)) {
        errors.push('Invalid shot height');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}
