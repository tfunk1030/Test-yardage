// Comprehensive test suite for yardage calculations
console.log('Test script loaded');

// Add test button to UI immediately
function addTestButton() {
    const buttonGroup = document.getElementById('main-buttons');
    if (!buttonGroup) {
        console.error('Button group not found');
        return;
    }
    
    if (document.querySelector('.test-button')) {
        console.log('Test button already exists');
        return;
    }
    
    const testButton = document.createElement('button');
    testButton.textContent = 'Run Tests';
    testButton.className = 'test-button';
    testButton.onclick = runTests;
    buttonGroup.appendChild(testButton);
    console.log('Test button added successfully');
};

// Only add test button if running in browser
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addTestButton);
    } else {
        addTestButton();
    }
}

import { PGA_CLUB_DATA, PARAMETER_RANGES, ENVIRONMENTAL_COEFFICIENTS } from './constants/club-data.js';
import { calculateAdjustmentFactor } from './script.js';

// Comprehensive test suite for yardage calculations
const testCases = [
    {
        name: 'Driver Standard Conditions',
        club: 'driver',
        conditions: {
            temp: 70,
            humidity: 50,
            altitude: 0,
            pressure: 29.92,
            windSpeed: 0,
            windDir: 'N'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.driver.carryDistance,
            ballSpeed: PGA_CLUB_DATA.driver.ballSpeed,
            spinRate: PGA_CLUB_DATA.driver.spinRate,
            apexHeight: PGA_CLUB_DATA.driver.apexHeight,
            launchAngle: PGA_CLUB_DATA.driver.launchAngle,
            landingAngle: PGA_CLUB_DATA.driver.landingAngle
        }
    },
    {
        name: 'Driver Denver Altitude',
        club: 'driver',
        conditions: {
            temp: 70,
            humidity: 30,
            altitude: 5280,
            pressure: 24.90,
            windSpeed: 0,
            windDir: 'N'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.driver.carryDistance * 1.10, // ~10% increase
            ballSpeed: PGA_CLUB_DATA.driver.ballSpeed * (1 + 5280 * ENVIRONMENTAL_COEFFICIENTS.altitude.ballSpeed),
            spinRate: PGA_CLUB_DATA.driver.spinRate * (1 + 5280 * ENVIRONMENTAL_COEFFICIENTS.altitude.spinRate),
            apexHeight: PGA_CLUB_DATA.driver.apexHeight * (1 + 5280 * ENVIRONMENTAL_COEFFICIENTS.altitude.apexHeight),
            launchAngle: PGA_CLUB_DATA.driver.launchAngle, // Launch angle stays constant
            landingAngle: PGA_CLUB_DATA.driver.landingAngle * 0.95 // Slightly shallower landing
        }
    },
    {
        name: '7 Iron Standard Conditions',
        club: 'seven_iron',
        conditions: {
            temp: 70,
            humidity: 50,
            altitude: 0,
            pressure: 29.92,
            windSpeed: 0,
            windDir: 'N'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.seven_iron.carryDistance,
            ballSpeed: PGA_CLUB_DATA.seven_iron.ballSpeed,
            spinRate: PGA_CLUB_DATA.seven_iron.spinRate,
            apexHeight: PGA_CLUB_DATA.seven_iron.apexHeight,
            launchAngle: PGA_CLUB_DATA.seven_iron.launchAngle,
            landingAngle: PGA_CLUB_DATA.seven_iron.landingAngle
        }
    },
    {
        name: '7 Iron 15mph Headwind',
        club: 'seven_iron',
        conditions: {
            temp: 70,
            humidity: 50,
            altitude: 0,
            pressure: 29.92,
            windSpeed: 15,
            windDir: 'N'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.seven_iron.carryDistance * 0.925, // ~7.5% decrease
            ballSpeed: PGA_CLUB_DATA.seven_iron.ballSpeed * (1 + 15 * ENVIRONMENTAL_COEFFICIENTS.wind.ballSpeed),
            spinRate: PGA_CLUB_DATA.seven_iron.spinRate,
            apexHeight: PGA_CLUB_DATA.seven_iron.apexHeight * (1 + 15 * ENVIRONMENTAL_COEFFICIENTS.wind.apexHeight),
            launchAngle: PGA_CLUB_DATA.seven_iron.launchAngle,
            landingAngle: PGA_CLUB_DATA.seven_iron.landingAngle * 1.1 // Steeper landing
        }
    },
    {
        name: 'Driver Hot Day',
        club: 'driver',
        conditions: {
            temp: 95,
            humidity: 60,
            altitude: 0,
            pressure: 29.85,
            windSpeed: 0,
            windDir: 'N'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.driver.carryDistance * 1.025,
            ballSpeed: PGA_CLUB_DATA.driver.ballSpeed * 1.015,
            spinRate: PGA_CLUB_DATA.driver.spinRate * 0.99,
            apexHeight: PGA_CLUB_DATA.driver.apexHeight * 1.02,
            launchAngle: PGA_CLUB_DATA.driver.launchAngle,
            landingAngle: PGA_CLUB_DATA.driver.landingAngle * 0.98
        }
    },
    {
        name: 'Driver Cold Day',
        club: 'driver',
        conditions: {
            temp: 40,
            humidity: 40,
            altitude: 0,
            pressure: 30.10,
            windSpeed: 0,
            windDir: 'N'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.driver.carryDistance * 0.975,
            ballSpeed: PGA_CLUB_DATA.driver.ballSpeed * 0.985,
            spinRate: PGA_CLUB_DATA.driver.spinRate * 1.01,
            apexHeight: PGA_CLUB_DATA.driver.apexHeight * 0.98,
            launchAngle: PGA_CLUB_DATA.driver.launchAngle,
            landingAngle: PGA_CLUB_DATA.driver.landingAngle * 1.02
        }
    },
    {
        name: 'Driver 10mph Tailwind',
        club: 'driver',
        conditions: {
            temp: 70,
            humidity: 50,
            altitude: 0,
            pressure: 29.92,
            windSpeed: 10,
            windDir: 'S'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.driver.carryDistance * 1.05,
            ballSpeed: PGA_CLUB_DATA.driver.ballSpeed * 1.01,
            spinRate: PGA_CLUB_DATA.driver.spinRate,
            apexHeight: PGA_CLUB_DATA.driver.apexHeight * 0.95,
            launchAngle: PGA_CLUB_DATA.driver.launchAngle,
            landingAngle: PGA_CLUB_DATA.driver.landingAngle * 0.9
        }
    },
    {
        name: 'Driver 10mph Crosswind',
        club: 'driver',
        conditions: {
            temp: 70,
            humidity: 50,
            altitude: 0,
            pressure: 29.92,
            windSpeed: 10,
            windDir: 'E'
        },
        expected: {
            carryDistance: PGA_CLUB_DATA.driver.carryDistance * 0.99,
            ballSpeed: PGA_CLUB_DATA.driver.ballSpeed,
            spinRate: PGA_CLUB_DATA.driver.spinRate * 1.02,
            apexHeight: PGA_CLUB_DATA.driver.apexHeight * 0.98,
            launchAngle: PGA_CLUB_DATA.driver.launchAngle,
            landingAngle: PGA_CLUB_DATA.driver.landingAngle * 1.05
        }
    }
];

