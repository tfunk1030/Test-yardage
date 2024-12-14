// Wind adjustment calculations and visualizations
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const windSpeedInput = document.getElementById('wind-speed');
    const windDirectionSelect = document.getElementById('wind-direction');
    const shotHeightSelect = document.getElementById('shot-height');
    const windArrow = document.getElementById('windArrow');
    const windEffect = document.getElementById('wind-effect');
    const carryEffect = document.getElementById('carry-effect');
    const sideEffect = document.getElementById('side-effect');

    // Constants for calculations
    const WIND_FACTOR = {
        low: 0.7,
        medium: 1.0,
        high: 1.3
    };

    const DIRECTION_ANGLES = {
        'N': 0,
        'NE': 45,
        'E': 90,
        'SE': 135,
        'S': 180,
        'SW': 225,
        'W': 270,
        'NW': 315
    };

    // Initialize trajectory chart
    const ctx = document.getElementById('trajectoryChart').getContext('2d');
    let trajectoryChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 11}, (_, i) => i * 10),
            datasets: [{
                label: 'Shot Trajectory',
                data: calculateTrajectory(0, 'N', 'medium'),
                borderColor: '#3b82f6',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Height (yards)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Distance (yards)'
                    }
                }
            }
        }
    });

    // Event listeners
    [windSpeedInput, windDirectionSelect, shotHeightSelect].forEach(element => {
        element.addEventListener('change', updateCalculations);
    });

    function updateCalculations() {
        const windSpeed = parseFloat(windSpeedInput.value) || 0;
        const windDirection = windDirectionSelect.value;
        const shotHeight = shotHeightSelect.value;

        // Update wind arrow
        const angle = DIRECTION_ANGLES[windDirection];
        windArrow.style.transform = `rotate(${angle}deg)`;
        
        // Calculate effects
        const effects = calculateWindEffects(windSpeed, windDirection, shotHeight);
        
        // Update display
        carryEffect.textContent = `${effects.carry > 0 ? '+' : ''}${effects.carry.toFixed(1)} yds`;
        sideEffect.textContent = `${effects.side > 0 ? 'Right ' : 'Left '}${Math.abs(effects.side).toFixed(1)} yds`;
        
        // Update wind effect description
        updateWindEffect(windSpeed, windDirection);
        
        // Update trajectory chart
        updateTrajectoryChart(effects);
    }

    function calculateWindEffects(speed, direction, height) {
        const heightFactor = WIND_FACTOR[height];
        let carry = 0;
        let side = 0;

        // Calculate based on direction
        const angle = DIRECTION_ANGLES[direction] * (Math.PI / 180);
        carry = -speed * Math.cos(angle) * heightFactor;
        side = speed * Math.sin(angle) * heightFactor;

        return { carry, side };
    }

    function calculateTrajectory(windSpeed, direction, height) {
        const effects = calculateWindEffects(windSpeed, direction, height);
        const points = [];
        const maxHeight = 30; // Maximum height in yards
        
        for (let x = 0; x <= 100; x += 10) {
            // Parabolic trajectory with wind effects
            const normalizedX = x / 100;
            const y = maxHeight * Math.sin(normalizedX * Math.PI) * WIND_FACTOR[height];
            
            // Add wind effects
            const windX = x + (effects.side * normalizedX);
            const windY = y + (effects.carry * normalizedX);
            
            points.push({x: windX, y: windY});
        }
        
        return points;
    }

    function updateTrajectoryChart(effects) {
        const points = calculateTrajectory(
            parseFloat(windSpeedInput.value) || 0,
            windDirectionSelect.value,
            shotHeightSelect.value
        );

        trajectoryChart.data.datasets[0].data = points;
        trajectoryChart.update();
    }

    function updateWindEffect(speed, direction) {
        let description = '';
        if (speed === 0) {
            description = 'No wind effect';
        } else {
            const strength = speed < 5 ? 'Light' : speed < 15 ? 'Moderate' : 'Strong';
            const directionText = {
                'N': 'headwind',
                'S': 'tailwind',
                'E': 'right-to-left',
                'W': 'left-to-right',
                'NE': 'headwind from right',
                'NW': 'headwind from left',
                'SE': 'tailwind from right',
                'SW': 'tailwind from left'
            }[direction];

            description = `${strength} ${directionText}`;
        }
        windEffect.innerHTML = `<span class="text-lg font-medium text-blue-900">${description}</span>`;
    }

    // Initial calculation
    updateCalculations();
});

// Add touch event handling for mobile devices
if ('ontouchstart' in window) {
    document.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('touchstart', function(e) {
            e.target.focus();
        });
    });
}
