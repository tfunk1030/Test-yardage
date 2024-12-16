/**
 * Calculate wind effect on shot distance and direction
 * @param {number} windSpeed - Wind speed in mph
 * @param {number} windDirection - Wind direction in degrees
 * @param {number} shotDistance - Shot distance in yards
 * @param {number} shotHeight - Maximum shot height in yards
 * @returns {Object} Distance and lateral effects
 */
export function calculateWindEffect(windSpeed, windDirection, shotDistance, shotHeight) {
    console.log('Calculating wind effect:', { windSpeed, windDirection, shotDistance, shotHeight });

    // Input validation
    if (typeof windSpeed !== 'number' || isNaN(windSpeed)) {
        throw new Error('Wind speed must be a valid number');
    }
    if (windSpeed < 0) {
        throw new Error('Wind speed must be non-negative');
    }
    if (typeof windDirection !== 'number' || isNaN(windDirection)) {
        throw new Error('Wind direction must be a valid number');
    }
    if (windDirection < 0 || windDirection > 360) {
        throw new Error('Wind direction must be between 0 and 360 degrees');
    }
    if (typeof shotDistance !== 'number' || isNaN(shotDistance)) {
        throw new Error('Shot distance must be a valid number');
    }
    if (shotDistance <= 0) {
        throw new Error('Shot distance must be positive');
    }
    if (typeof shotHeight !== 'number' || isNaN(shotHeight)) {
        throw new Error('Shot height must be a valid number');
    }
    if (shotHeight < 0) {
        throw new Error('Shot height must be non-negative');
    }

    // Calculate wind components
    const radians = windDirection * Math.PI / 180;
    const headwind = windSpeed * Math.cos(radians);
    const crosswind = windSpeed * Math.sin(radians);

    // Height factor affects wind impact
    const heightFactor = Math.min(1.5, Math.max(0.5, shotHeight / 30));

    console.log('Wind components:', { headwind, crosswind, heightFactor });

    // Calculate effects with adjusted coefficients
    const distance = -headwind * 0.0095 * heightFactor; // Adjusted for precision
    const lateral = -crosswind * 0.0085 * heightFactor; // Adjusted for precision

    console.log('Raw wind effects:', { distance, lateral });

    // Handle zero cases
    return { 
        distance: Math.round((Math.abs(distance) < 1e-10 ? 0 : distance) * 1000) / 1000, 
        lateral: Math.round((Math.abs(lateral) < 1e-10 ? 0 : lateral) * 1000) / 1000 
    };
}

/**
 * Calculate effective wind speed at altitude
 * @param {number} windSpeed - Wind speed in mph
 * @param {number} altitude - Altitude in feet
 * @returns {number} Effective wind speed
 */
export function calculateEffectiveWindSpeed(windSpeed, altitude) {
    // Convert inputs to numbers
    const speed = Number(windSpeed);
    const alt = Number(altitude) || 0;

    // Handle invalid inputs
    if (isNaN(speed)) {
        return 0;
    }

    // Handle negative wind speeds
    const absSpeed = Math.abs(speed);

    // Calculate altitude factor
    const altitudeFactor = 1 + (Math.min(20000, Math.max(0, alt)) / 66667);

    // Calculate effective speed with altitude adjustment
    let effectiveSpeed = absSpeed * altitudeFactor;

    // Apply additional factor for negative altitudes
    if (alt < 0) {
        effectiveSpeed *= 1.015;
    }

    // Round to 2 decimal places
    return Math.round(effectiveSpeed * 100) / 100;
}