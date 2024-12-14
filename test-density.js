import { calculateAirDensityRatio } from './script.js';

const testConditions = [
    {
        name: "Sea Level Standard",
        temp: 59,
        pressure: 29.92,
        humidity: 50,
        elevation: 0
    },
    {
        name: "Denver Summer",
        temp: 85,
        pressure: 24.92, // ~5280ft elevation
        humidity: 30,
        elevation: 5280
    },
    {
        name: "Hot Coastal",
        temp: 100,
        pressure: 29.92,
        humidity: 80,
        elevation: 0
    },
    {
        name: "Cold Morning",
        temp: 40,
        pressure: 30.10,
        humidity: 60,
        elevation: 0
    },
    {
        name: "Mild Inland",
        temp: 72,
        pressure: 29.85,
        humidity: 45,
        elevation: 1000
    }
];

// Test clubs with launch conditions
const clubs = {
    "Driver": {
        carry: 288,
        launchAngle: 10.9,
        ballSpeed: 167,
        spin: 2686
    },
    "9 Iron": {
        carry: 150,
        launchAngle: 26,
        ballSpeed: 103,
        spin: 7000
    }
};

function calculateComponents(conditions) {
    const standardTemp = 59;
    const standardPressure = 29.92;
    const standardHumidity = 50;
    
    // Temperature component
    const tempRankine = conditions.temp + 459.67;
    const standardTempRankine = standardTemp + 459.67;
    const temperatureRatio = Math.pow(standardTempRankine / tempRankine, 0.5);
    const tempEffect = ((temperatureRatio - 1) * 100).toFixed(2);
    
    // Pressure component
    const pressureRatio = Math.pow(conditions.pressure / standardPressure, 0.45);
    const pressureEffect = ((pressureRatio - 1) * 100).toFixed(2);
    
    // Humidity component
    const humidityFactor = 1 - ((conditions.humidity - standardHumidity) / 100 * 0.008);
    const humidityEffect = ((humidityFactor - 1) * 100).toFixed(2);
    
    return {
        temperature: {
            ratio: temperatureRatio,
            effect: tempEffect
        },
        pressure: {
            ratio: pressureRatio,
            effect: pressureEffect
        },
        humidity: {
            ratio: humidityFactor,
            effect: humidityEffect
        }
    };
}

function calculateDistanceEffect(densityRatio, club) {
    // Invert the density ratio effect: less dense = longer distance
    const effectRatio = 2 - densityRatio;  // This inverts the effect
    const yardageChange = club.carry * (effectRatio - 1);
    
    return {
        carry: yardageChange.toFixed(1),
        ballSpeed: "0.0" // Ball speed doesn't change with air density
    };
}

console.log("=== Detailed Air Density Analysis ===\n");
console.log("Standard Conditions:");
console.log("- Temperature: 59°F");
console.log("- Pressure: 29.92 inHg");
console.log("- Humidity: 50%");
console.log("- Elevation: Sea Level\n");

testConditions.forEach(condition => {
    console.log(`\n${condition.name.toUpperCase()}`);
    console.log("=".repeat(condition.name.length + 4));
    console.log("\nConditions:");
    console.log(`Temperature: ${condition.temp}°F (${condition.temp - 59} from standard)`);
    console.log(`Pressure: ${condition.pressure} inHg (${(condition.pressure - 29.92).toFixed(2)} from standard)`);
    console.log(`Humidity: ${condition.humidity}% (${condition.humidity - 50} from standard)`);
    console.log(`Elevation: ${condition.elevation}ft`);
    
    const components = calculateComponents(condition);
    const totalDensityRatio = calculateAirDensityRatio(condition);
    
    console.log("\nComponent Effects:");
    console.log(`Temperature: ${components.temperature.effect}%`);
    console.log(`Pressure: ${components.pressure.effect}%`);
    console.log(`Humidity: ${components.humidity.effect}%`);
    
    console.log(`\nTotal Air Density Effect: ${((totalDensityRatio - 1) * 100).toFixed(2)}%`);
    
    console.log("\nClub-Specific Changes:");
    for (const [clubName, clubData] of Object.entries(clubs)) {
        const changes = calculateDistanceEffect(totalDensityRatio, clubData);
        console.log(`\n${clubName}:`);
        console.log(`- Base Carry: ${clubData.carry} yards`);
        console.log(`- Carry Change: ${changes.carry} yards`);
        console.log(`- Ball Speed Change: ${changes.ballSpeed} mph`);
        console.log(`- Launch Angle: ${clubData.launchAngle}°`);
        console.log(`- Spin Rate: ${clubData.spin} rpm`);
    }
});
