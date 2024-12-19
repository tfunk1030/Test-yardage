/**
 * Advanced environmental effects on golf ball flight
 */

/**
 * Calculate air density layers based on altitude
 * @param {number} altitude - Altitude in feet
 * @param {number} temperature - Temperature in °F
 * @param {number} pressure - Pressure in inHg
 * @returns {Array} Array of air density layers
 */
export function calculateAirDensityLayers(altitude, temperature, pressure) {
    const layers = [];
    const maxHeight = Math.max(altitude + 400, 1000); // Calculate 400 feet above shot altitude
    const step = 100; // 100-foot intervals

    for (let height = 0; height <= maxHeight; height += step) {
        // Temperature lapse rate: -3.57°F per 1000ft
        const tempAtHeight = temperature - (height * 3.57 / 1000);
        
        // Pressure decrease with height
        const pressureAtHeight = pressure * Math.exp(-height / 27000);
        
        // Air density calculation
        const tempK = (tempAtHeight + 459.67) * 5/9;
        const density = (pressureAtHeight * 0.0338639) / (tempK * 0.287042);
        
        layers.push({
            height,
            temperature: tempAtHeight,
            pressure: pressureAtHeight,
            density
        });
    }
    
    return layers;
}

/**
 * Calculate dew point effect on ball flight
 * @param {number} temperature - Temperature in °F
 * @param {number} humidity - Relative humidity in %
 * @returns {number} Ball speed adjustment factor
 */
export function calculateDewPointEffect(temperature, humidity) {
    // Calculate dew point
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    const dewPoint = (b * alpha) / (a - alpha);
    
    // Calculate effect on ball speed
    const dewPointDiff = temperature - dewPoint;
    return 1 + (dewPointDiff * 0.0002); // 0.02% per degree difference
}

/**
 * Calculate barometric pressure trend effect
 * @param {number} currentPressure - Current pressure in inHg
 * @param {number} pressureTrend - Pressure change in last 3 hours (inHg)
 * @returns {number} Distance adjustment factor
 */
export function calculatePressureTrendEffect(currentPressure, pressureTrend) {
    // Pressure trending up typically means better carrying conditions
    const trendFactor = pressureTrend * 0.005; // 0.5% per 0.1 inHg change
    return 1 + trendFactor;
}

/**
 * Calculate ground effect near surface
 * @param {number} height - Height above ground in feet
 * @param {number} clubType - Type of club being used
 * @returns {number} Lift coefficient adjustment
 */
export function calculateGroundEffect(height, clubType) {
    const threshold = 20; // feet
    if (height > threshold) return 1;
    
    // Ground effect increases lift when close to ground
    const heightFactor = 1 - (height / threshold);
    return 1 + (heightFactor * 0.1); // Up to 10% increase in lift
}

/**
 * Calculate temperature effect on ball compression
 * @param {number} temperature - Temperature in °F
 * @param {number} compression - Ball compression rating
 * @returns {Object} Ball performance adjustments
 */
export function calculateBallCompressionEffect(temperature, compression) {
    // Reference temperature of 70°F
    const tempDiff = temperature - 70;
    
    // Compression changes with temperature
    const compressionChange = tempDiff * 0.2; // 0.2 points per degree
    const adjustedCompression = compression + compressionChange;
    
    // Calculate effects
    const speedFactor = 1 + (tempDiff * 0.0003); // 0.03% per degree
    const spinFactor = 1 + (tempDiff * 0.0002); // 0.02% per degree
    
    return {
        compressionChange,
        adjustedCompression,
        speedFactor,
        spinFactor
    };
}

/**
 * Calculate all environmental effects
 * @param {Object} params - Environmental parameters
 * @returns {Object} Combined environmental effects
 */
export function calculateEnvironmentalEffects(params) {
    const {
        altitude,
        temperature,
        pressure,
        humidity,
        pressureTrend = 0,
        ballCompression = 90,
        height = 0
    } = params;

    const airLayers = calculateAirDensityLayers(altitude, temperature, pressure);
    const dewPointEffect = calculateDewPointEffect(temperature, humidity);
    const pressureEffect = calculatePressureTrendEffect(pressure, pressureTrend);
    const groundEffect = calculateGroundEffect(height, params.clubType);
    const compressionEffect = calculateBallCompressionEffect(temperature, ballCompression);

    return {
        airLayers,
        dewPointEffect,
        pressureEffect,
        groundEffect,
        compressionEffect,
        totalEffect: dewPointEffect * pressureEffect * groundEffect * compressionEffect.speedFactor
    };
}
