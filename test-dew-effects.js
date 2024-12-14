// Test dew point and spin effects
import {
    calculateDewPoint,
    calculateSpinDecay,
    calculateDewPointEffect,
    calculateBallFlightAdjustments
} from './ball-physics.js';

// Test cases for dew point conditions
const testCases = [
    {
        name: "Morning Dew",
        temp: 65,
        humidity: 95,
        ballData: {
            initialSpin: 2800,
            flightTime: 6,
            airDensity: 1.0
        },
        expected: {
            dewPointRange: [63, 64], // Expected dew point range
            wetConditions: true // Should show wet condition effects
        }
    },
    {
        name: "Afternoon Dry",
        temp: 85,
        humidity: 40,
        ballData: {
            initialSpin: 2800,
            flightTime: 6,
            airDensity: 0.95
        },
        expected: {
            dewPointRange: [57, 59], // Expected dew point range
            wetConditions: false // Should not show wet condition effects
        }
    },
    {
        name: "Light Dew",
        temp: 70,
        humidity: 85,
        ballData: {
            initialSpin: 2800,
            flightTime: 6,
            airDensity: 1.0
        },
        expected: {
            dewPointRange: [65, 66], // Expected dew point range
            wetConditions: true // Should show wet condition effects
        }
    }
];

console.log("=== Dew Point and Spin Effects Test ===\n");

testCases.forEach(test => {
    console.log(`\n--- ${test.name} ---`);
    
    // Test dew point calculation
    const dewPoint = calculateDewPoint(test.temp, test.humidity);
    console.log(`Temperature: ${test.temp}°F`);
    console.log(`Humidity: ${test.humidity}%`);
    console.log(`Dew Point: ${dewPoint.toFixed(1)}°F`);
    
    // Validate dew point is in expected range
    const inRange = dewPoint >= test.expected.dewPointRange[0] && 
                   dewPoint <= test.expected.dewPointRange[1];
    console.log(`Dew Point in Range: ${inRange ? 'YES' : 'NO'}`);
    
    // Test spin decay
    const finalSpin = calculateSpinDecay(
        test.ballData.initialSpin,
        test.ballData.airDensity,
        test.ballData.flightTime
    );
    console.log(`Spin Decay: ${test.ballData.initialSpin} → ${finalSpin.toFixed(0)} RPM`);
    
    // Test dew point effects
    const dewEffects = calculateDewPointEffect(dewPoint, test.temp);
    console.log(`\nDew Effects:`);
    console.log(`- Spin Factor: ${dewEffects.spinFactor.toFixed(3)}`);
    console.log(`- Carry Factor: ${dewEffects.carryFactor.toFixed(3)}`);
    
    // Validate wet conditions
    const isWet = dewEffects.spinFactor < 1.0;
    console.log(`Wet Conditions Detected: ${isWet ? 'YES' : 'NO'}`);
    console.log(`Expected Wet Conditions: ${test.expected.wetConditions ? 'YES' : 'NO'}`);
    
    // Calculate total adjustments
    const adjustments = calculateBallFlightAdjustments(test, test.ballData);
    console.log(`\nTotal Carry Factor: ${adjustments.totalFactor.toFixed(3)}`);
});
