/**
 * Calculate temperature effect on shot distance
 * @param {number} temperature - Temperature in °F
 * @param {number} distance - Shot distance in yards
 * @returns {number} Distance adjustment in yards
 */
export function calculateTemperatureEffect(temperature, distance) {
    // Validate inputs
    if (typeof temperature !== 'number' || isNaN(temperature)) {
        console.error('Invalid temperature value:', temperature);
        return 0;
    }
    if (typeof distance !== 'number' || isNaN(distance)) {
        console.error('Invalid distance value:', distance);
        return 0;
    }

    // Base temperature is 70°F
    const tempDiff = temperature - 70;
    
    // Calculate air density factor
    // Air density changes approximately -0.13% per °F increase
    const airDensityFactor = 1 - (tempDiff * 0.0013);
    
    // Calculate ball compression factor
    // Ball performance improves in warmer temperatures
    const compressionFactor = 1 + (tempDiff * 0.0005);
    
    // Combined effect
    const totalFactor = airDensityFactor * compressionFactor;
    
    // Calculate distance adjustment
    const adjustment = (totalFactor - 1) * distance;
    
    // Round to nearest yard
    return Math.round(adjustment);
}
