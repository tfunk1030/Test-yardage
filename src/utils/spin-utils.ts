import { ClubData } from '../types/physics';

/**
 * Calculate spin decay during flight
 * @param initialSpin Initial spin rate in RPM
 * @param airDensity Air density ratio (1 = sea level)
 * @param flightTime Time in seconds
 * @returns Final spin rate in RPM
 */
export function calculateSpinDecay(
    initialSpin: number,
    airDensity: number,
    flightTime: number
): number {
    // Spin decay rate increases with air density
    const decayRate = 0.15 * airDensity;
    
    // Exponential decay formula
    return initialSpin * Math.exp(-decayRate * flightTime);
}

/**
 * Calculate club-specific spin decay rate
 * @param clubData Club-specific data
 * @param airDensity Air density ratio
 * @returns Spin decay rate
 */
export function calculateClubSpinDecay(
    clubData: ClubData,
    airDensity: number
): number {
    const spinRate = clubData.spinFactor * 2500; // Base spin rate
    const ballSpeed = clubData.ballSpeed || 150;
    const launchAngle = clubData.loft;
    
    // Base decay rate varies with spin rate and ball speed
    const spinParameter = (spinRate * Math.PI / 30) * (1.68 / (12 * ballSpeed));
    const baseDecayRate = 0.15 * (1 + spinParameter * 0.5);
    
    // Air density effect (more dense air = faster spin decay)
    const densityEffect = Math.pow(airDensity, 1.2);
    
    // Launch angle effect (higher shots maintain spin longer)
    const angleEffect = 1 - Math.sin(launchAngle * Math.PI / 180) * 0.2;
    
    return baseDecayRate * densityEffect * angleEffect;
}

/**
 * Calculate gear effect based on impact location
 * @param impactLocation Impact location on club face
 * @returns Spin effects from gear effect
 */
export function calculateGearEffect(
    impactLocation: 'center' | 'toe' | 'heel' | 'high' | 'low'
): { spinEffect: number; sideSpinRate: number } {
    const gearEffects = {
        'center': { spinEffect: 0, sideSpinRate: 0 },
        'toe': { spinEffect: 0.1, sideSpinRate: -500 },
        'heel': { spinEffect: 0.1, sideSpinRate: 500 },
        'high': { spinEffect: -0.05, sideSpinRate: 0 },
        'low': { spinEffect: 0.15, sideSpinRate: 0 }
    };
    
    return gearEffects[impactLocation] || gearEffects.center;
}

/**
 * Calculate launch angle variation based on club characteristics
 * @param clubData Club-specific data
 * @returns Launch angle variation factor
 */
export function calculateLaunchVariation(clubData: ClubData): number {
    const baseVariation = 0.05;  // 5% baseline variation
    return baseVariation * (clubData.quality || 1);
}

/**
 * Calculate spin variation based on club characteristics
 * @param clubData Club-specific data
 * @returns Spin variation factor
 */
export function calculateSpinVariation(clubData: ClubData): number {
    const baseVariation = 0.08;  // 8% baseline variation
    return baseVariation * (clubData.quality || 1);
}

/**
 * Calculate ball compression factor
 * @param clubData Club-specific data
 * @param temperature Temperature in Fahrenheit
 * @param humidity Relative humidity (0-100)
 * @returns Ball compression factor
 */
export function calculateBallCompression(
    clubData: ClubData,
    temperature: number,
    humidity: number
): number {
    const baseCompression = 0.95; // default compression factor
    
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
