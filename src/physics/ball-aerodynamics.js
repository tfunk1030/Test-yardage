/**
 * Advanced golf ball aerodynamics calculations
 * Implements Reynolds number and Magnus effect
 */

const AIR_DENSITY_SL = 1.225; // kg/m³ at sea level
const AIR_VISCOSITY = 1.81e-5; // kg/(m·s) at 20°C
const BALL_DIAMETER = 0.0427; // meters (1.68 inches)
const GRAVITY = 9.81; // m/s²

/**
 * Calculate Reynolds number for golf ball
 * @param {number} velocity - Ball velocity in m/s
 * @param {number} airDensity - Air density in kg/m³
 * @returns {number} Reynolds number
 */
export function calculateReynoldsNumber(velocity, airDensity = AIR_DENSITY_SL) {
    return (airDensity * velocity * BALL_DIAMETER) / AIR_VISCOSITY;
}

/**
 * Calculate drag coefficient based on Reynolds number
 * @param {number} reynoldsNumber - Reynolds number
 * @param {number} spinRate - Ball spin rate in rpm
 * @returns {number} Drag coefficient
 */
export function calculateDragCoefficient(reynoldsNumber, spinRate) {
    // Base drag coefficient for a golf ball
    let baseDrag = 0.24;

    // Adjust for Reynolds number effects
    if (reynoldsNumber < 40000) {
        baseDrag = 0.5; // Laminar flow regime
    } else if (reynoldsNumber < 400000) {
        // Transition regime
        baseDrag = 0.24 + (0.26 * (1 - (reynoldsNumber - 40000) / 360000));
    }

    // Adjust for spin effects
    const spinFactor = (spinRate / 3000) * 0.05; // Normalized spin effect
    return baseDrag + spinFactor;
}

/**
 * Calculate Magnus force coefficient
 * @param {number} spinRate - Ball spin rate in rpm
 * @param {number} velocity - Ball velocity in m/s
 * @returns {number} Magnus force coefficient
 */
export function calculateMagnusCoefficient(spinRate, velocity) {
    // Convert rpm to rad/s
    const angularVelocity = (spinRate * 2 * Math.PI) / 60;
    
    // Calculate spin factor
    const spinFactor = (angularVelocity * BALL_DIAMETER) / (2 * velocity);
    
    // Magnus coefficient based on empirical data
    return 0.24 * spinFactor; // Typical value for golf balls
}

/**
 * Calculate lift coefficient
 * @param {number} reynoldsNumber - Reynolds number
 * @param {number} spinRate - Ball spin rate in rpm
 * @returns {number} Lift coefficient
 */
export function calculateLiftCoefficient(reynoldsNumber, spinRate) {
    // Base lift coefficient
    let baseLift = 0.15;

    // Adjust for Reynolds number
    if (reynoldsNumber > 100000) {
        baseLift += 0.05 * Math.log10(reynoldsNumber / 100000);
    }

    // Adjust for spin
    const spinFactor = Math.min(1, spinRate / 5000);
    return baseLift * (1 + spinFactor);
}

/**
 * Calculate total aerodynamic forces
 * @param {Object} params - Flight parameters
 * @param {number} params.velocity - Ball velocity in m/s
 * @param {number} params.spinRate - Ball spin rate in rpm
 * @param {number} params.airDensity - Air density in kg/m³
 * @param {number} params.launchAngle - Launch angle in degrees
 * @returns {Object} Aerodynamic forces and coefficients
 */
export function calculateAerodynamicForces(params) {
    const { velocity, spinRate, airDensity = AIR_DENSITY_SL, launchAngle } = params;

    const reynoldsNumber = calculateReynoldsNumber(velocity, airDensity);
    const dragCoeff = calculateDragCoefficient(reynoldsNumber, spinRate);
    const magnusCoeff = calculateMagnusCoefficient(spinRate, velocity);
    const liftCoeff = calculateLiftCoefficient(reynoldsNumber, spinRate);

    // Calculate dynamic pressure
    const dynamicPressure = 0.5 * airDensity * velocity * velocity;
    const area = Math.PI * (BALL_DIAMETER / 2) * (BALL_DIAMETER / 2);

    // Calculate forces
    const drag = dragCoeff * dynamicPressure * area;
    const lift = liftCoeff * dynamicPressure * area;
    const magnus = magnusCoeff * dynamicPressure * area;

    return {
        reynoldsNumber,
        dragCoefficient: dragCoeff,
        liftCoefficient: liftCoeff,
        magnusCoefficient: magnusCoeff,
        dragForce: drag,
        liftForce: lift,
        magnusForce: magnus
    };
}
