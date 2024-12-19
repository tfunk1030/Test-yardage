/**
 * Advanced Environmental Modeling
 * Sophisticated environmental impact calculations for golf shots
 */

/**
 * Air density calculation constants
 */
const AIR_CONSTANTS = {
    R: 287.058, // Gas constant for dry air (J/(kg·K))
    g: 9.80665, // Gravitational acceleration (m/s²)
    L: 0.0065,  // Temperature lapse rate (K/m)
    M: 0.0289644, // Molar mass of dry air (kg/mol)
    Rv: 461.5,  // Gas constant for water vapor (J/(kg·K))
};

/**
 * Calculate complex air density
 * @param {Object} conditions - Environmental conditions
 * @returns {number} Air density in kg/m³
 */
export function calculateAirDensity(conditions) {
    const { temperature, pressure, humidity, altitude } = conditions;
    
    // Convert to SI units
    const T = (temperature - 32) * 5/9 + 273.15; // °F to K
    const P = pressure * 3386.39; // inHg to Pascal
    
    // Saturation vapor pressure
    const es = 611.2 * Math.exp(17.67 * (T - 273.15) / (T - 29.65));
    const e = es * (humidity / 100);
    
    // Virtual temperature correction
    const Tv = T / (1 - e/P * (1 - AIR_CONSTANTS.R/AIR_CONSTANTS.Rv));
    
    // Air density calculation
    const density = (P - e) / (AIR_CONSTANTS.R * Tv) + e / (AIR_CONSTANTS.Rv * Tv);
    
    // Altitude correction
    return density * Math.exp(-altitude * AIR_CONSTANTS.g / (AIR_CONSTANTS.R * T));
}

/**
 * Calculate Magnus effect
 * @param {Object} conditions - Environmental conditions
 * @param {Object} ballData - Ball flight data
 * @returns {Object} Magnus force components
 */
export function calculateMagnusEffect(conditions, ballData) {
    const { spinRate, velocity, diameter } = ballData;
    const density = calculateAirDensity(conditions);
    
    // Magnus force coefficient
    const S = (spinRate * Math.PI / 30) * (diameter / 2);
    const Re = (density * velocity * diameter) / 1.81e-5; // Reynolds number
    const Cm = 1 / (2 + (velocity / S)); // Magnus coefficient
    
    const magnusForce = 0.5 * density * Math.pow(velocity, 2) * 
        Math.PI * Math.pow(diameter / 2, 2) * Cm;
    
    return {
        force: magnusForce,
        coefficient: Cm,
        reynolds: Re
    };
}

/**
 * Calculate complex wind effects
 * @param {Object} conditions - Environmental conditions
 * @param {Object} shotData - Shot parameters
 * @returns {Object} Wind effect analysis
 */
export function calculateWindEffects(conditions, shotData) {
    const { windSpeed, windDirection } = conditions;
    const { launchAngle, launchDirection } = shotData;
    
    // Convert to radians
    const windAngle = windDirection * Math.PI / 180;
    const shotAngle = launchDirection * Math.PI / 180;
    
    // Calculate effective wind components
    const headwind = windSpeed * Math.cos(windAngle - shotAngle);
    const crosswind = windSpeed * Math.sin(windAngle - shotAngle);
    
    // Calculate wind effects
    return {
        carry: calculateWindCarryEffect(headwind, crosswind, launchAngle),
        direction: calculateWindDirectionEffect(crosswind, shotData),
        trajectory: calculateWindTrajectoryEffect(headwind, crosswind, shotData)
    };
}

/**
 * Calculate wind carry effect
 * @param {number} headwind - Headwind component
 * @param {number} crosswind - Crosswind component
 * @param {number} launchAngle - Launch angle
 * @returns {Object} Carry effect analysis
 */
function calculateWindCarryEffect(headwind, crosswind, launchAngle) {
    const headwindEffect = -0.3 * headwind * Math.cos(launchAngle * Math.PI / 180);
    const crosswindEffect = -0.1 * Math.abs(crosswind);
    
    return {
        total: headwindEffect + crosswindEffect,
        components: {
            headwind: headwindEffect,
            crosswind: crosswindEffect
        }
    };
}

/**
 * Calculate wind direction effect
 * @param {number} crosswind - Crosswind component
 * @param {Object} shotData - Shot parameters
 * @returns {Object} Direction effect analysis
 */
function calculateWindDirectionEffect(crosswind, shotData) {
    const { ballSpeed, spinRate } = shotData;
    
    // Basic direction change
    const baseEffect = Math.atan2(crosswind, ballSpeed) * 180 / Math.PI;
    
    // Spin interaction
    const spinInteraction = (spinRate / 3000) * baseEffect;
    
    return {
        total: baseEffect + spinInteraction,
        components: {
            base: baseEffect,
            spinInteraction
        }
    };
}

