import { calculateAdjustmentFactor } from './script.js';

const baseCarry = 288;
const testCases = [
    { speed: 20, dir: 'N', target: 243, desc: '20mph headwind' },
    { speed: 10, dir: 'N', target: 268, desc: '10mph headwind' },
    { speed: 10, dir: 'S', target: 306, desc: '10mph tailwind' },
    { speed: 20, dir: 'S', target: 319, desc: '20mph tailwind' }
];

function testWindCondition(testCase) {
    const conditions = {
        temp: 70,
        humidity: 50,
        altitude: 0,
        pressure: 29.92,
        windSpeed: testCase.speed,
        windDir: testCase.dir
    };
    
    const adjustment = calculateAdjustmentFactor(conditions);
    const adjustedCarry = baseCarry * adjustment.factor;
    const diffYards = adjustedCarry - testCase.target;
    const diffPercent = ((adjustedCarry - testCase.target) / testCase.target * 100).toFixed(2);
    const withinTolerance = Math.abs(diffPercent) <= 1.0;
    
    console.log(`\n${testCase.desc}:`);
    console.log(`Target: ${testCase.target} yards`);
    console.log(`Actual: ${adjustedCarry.toFixed(1)} yards`);
    console.log(`Difference: ${diffYards.toFixed(1)} yards (${diffPercent}%)`);
    console.log(`Within ±1%: ${withinTolerance ? '✓ YES' : '✗ NO'}`);
    
    return withinTolerance;
}

console.log('Wind Effect Test (Target: ±1% accuracy)\n');
console.log('Base carry: 288 yards\n');

const results = testCases.map(testCase => testWindCondition(testCase));
const passedTests = results.filter(r => r).length;

console.log(`\nSummary: ${passedTests}/${testCases.length} tests within ±1% tolerance`);