function validateClubData(actual, expected, tolerance) {
    const results = {
        passed: true,
        differences: {}
    };

    for (const [key, value] of Object.entries(expected)) {
        const diff = Math.abs(actual[key] - value);
        const maxDiff = value * (tolerance / 100);
        const passed = diff <= maxDiff;
        
        results.passed = results.passed && passed;
        results.differences[key] = {
            expected: value,
            actual: actual[key],
            difference: diff,
            percentDiff: (diff / value) * 100,
            passed
        };
    }

    return results;
}

function runTests() {
    console.log('Starting comprehensive test suite with PGA Tour data...');
    let passCount = 0;
    let failCount = 0;

    testCases.forEach(test => {
        console.log(`\n========== Test Case: ${test.name} ==========`);
        console.log('Club:', PGA_CLUB_DATA[test.club].name);
        console.log('Conditions:', test.conditions);

        // Calculate adjustments
        const weatherData = {
            current: {
                temp: test.conditions.temp,
                humidity: test.conditions.humidity,
                pressure: test.conditions.pressure,
                windSpeed: test.conditions.windSpeed,
                windDir: test.conditions.windDir,
                feelsLike: test.conditions.temp
            }
        };

        const adjustment = calculateAdjustmentFactor(weatherData, test.conditions.altitude);
        
        // Calculate actual values based on our adjustments
        const actual = {
            carryDistance: PGA_CLUB_DATA[test.club].carryDistance * adjustment.factor,
            ballSpeed: PGA_CLUB_DATA[test.club].ballSpeed * (1 + adjustment.components.airDensity - 1),
            spinRate: PGA_CLUB_DATA[test.club].spinRate * (1 + adjustment.components.airDensity - 1),
            apexHeight: PGA_CLUB_DATA[test.club].apexHeight * adjustment.factor,
            launchAngle: PGA_CLUB_DATA[test.club].launchAngle,
            landingAngle: PGA_CLUB_DATA[test.club].landingAngle * 
                (1 + (adjustment.components.wind.distanceEffect * 0.1))
        };

        // Validate results with 3% tolerance
        const results = validateClubData(actual, test.expected, 3);

        if (results.passed) {
            passCount++;
            console.log('✅ PASSED');
        } else {
            failCount++;
            console.log('❌ FAILED');
        }

        console.log('\nDetailed Results:');
        for (const [key, data] of Object.entries(results.differences)) {
            console.log(`${key}:`);
            console.log(`  Expected: ${data.expected.toFixed(1)}`);
            console.log(`  Actual: ${data.actual.toFixed(1)}`);
            console.log(`  Difference: ${data.percentDiff.toFixed(1)}%`);
            console.log(`  Status: ${data.passed ? '✅' : '❌'}`);
        }
    });

    console.log('\n========== Test Summary ==========');
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / testCases.length) * 100).toFixed(1)}%`);
}

// If running directly in Node.js, run tests immediately
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    runTests();
}
