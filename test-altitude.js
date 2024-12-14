import { calculateAltitudeEffect } from './script.js';

// Test cases based on empirical data
const testCases = [
    { altitude: 0, name: 'Sea Level', expected: 1.000 },
    { altitude: 5280, name: 'Denver', expected: 1.109 },
    { altitude: 4500, name: 'Reno', expected: 1.095 },
    { altitude: 7350, name: 'Mexico City', expected: 1.156 }
];

console.log('Running Altitude Effect Tests...\n');

testCases.forEach(test => {
    const result = calculateAltitudeEffect(test.altitude);
    const totalEffect = result.total;
    const difference = Math.abs(totalEffect - test.expected);
    const passed = difference < 0.005; // Allow 0.5% tolerance

    console.log(`Test: ${test.name} (${test.altitude}ft)`);
    console.log(`Expected: ${test.expected.toFixed(3)}`);
    console.log(`Actual: ${totalEffect.toFixed(3)}`);
    console.log(`Components:`);
    console.log(`- Base effect: ${result.components.base.toFixed(3)}`);
    console.log(`- Progressive effect: ${result.components.progressive.toFixed(3)}`);
    console.log(`- Spin effect: ${result.components.spin.toFixed(3)}`);
    console.log(`- Density effect: ${result.components.density.toFixed(3)}`);
    console.log(`- Empirical factor: ${result.components.empirical.toFixed(3)}`);
    console.log(`Status: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('------------------------\n');
});