/**
 * Calculate wind trajectory effect
 * @param {number} headwind - Headwind component
 * @param {number} crosswind - Crosswind component
 * @param {Object} shotData - Shot parameters
 * @returns {Object} Trajectory effect analysis
 */
function calculateWindTrajectoryEffect(headwind, crosswind, shotData) {
    const { launchAngle, ballSpeed } = shotData;
    
    // Calculate trajectory changes
    const apexChange = calculateApexChange(headwind, launchAngle, ballSpeed);
    const curveAmount = calculateCurveAmount(crosswind, shotData);
    
    return {
        apexChange,
        curveAmount,
        flightTimeChange: apexChange * 0.15
    };
}

/**
 * Calculate apex height change
 * @param {number} headwind - Headwind component
 * @param {number} launchAngle - Launch angle
 * @param {number} ballSpeed - Ball speed
 * @returns {number} Apex height change
 */
function calculateApexChange(headwind, launchAngle, ballSpeed) {
    const launchRad = launchAngle * Math.PI / 180;
    const timeToApex = ballSpeed * Math.sin(launchRad) / 9.81;
    
    return headwind * timeToApex * Math.sin(launchRad);
}

/**
 * Calculate curve amount
 * @param {number} crosswind - Crosswind component
 * @param {Object} shotData - Shot parameters
 * @returns {number} Curve amount
 */
function calculateCurveAmount(crosswind, shotData) {
    const { spinRate, ballSpeed } = shotData;
    const spinFactor = spinRate / 3000;
    
    return crosswind * spinFactor * (ballSpeed / 150);
}

/**
 * Calculate atmospheric pressure trend effect
 * @param {Object} conditions - Environmental conditions
 * @returns {Object} Pressure trend analysis
 */
export function calculatePressureTrendEffect(conditions) {
    const { pressure, pressureTrend } = conditions;
    
    // Calculate density changes
    const densityChange = (pressureTrend / pressure) * 100;
    
    return {
        densityEffect: densityChange,
        carryEffect: -densityChange * 0.5,
        confidence: calculateTrendConfidence(pressureTrend)
    };
}

/**
 * Calculate trend confidence
 * @param {number} trend - Pressure trend
 * @returns {number} Confidence value
 */
function calculateTrendConfidence(trend) {
    return Math.min(1, Math.abs(trend) / 0.05);
}

/**
 * Calculate dew effect on ball flight
 * @param {Object} conditions - Environmental conditions
 * @returns {Object} Dew effect analysis
 */
export function calculateDewEffect(conditions) {
    const { temperature, humidity } = conditions;
    
    // Calculate dew point
    const dewPoint = calculateDewPoint(temperature, humidity);
    const surfaceTemp = temperature;
    
    // Calculate effects
    const moistureEffect = calculateMoistureEffect(dewPoint, surfaceTemp);
    const frictionEffect = calculateFrictionEffect(dewPoint, surfaceTemp);
    
    return {
        dewPoint,
        moistureEffect,
        frictionEffect,
        totalEffect: moistureEffect * frictionEffect
    };
}

/**
 * Calculate dew point
 * @param {number} temperature - Temperature in °F
 * @param {number} humidity - Relative humidity
 * @returns {number} Dew point in °F
 */
function calculateDewPoint(temperature, humidity) {
    const T = (temperature - 32) * 5/9;
    const RH = humidity;
    
    const b = 17.27;
    const c = 237.7;
    
    const gamma = Math.log(RH/100) + (b * T)/(c + T);
    const Td = (c * gamma)/(b - gamma);
    
    return Td * 9/5 + 32;
}

/**
 * Calculate moisture effect
 * @param {number} dewPoint - Dew point
 * @param {number} surfaceTemp - Surface temperature
 * @returns {number} Moisture effect factor
 */
function calculateMoistureEffect(dewPoint, surfaceTemp) {
    const diff = surfaceTemp - dewPoint;
    return diff < 5 ? 1 - (5 - diff) * 0.01 : 1;
}

/**
 * Calculate friction effect
 * @param {number} dewPoint - Dew point
 * @param {number} surfaceTemp - Surface temperature
 * @returns {number} Friction effect factor
 */
function calculateFrictionEffect(dewPoint, surfaceTemp) {
    const diff = surfaceTemp - dewPoint;
    return diff < 3 ? 1 - (3 - diff) * 0.02 : 1;
}
