// Core calculation functions module
import { calculateTrajectory } from '../ball-physics.js';

/**
 * Core calculation functions module containing all physics and adjustment calculations
 * @module core-calculations
 */

/**
 * Calculate wind effect on shot distance and direction
 * @param {number} windSpeed - Wind speed in mph
 * @param {string} windDirection - Wind direction (N, S, E, W, NE, etc.)
 * @param {string} shotHeight - Shot trajectory height (low, medium, high)
 * @returns {Object} Distance and lateral effects
 */
export function calculateWindEffect(windSpeed, windDirection, shotHeight = 'medium') {
    // Convert wind speed to number and ensure it's positive
    const speed = Math.abs(Number(windSpeed) || 0);
    
    // Height-specific adjustments
    const heightMultipliers = {
        'low': 0.65,
        'medium': 1.0,
        'high': 1.35
    };
    
    let heightMultiplier = heightMultipliers[shotHeight] || 1.0;
    
    // Progressive wind reduction for strong winds on low shots
    if (shotHeight === 'low' && speed > 10) {
        const extraReduction = 1 - ((speed - 10) * 0.015);
        heightMultiplier *= extraReduction;
    }
    
    // Get wind angle and calculate components
    const angle = calculateWindAngle(windDirection);
    const headwindComponent = Math.cos(angle * Math.PI / 180) * speed;
    const crosswindComponent = Math.sin(angle * Math.PI / 180) * speed;
    
    // Calculate scaled effects with optimized coefficients
    const baseWindEffect = 0.0078;
    const crosswindFactor = 0.0052;
    
    // Add non-linear scaling for stronger winds
    const headwindPower = Math.pow(Math.abs(headwindComponent), 0.92);
    const crosswindPower = Math.pow(Math.abs(crosswindComponent), 0.92);
    
    // Progressive scaling for stronger winds
    let headwindMultiplier = 1.0;
    let crosswindMultiplier = 1.0;
    
    if (Math.abs(headwindComponent) > 10) {
        headwindMultiplier = 1.0 + (Math.abs(headwindComponent) - 10) * 0.02;
    }
    if (Math.abs(crosswindComponent) > 10) {
        crosswindMultiplier = 1.0 + (Math.abs(crosswindComponent) - 10) * 0.015;
    }
    
    const scaledHeadwind = -Math.sign(headwindComponent) * headwindPower * baseWindEffect * heightMultiplier * headwindMultiplier;
    const scaledCrosswind = Math.sign(crosswindComponent) * crosswindPower * crosswindFactor * heightMultiplier * crosswindMultiplier;
    
    return {
        distanceEffect: scaledHeadwind,
        lateralEffect: scaledCrosswind
    };
}

/**
 * Calculate altitude effect on shot distance
 * @param {number} altitude - Altitude in feet
 * @returns {Object} Altitude effect components and total
 */
export function calculateAltitudeEffect(altitude = 0) {
    const alt = Number(altitude) || 0;
    
    // Base altitude effect using a combination of logarithmic and linear scaling
    const baseEffect = Math.log(alt / 1000 + 1) * 0.045;
    
    // Progressive scaling with altitude bands
    let progressiveEffect = 0;
    if (alt > 2000) progressiveEffect += (alt - 2000) / 120000;
    if (alt > 4000) progressiveEffect += (alt - 4000) / 110000;
    if (alt > 6000) progressiveEffect += (alt - 6000) / 100000;
    
    // Altitude-based air density effect
    const densityEffect = Math.exp(-alt / 30000);
    
    // Spin rate adjustment at altitude
    const spinEffect = Math.min(alt / 120000, 0.065);
    
    // Empirical correction factor
    const empiricalFactor = 1.15;
    
    // Calculate total effect with empirical correction
    const rawEffect = (baseEffect + progressiveEffect) * empiricalFactor;
    const total = 1 + (rawEffect * densityEffect);
    
    return {
        total,
        components: {
            base: baseEffect,
            progressive: progressiveEffect,
            spin: spinEffect,
            density: densityEffect,
            empirical: empiricalFactor
        }
    };
}

/**
 * Calculate air density ratio compared to sea level
 * @param {Object} conditions - Weather conditions
 * @returns {number} Air density ratio
 */
export function calculateAirDensityRatio(conditions) {
    const standardTemp = 59;
    const standardPressure = 29.92;
    const standardHumidity = 50;
    
    const tempRankine = (conditions.temp || standardTemp) + 459.67;
    const standardTempRankine = standardTemp + 459.67;
    
    const pressureRatio = Math.pow((conditions.pressure || standardPressure) / standardPressure, 0.45);
    const temperatureRatio = Math.pow(standardTempRankine / tempRankine, 0.5);
    
    const humidity = conditions.humidity || standardHumidity;
    const humidityFactor = 1 - ((humidity - standardHumidity) / 100 * 0.008);
    
    const densityRatio = (pressureRatio * temperatureRatio * humidityFactor);
    
    return Math.pow(densityRatio, 1.0);
}

// Helper function to calculate wind angle
function calculateWindAngle(windDirection) {
    const directions = {
        'N': 0,
        'NNE': 22.5,
        'NE': 45,
        'ENE': 67.5,
        'E': 90,
        'ESE': 112.5,
        'SE': 135,
        'SSE': 157.5,
        'S': 180,
        'SSW': 202.5,
        'SW': 225,
        'WSW': 247.5,
        'W': 270,
        'WNW': 292.5,
        'NW': 315,
        'NNW': 337.5
    };
    
    return directions[windDirection] || 0;
}

// Run verification tests
console.log('Running Core Calculation Tests...\n');

// Test wind calculations
console.log('=== Wind Effect Tests ===');
[
    { speed: 10, dir: 'N', desc: '10mph headwind' },
    { speed: 10, dir: 'S', desc: '10mph tailwind' },
    { speed: 15, dir: 'E', desc: '15mph crosswind' }
].forEach(test => {
    const result = calculateWindEffect(test.speed, test.dir);
    console.log(`\n${test.desc}:`);
    console.log(`Distance Effect: ${(result.distanceEffect * 100).toFixed(1)}%`);
    console.log(`Lateral Effect: ${(result.lateralEffect * 100).toFixed(1)}%`);
});

// Test altitude calculations
console.log('\n=== Altitude Effect Tests ===');
[
    { alt: 0, desc: 'Sea Level' },
    { alt: 5280, desc: 'Denver' },
    { alt: 7350, desc: 'Mexico City' }
].forEach(test => {
    const result = calculateAltitudeEffect(test.alt);
    console.log(`\n${test.desc} (${test.alt}ft):`);
    console.log(`Total Effect: ${((result.total - 1) * 100).toFixed(1)}%`);
    console.log('Components:', result.components);
});

// Test air density calculations
console.log('\n=== Air Density Tests ===');
[
    { temp: 59, pressure: 29.92, humidity: 50, desc: 'Standard Conditions' },
    { temp: 90, pressure: 29.92, humidity: 80, desc: 'Hot & Humid' },
    { temp: 30, pressure: 29.92, humidity: 20, desc: 'Cold & Dry' }
].forEach(test => {
    const result = calculateAirDensityRatio(test);
    console.log(`\n${test.desc}:`);
    console.log(`Density Ratio: ${result.toFixed(3)}`);
});
