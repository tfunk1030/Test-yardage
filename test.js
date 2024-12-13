// Test suite for yardage calculations
console.log('Test script loaded');

// Add test button to UI immediately
const addTestButton = () => {
    console.log('Adding test button...');
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
    testButton.onclick = runTests;
    testButton.className = 'test-button';
    buttonGroup.appendChild(testButton);
    console.log('Test button added successfully');
};

// Try to add button immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addTestButton);
} else {
    addTestButton();
}

// Test cases
const testCases = [
    {
        name: "Sea Level Standard Conditions",
        conditions: {
            temperature: 70,
            humidity: 50,
            altitude: 0
        },
        distances: [250],
        expected: [250]
    }
];

// Test runner
function runTests() {
    console.log('Starting test run...');
    
    // Check for required elements
    const tempInput = document.getElementById('temperature');
    const humidityInput = document.getElementById('humidity');
    const altitudeInput = document.getElementById('altitude');
    const clubRow = document.querySelector('.club-row');
    
    if (!tempInput || !humidityInput || !altitudeInput || !clubRow) {
        console.error('Required elements not found:', {
            temperature: !!tempInput,
            humidity: !!humidityInput,
            altitude: !!altitudeInput,
            clubRow: !!clubRow
        });
        alert('Error: Required elements not found. Check console for details.');
        return;
    }
    
    // Run test cases
    function runTest() {
        console.log('Running test cases...');
        
        // Test cases with different conditions
        const testCases = [
            {
                name: 'Hot Day',
                temp: 90,
                humidity: 50,
                altitude: 0,
                distance: 250,
                expectedChange: '+2.1%' // Warmer air = less dense = longer distance
            },
            {
                name: 'High Altitude',
                temp: 70,
                humidity: 50,
                altitude: 5000,
                distance: 250,
                expectedChange: '+6.0%' // Higher altitude = thinner air = longer distance
            }
        ];

        // Run each test case
        testCases.forEach(test => {
            console.log(`\n========== Test Case: ${test.name} ==========`);
            console.log('Conditions:', {
                temperature: test.temp,
                humidity: test.humidity,
                altitude: test.altitude
            });
            
            // Set the environmental conditions
            document.getElementById('temperature').value = test.temp;
            document.getElementById('humidity').value = test.humidity;
            document.getElementById('altitude').value = test.altitude;
            
            // Set the test distance
            const firstDistanceInput = document.querySelector('.club-distance');
            if (firstDistanceInput) {
                firstDistanceInput.value = test.distance;
            }
            
            // Calculate distances
            console.log('\nCalculating adjustment...');
            calculateAllDistances();
            
            // Get the result
            const adjustedInput = document.querySelector('.adjusted-value');
            if (adjustedInput) {
                const actualValue = parseFloat(adjustedInput.value);
                const actualChange = ((actualValue - test.distance) / test.distance * 100).toFixed(1) + '%';
                
                console.log('\nResults:');
                console.log('- Original distance:', test.distance);
                console.log('- Adjusted distance:', actualValue);
                console.log('- Expected change:', test.expectedChange);
                console.log('- Actual change:', actualChange);
                
                // Get the adjustment details from the UI
                const tempEffect = document.querySelector('.temp-effect').textContent;
                const altEffect = document.querySelector('.altitude-effect').textContent;
                console.log('\nAdjustment Components:');
                console.log('- Temperature effect:', tempEffect);
                console.log('- Altitude effect:', altEffect);
            }
            console.log('=======================================\n');
        });
    }
    
    runTest();
}
