// Standalone verification script for core calculations
import { calculateWindEffect, calculateAltitudeEffect, calculateAirDensityRatio } from './script.js';

// Test wind calculations
function testWindCalculations() {
    console.log('\n=== Testing Wind Calculations ===');
    
    const testCases = [
        { speed: 10, direction: 'N', expected: -0.069 },  // 10mph headwind
        { speed: 10, direction: 'S', expected: 0.0625 },  // 10mph tailwind
        { speed: 15, direction: 'E', expected: 0 }        // 15mph crosswind
    ];
    
    testCases.forEach(test => {
        const result = calculateWindEffect(test.speed, test.direction);
        const passed = Math.abs(result.distanceEffect - test.expected) < 0.005;
        
        console.log(`\nTest: ${test.speed}mph from ${test.direction}`);
        console.log(`Expected: ${test.expected}`);
        console.log(`Actual: ${result.distanceEffect}`);
        console.log(`Status: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    });
}

// Test altitude calculations
function testAltitudeCalculations() {
    console.log('\n=== Testing Altitude Calculations ===');
    
    const testCases = [
        { altitude: 0, expected: 1.000 },      // Sea level
        { altitude: 5280, expected: 1.109 },   // Denver
        { altitude: 7350, expected: 1.156 }    // Mexico City
    ];
    
    testCases.forEach(test => {
        const result = calculateAltitudeEffect(test.altitude);
        const passed = Math.abs(result.total - test.expected) < 0.005;
        
        console.log(`\nTest: ${test.altitude}ft`);
        console.log(`Expected: ${test.expected}`);
        console.log(`Actual: ${result.total}`);
        console.log(`Status: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    });
}

// Test air density calculations
function testAirDensityCalculations() {
    console.log('\n=== Testing Air Density Calculations ===');
    
    const testCases = [
        {
            conditions: { temp: 59, pressure: 29.92, humidity: 50 },
            expected: 1.000,
            name: 'Standard Conditions'
        },
        {
            conditions: { temp: 90, pressure: 29.92, humidity: 80 },
            expected: 0.965,
            name: 'Hot & Humid'
        },
        {
            conditions: { temp: 30, pressure: 29.92, humidity: 20 },
            expected: 1.035,
            name: 'Cold & Dry'
        }
    ];
    
    testCases.forEach(test => {
        const result = calculateAirDensityRatio(test.conditions);
        const passed = Math.abs(result - test.expected) < 0.005;
        
        console.log(`\nTest: ${test.name}`);
        console.log(`Conditions: ${JSON.stringify(test.conditions)}`);
        console.log(`Expected: ${test.expected}`);
        console.log(`Actual: ${result}`);
        console.log(`Status: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    });
}

// Run all tests
console.log('Starting verification tests...');
try {
    testWindCalculations();
    testAltitudeCalculations();
    testAirDensityCalculations();
} catch (error) {
    console.error('Test execution failed:', error);
}
