// Test ball physics calculations
import {
    calculateDewPoint,
    calculateBallCompression,
    calculateSpinDecay,
    calculateDewPointEffect,
    calculateBallFlightAdjustments
} from '../ball-physics.js';

// Test conditions
const conditions = [
    {
        name: "Standard Day",
        temp: 70,
        humidity: 50,
        ballData: {
            initialSpin: 2800,
            flightTime: 6,
            airDensity: 1.0
        }
    },
    {
        name: "Cold Wet Morning",
        temp: 45,
        humidity: 90,
        ballData: {
            initialSpin: 2800,
            flightTime: 5.8,
            airDensity: 1.02
        }
    },
    {
        name: "Hot Dry Afternoon",
        temp: 95,
        humidity: 20,
        ballData: {
            initialSpin: 2800,
            flightTime: 6.2,
            airDensity: 0.95
        }
    }
];

// Run tests
console.log("Ball Physics Test Results\n");

conditions.forEach(test => {
    console.log(`\n=== ${test.name} ===`);
    
    // Calculate dew point
    const dewPoint = calculateDewPoint(test.temp, test.humidity);
    console.log(`Dew Point: ${dewPoint.toFixed(1)}°F`);
    
    // Calculate compression
    const compression = calculateBallCompression(test.temp);
    console.log(`Ball Compression Factor: ${compression.toFixed(3)}`);
    
    // Calculate spin decay
    const finalSpin = calculateSpinDecay(
        test.ballData.initialSpin,
        test.ballData.airDensity,
        test.ballData.flightTime
    );
    console.log(`Spin Decay: ${test.ballData.initialSpin} → ${finalSpin.toFixed(0)} RPM`);
    
    // Calculate dew point effects
    const dewEffects = calculateDewPointEffect(dewPoint, test.temp);
    console.log(`Spin Factor: ${dewEffects.spinFactor.toFixed(3)}`);
    console.log(`Carry Factor: ${dewEffects.carryFactor.toFixed(3)}`);
    
    // Calculate total adjustments
    const totalAdjustments = calculateBallFlightAdjustments(test, test.ballData);
    console.log(`Total Distance Factor: ${totalAdjustments.totalFactor.toFixed(3)}`);
});
