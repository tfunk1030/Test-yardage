// Ball flight physics calculations

/**
 * Calculate dew point using Magnus formula
 * @param {number} temp - Temperature in Fahrenheit
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Dew point in Fahrenheit
 */
export function calculateDewPoint(temp, humidity) {
    // Convert temp to Celsius for calculation
    const tempC = (temp - 32) * 5/9;
    
    // Constants for Magnus formula
    const a = 17.27;
    const b = 237.7;
    
    // Calculate gamma using relative humidity
    const gamma = ((a * tempC) / (b + tempC)) + Math.log(humidity/100);
    
    // Calculate dew point in Celsius
    const dewPointC = (b * gamma) / (a - gamma);
    
    // Convert back to Fahrenheit
    return (dewPointC * 9/5) + 32;
}

/**
 * Calculate spin decay during flight
 * @param {number} initialSpin - Initial spin rate in RPM
 * @param {number} airDensity - Air density ratio (1 = sea level)
 * @param {number} flightTime - Time in seconds
 * @returns {number} Final spin rate in RPM
 */
export function calculateSpinDecay(initialSpin, airDensity, flightTime) {
    // Spin decay rate increases with air density
    const decayRate = 0.15 * airDensity;
    
    // Exponential decay formula
    return initialSpin * Math.exp(-decayRate * flightTime);
}

/**
 * Calculate dew point effect on spin and carry
 * @param {number} dewPoint - Dew point in Fahrenheit
 * @param {number} temp - Temperature in Fahrenheit
 * @returns {Object} Effect factors for spin and carry
 */
export function calculateDewPointEffect(dewPoint, temp) {
    // Calculate spread between temp and dew point
    const spread = temp - dewPoint;
    
    // Closer spread means more moisture on ball and grass
    // This affects both spin and carry
    const spinFactor = spread < 5 ? 0.95 : // Wet conditions reduce spin
                      spread < 10 ? 0.97 :
                      1.0;
                      
    const carryFactor = spread < 5 ? 0.97 : // Wet conditions reduce carry
                       spread < 10 ? 0.98 :
                       1.0;
    
    return {
        spinFactor,
        carryFactor
    };
}

/**
 * Calculate total ball flight adjustments
 * @param {Object} conditions - Weather conditions
 * @param {Object} ballData - Ball flight data
 * @param {Object} clubData - Club-specific data
 * @returns {Object} Adjusted ball flight parameters
 */
export function calculateBallFlightAdjustments(conditions, ballData, clubData) {
    const { temp, humidity, airDensity } = conditions;
    const { initialSpin, flightTime } = ballData;
    
    // Calculate environmental effects
    const dewPoint = calculateDewPoint(temp, humidity);
    const dewPointEffects = calculateDewPointEffect(dewPoint, temp);
    
    // Calculate trajectory characteristics
    const trajectoryData = calculateTrajectoryShape(clubData, airDensity);
    
    // Calculate spin decay using club-specific characteristics
    const finalSpin = initialSpin * Math.exp(-trajectoryData.spinDecayRate * flightTime);
    
    // Calculate carry adjustment based on trajectory shape
    const trajectoryFactor = 1 + (1 - trajectoryData.trajectoryShape) * 0.05;
    
    return {
        dewPoint,
        finalSpin,
        spinFactor: dewPointEffects.spinFactor,
        carryFactor: dewPointEffects.carryFactor * trajectoryFactor,
        trajectoryData,
        
        // Total carry adjustment including all factors
        totalFactor: dewPointEffects.carryFactor * trajectoryFactor
    };
}

/**
 * Calculate ball compression factor
 * @param {Object} clubData - Club-specific data
 * @param {number} temperature - Temperature in Fahrenheit
 * @returns {number} Ball compression factor
 */
export function calculateBallCompression(clubData, temperature) {
    if (!clubData) return 0.95; // default compression factor
    
    const baseCompression = clubData.compression || 0.95;
    const tempEffect = (temperature - 70) * 0.0005;
    return Math.max(0.85, Math.min(1.0, baseCompression + tempEffect));
}

/**
 * Calculate trajectory shape and characteristics
 * @param {Object} clubData - Club-specific data from constants
 * @param {number} airDensity - Air density ratio
 * @returns {Object} Trajectory characteristics
 */
export function calculateTrajectoryShape(clubData, airDensity) {
    if (!clubData) {
        return {
            timeToApex: 2.5,
            totalFlightTime: 5.0,
            trajectoryShape: 1.0
        };
    }
    
    const {
        launchAngle = 12,
        apexHeight,
        spinRate,
        carryDistance,
        landingAngle,
        ballSpeed = 150
    } = clubData;

    // Calculate time to apex (assuming roughly parabolic flight)
    const timeToApex = Math.sqrt((2 * apexHeight) / (32.2 * Math.sin(launchAngle * Math.PI / 180)));
    
    // Total flight time (approximately 2x time to apex, adjusted for landing angle)
    const totalFlightTime = timeToApex * (2 - (landingAngle - launchAngle) / 90);

    // Calculate spin decay rate based on club characteristics
    const spinDecayRate = calculateClubSpinDecay(clubData, airDensity);

    // Calculate trajectory shape factor (0-1, where 1 is perfectly parabolic)
    const trajectoryShape = Math.min(1, (apexHeight * 2) / (carryDistance * Math.tan(launchAngle * Math.PI / 180)));

    return {
        timeToApex,
        totalFlightTime,
        spinDecayRate,
        trajectoryShape
    };
}

/**
 * Calculate club-specific spin decay
 * @param {Object} clubData - Club-specific data
 * @param {number} airDensity - Air density ratio
 * @returns {number} Spin decay rate
 */
export function calculateClubSpinDecay(clubData, airDensity) {
    const { spinRate, launchAngle } = clubData;
    
    // Base decay rate varies by initial spin (higher spin = faster decay)
    const baseDecayRate = (spinRate / 10000) * 0.15;
    
    // Launch angle affects decay (steeper launch = more decay)
    const launchFactor = 1 + (launchAngle / 45) * 0.2;
    
    // Air density impact (denser air = more decay)
    const densityFactor = Math.pow(airDensity, 1.2);
    
    return baseDecayRate * launchFactor * densityFactor;
}

/**
 * Calculate instantaneous ball height at a given point in flight
 * @param {Object} trajectoryData - Trajectory characteristics
 * @param {number} timeInFlight - Current time in flight
 * @param {number} apexHeight - Maximum height of the shot
 * @returns {number} Height at given time
 */
export function calculateHeightAtTime(trajectoryData, timeInFlight, apexHeight) {
    const {
        timeToApex,
        totalFlightTime,
        trajectoryShape
    } = trajectoryData;

    // Normalize time (0-1)
    const normalizedTime = timeInFlight / totalFlightTime;

    // Calculate height using modified parabolic function
    const heightFactor = 4 * trajectoryShape * normalizedTime * (1 - normalizedTime);
    
    return apexHeight * heightFactor;
}
