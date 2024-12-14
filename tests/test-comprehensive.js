import { calculateWindEffect, calculateAltitudeEffect } from './script.js';

function runComprehensiveTests() {
    console.log('Running Comprehensive Tests...\n');
    
    // Test conditions
    const windSpeeds = [0, 5, 10, 15, 20];
    const windDirections = ['N', 'NE', 'E', 'SE', 'S'];
    const altitudes = [0, 2500, 5280, 7500];
    const temperatures = [40, 70, 100];
    
    // Base values
    const baseCarry = 288; // yards
    const baseClubSpeed = 113; // mph
    const baseSpinRate = 2800; // rpm
    
    let testCount = 1;
    const results = [];
    
    // Test combinations
    for (const windSpeed of windSpeeds) {
        for (const direction of windDirections) {
            // Select one altitude and temperature for each wind combination
            const altitude = altitudes[testCount % altitudes.length];
            const temp = temperatures[testCount % temperatures.length];
            
            console.log(`Test #${testCount}`);
            console.log('Conditions:');
            console.log(`  Wind: ${windSpeed}mph from ${direction}`);
            console.log(`  Altitude: ${altitude}ft`);
            console.log(`  Temperature: ${temp}°F`);
            
            // Calculate wind effect
            const windEffect = calculateWindEffect(windSpeed, direction);
            const windAdjustedDistance = baseCarry * (1 + windEffect.distanceEffect);
            const lateralOffset = baseCarry * windEffect.lateralEffect;
            
            // Calculate altitude effect
            const altitudeEffect = calculateAltitudeEffect(altitude).total - 1;  // Convert to percentage change
            const finalDistance = windAdjustedDistance * (1 + altitudeEffect);
            
            // Temperature effect (simplified approximation)
            const tempEffect = (temp - 70) * 0.1; // 0.1 yards per degree F difference from 70°F
            const finalDistanceWithTemp = finalDistance + tempEffect;
            
            console.log('\nResults:');
            console.log(`  Base Carry: ${baseCarry} yards`);
            console.log(`  Wind Effect: ${(windEffect.distanceEffect * 100).toFixed(1)}%`);
            console.log(`  Wind-Adjusted Distance: ${windAdjustedDistance.toFixed(1)} yards`);
            console.log(`  Lateral Movement: ${lateralOffset.toFixed(1)} yards`);
            console.log(`  Altitude Effect: +${((altitudeEffect) * 100).toFixed(1)}%`);
            console.log(`  Temperature Effect: ${tempEffect.toFixed(1)} yards`);
            console.log(`  Final Carry: ${finalDistanceWithTemp.toFixed(1)} yards`);
            console.log('------------------------\n');
            
            results.push({
                conditions: {
                    windSpeed,
                    direction,
                    altitude,
                    temp
                },
                results: {
                    windEffect: windEffect.distanceEffect,
                    lateralEffect: windEffect.lateralEffect,
                    altitudeEffect,
                    tempEffect,
                    finalDistance: finalDistanceWithTemp
                }
            });
            
            testCount++;
        }
    }
    
    // Summary statistics
    console.log('\nSummary Statistics:');
    const distances = results.map(r => r.results.finalDistance);
    console.log(`  Shortest Carry: ${Math.min(...distances).toFixed(1)} yards`);
    console.log(`  Longest Carry: ${Math.max(...distances).toFixed(1)} yards`);
    console.log(`  Average Carry: ${(distances.reduce((a, b) => a + b) / distances.length).toFixed(1)} yards`);
    
    // Find most extreme conditions
    const shortestShot = results.find(r => r.results.finalDistance === Math.min(...distances));
    const longestShot = results.find(r => r.results.finalDistance === Math.max(...distances));
    
    console.log('\nMost Extreme Conditions:');
    console.log('Shortest Shot:');
    console.log(`  Wind: ${shortestShot.conditions.windSpeed}mph from ${shortestShot.conditions.direction}`);
    console.log(`  Altitude: ${shortestShot.conditions.altitude}ft`);
    console.log(`  Temperature: ${shortestShot.conditions.temp}°F`);
    console.log(`  Final Distance: ${shortestShot.results.finalDistance.toFixed(1)} yards`);
    
    console.log('\nLongest Shot:');
    console.log(`  Wind: ${longestShot.conditions.windSpeed}mph from ${longestShot.conditions.direction}`);
    console.log(`  Altitude: ${longestShot.conditions.altitude}ft`);
    console.log(`  Temperature: ${longestShot.conditions.temp}°F`);
    console.log(`  Final Distance: ${longestShot.results.finalDistance.toFixed(1)} yards`);
}

runComprehensiveTests();
