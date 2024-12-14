import { calculateWindEffect } from './script.js';

// Test cases based on empirical data
const testCases = [
    // Headwind tests
    { 
        speed: 20, 
        direction: 'N', 
        reference: 'N', 
        name: '20mph Headwind',
        expected: { distance: -0.156, lateral: 0 }  // -45 yards on 288y base
    },
    { 
        speed: 10, 
        direction: 'N', 
        reference: 'N', 
        name: '10mph Headwind',
        expected: { distance: -0.069, lateral: 0 }  // -20 yards on 288y base
    },
    
    // Tailwind tests
    { 
        speed: 10, 
        direction: 'S', 
        reference: 'N', 
        name: '10mph Tailwind',
        expected: { distance: 0.0625, lateral: 0 }  // +18 yards on 288y base
    },
    { 
        speed: 20, 
        direction: 'S', 
        reference: 'N', 
        name: '20mph Tailwind',
        expected: { distance: 0.108, lateral: 0 }   // +31 yards on 288y base
    },
    
    // Crosswind tests
    { 
        speed: 15, 
        direction: 'E', 
        reference: 'N', 
        name: '15mph Right Crosswind',
        expected: { distance: 0, lateral: 0.078 }   // ~22.5 yards right drift
    },
    { 
        speed: 15, 
        direction: 'W', 
        reference: 'N', 
        name: '15mph Left Crosswind',
        expected: { distance: 0, lateral: -0.078 }  // ~22.5 yards left drift
    },
    
    // Diagonal wind tests
    { 
        speed: 15, 
        direction: 'NE', 
        reference: 'N', 
        name: '15mph Right Quartering Headwind',
        expected: { distance: -0.083, lateral: 0.055 }  // Combined effect
    },
    { 
        speed: 15, 
        direction: 'SW', 
        reference: 'N', 
        name: '15mph Left Quartering Tailwind',
        expected: { distance: 0.072, lateral: -0.055 }  // Combined effect
    }
];

console.log('Running Wind Effect Tests...\n');

testCases.forEach(test => {
    const result = calculateWindEffect(test.speed, test.direction, test.reference);
    
    // Check if distance effect is within tolerance
    const distanceDiff = Math.abs(result.distanceEffect - test.expected.distance);
    const lateralDiff = Math.abs(result.lateralEffect - test.expected.lateral);
    const passed = distanceDiff < 0.005 && lateralDiff < 0.005; // Allow 0.5% tolerance
    
    console.log(`Test: ${test.name}`);
    console.log(`Wind: ${test.speed}mph from ${test.direction}`);
    console.log('Distance Effect:');
    console.log(`  Expected: ${(test.expected.distance * 100).toFixed(1)}%`);
    console.log(`  Actual: ${(result.distanceEffect * 100).toFixed(1)}%`);
    console.log('Lateral Effect:');
    console.log(`  Expected: ${(test.expected.lateral * 100).toFixed(1)}%`);
    console.log(`  Actual: ${(result.lateralEffect * 100).toFixed(1)}%`);
    console.log(`Status: ${passed ? 'PASSED ✓' : 'FAILED ✗'}`);
    console.log('------------------------\n');
});
