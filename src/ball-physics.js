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
 * @param {number} humidity - Relative humidity (0-100)
 * @returns {number} Ball compression factor
 */
export function calculateBallCompression(clubData, temperature, humidity) {
    if (!clubData) return 0.95; // default compression factor
    
    const baseCompression = clubData.compression || 0.95;
    
    // Non-linear temperature effect (more pronounced at extremes)
    const tempDiff = temperature - 70;
    const tempEffect = Math.sign(tempDiff) * Math.pow(Math.abs(tempDiff) / 50, 1.2) * 0.05;
    
    // Humidity effect (higher humidity slightly reduces compression)
    const humidityEffect = -0.02 * (humidity / 100);
    
    // Club-specific adjustments
    const clubEffect = (clubData.ballSpeed || 150) / 150 * 0.02;
    
    // Calculate total compression factor with limits
    const totalCompression = baseCompression + tempEffect + humidityEffect + clubEffect;
    return Math.max(0.85, Math.min(1.0, totalCompression));
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
            trajectoryShape: 1.0,
            magnusEffect: 0.0,
            dragCoefficient: 0.3
        };
    }
    
    const {
        launchAngle = 12,
        apexHeight,
        spinRate = 2500,
        carryDistance,
        landingAngle,
        ballSpeed = 150
    } = clubData;

    // Calculate Reynolds number for drag coefficient
    const kinematicViscosity = 1.46e-5 * (1 / airDensity); // Adjust for air density
    const ballDiameter = 1.68 / 12; // inches to feet
    const reynoldsNumber = (ballSpeed * ballDiameter) / kinematicViscosity;
    
    // Calculate drag coefficient (varies with Reynolds number)
    const dragCoefficient = 0.3 + 0.1 * Math.exp(-reynoldsNumber / 100000);
    
    // Calculate Magnus effect (lift coefficient)
    const spinParameter = (spinRate * Math.PI / 30) * (ballDiameter / ballSpeed);
    const magnusEffect = 0.00375 * spinParameter * airDensity;
    
    // Calculate time to apex with Magnus effect
    const effectiveGravity = 32.2 * (1 - magnusEffect);
    const timeToApex = Math.sqrt((2 * apexHeight) / (effectiveGravity * Math.sin(launchAngle * Math.PI / 180)));
    
    // Total flight time adjusted for drag and Magnus effect
    const dragFactor = 1 + (dragCoefficient * airDensity * ballSpeed * 0.0001);
    const totalFlightTime = timeToApex * (2 - (landingAngle - launchAngle) / 90) * dragFactor;

    // Calculate spin decay rate based on club characteristics
    const spinDecayRate = calculateClubSpinDecay(clubData, airDensity);

    // Calculate trajectory shape factor with Magnus effect
    const effectiveApexRatio = (apexHeight * 2) / (carryDistance * Math.tan(launchAngle * Math.PI / 180));
    const magnusShapeEffect = magnusEffect * Math.sin(launchAngle * Math.PI / 180);
    const trajectoryShape = Math.min(1, effectiveApexRatio * (1 + magnusShapeEffect));

    return {
        timeToApex,
        totalFlightTime,
        spinDecayRate,
        trajectoryShape,
        magnusEffect,
        dragCoefficient
    };
}

/**
 * Calculate club-specific spin decay
 * @param {Object} clubData - Club-specific data
 * @param {number} airDensity - Air density ratio
 * @returns {number} Spin decay rate
 */
export function calculateClubSpinDecay(clubData, airDensity) {
    if (!clubData) return 0.15;
    
    const {
        spinRate = 2500,
        ballSpeed = 150,
        launchAngle = 12
    } = clubData;
    
    // Base decay rate varies with spin rate and ball speed
    const spinParameter = (spinRate * Math.PI / 30) * (1.68 / (12 * ballSpeed));
    const baseDecayRate = 0.15 * (1 + spinParameter * 0.5);
    
    // Air density effect (more dense air = faster spin decay)
    const densityEffect = Math.pow(airDensity, 1.2);
    
    // Launch angle effect (higher shots maintain spin longer)
    const angleEffect = 1 - Math.sin(launchAngle * Math.PI / 180) * 0.2;
    
    // Calculate total decay rate
    return baseDecayRate * densityEffect * angleEffect;
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
