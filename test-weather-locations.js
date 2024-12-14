import { calculateWindEffect, calculateAltitudeEffect, calculateAirDensityRatio } from './script.js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const locations = [
    {
        name: "Pine Valley Golf Club, NJ",
        coordinates: { lat: 39.7926, lon: -74.9702 },
        elevation_ft: 95
    },
    {
        name: "Augusta National Golf Club, GA",
        coordinates: { lat: 33.5027, lon: -82.0232 },
        elevation_ft: 330
    },
    {
        name: "Cypress Point Club, CA",
        coordinates: { lat: 36.5780, lon: -121.9686 },
        elevation_ft: 95
    },
    {
        name: "Shinnecock Hills Golf Club, NY",
        coordinates: { lat: 40.8915, lon: -72.4482 },
        elevation_ft: 90
    },
    {
        name: "Oakmont Country Club, PA",
        coordinates: { lat: 40.5273, lon: -79.8297 },
        elevation_ft: 1020
    },
    {
        name: "Merion Golf Club (East), PA",
        coordinates: { lat: 39.9906, lon: -75.3124 },
        elevation_ft: 255
    },
    {
        name: "Pebble Beach Golf Links, CA",
        coordinates: { lat: 36.5725, lon: -121.9486 },
        elevation_ft: 0
    },
    {
        name: "National Golf Links of America, NY",
        coordinates: { lat: 40.9184, lon: -72.4515 },
        elevation_ft: 35
    },
    {
        name: "Sand Hills Golf Club, NE",
        coordinates: { lat: 41.7474, lon: -101.3729 },
        elevation_ft: 3750
    },
    {
        name: "Fishers Island Club, NY",
        coordinates: { lat: 41.2639, lon: -71.9647 },
        elevation_ft: 12
    },
    {
        name: "TPC Sawgrass (Stadium), FL",
        coordinates: { lat: 30.1975, lon: -81.3959 },
        elevation_ft: 3
    }
];

const clubs = {
    "9 Iron": 150,
    "Driver": 288
};

function calculateTemperatureEffect(temp_f) {
    const standardTemp = 70; // Standard temperature in Fahrenheit
    const yardageChangePerDegree = 0.2; // 0.2 yards per degree difference
    
    const tempDifference = temp_f - standardTemp;
    const percentageChange = (tempDifference * yardageChangePerDegree) / 100;
    
    return percentageChange;
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 2, delay = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Log the raw response for debugging
            console.log('API Response:', JSON.stringify(data, null, 2));
            
            if (!data || !data.data || !data.data.values) {
                throw new Error('Invalid response format');
            }
            return data;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            console.log(`Waiting ${delay}ms before retry...`);
            await sleep(delay);
        }
    }
}

async function fetchWeatherData(location) {
    const apiKey = process.env.TOMORROW_API_KEY;
    if (!apiKey) {
        throw new Error("TOMORROW_API_KEY not found in environment variables");
    }

    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${location.coordinates.lat},${location.coordinates.lon}&units=imperial&apikey=${apiKey}`;
    
    try {
        const data = await fetchWithRetry(url);
        const values = data.data.values;
        return {
            temp_f: values.temperature,
            wind_mph: 0, // Setting to 0 as per requirements
            wind_dir: 'N',
            humidity: values.humidity,
            pressure_mb: values.pressureSurfaceLevel,
            elevation_ft: location.elevation_ft
        };
    } catch (error) {
        console.error(`Error fetching weather for ${location.name}:`, error);
        throw error;
    }
}

function calculateTotalEffect(weather) {
    const altitudeEffect = calculateAltitudeEffect(weather.elevation_ft);
    const temperatureEffect = calculateTemperatureEffect(weather.temp_f);
    const airDensityEffect = calculateAirDensityRatio({
        temp: weather.temp_f,
        pressure: weather.pressure_mb,
        humidity: weather.humidity
    });
    
    return {
        windDistanceEffect: 0,
        windLateralEffect: 0,
        altitudeEffect: altitudeEffect.total - 1,
        temperatureEffect: temperatureEffect,
        airDensityEffect: airDensityEffect - 1
    };
}

function calculateAdjustedDistance(baseDistance, effects) {
    const totalEffect = effects.altitudeEffect + 
                       effects.temperatureEffect + 
                       effects.airDensityEffect;
    
    return baseDistance * (1 + totalEffect);
}

async function runTests() {
    console.log("Running Weather Location Tests...\n");

    for (const location of locations) {
        try {
            const weather = await fetchWeatherData(location);
            await sleep(1000); // Add delay between locations
            
            console.log(`\n${location.name}`);
            console.log('Weather Conditions:');
            console.log(`  Temperature: ${weather.temp_f}°F`);
            console.log(`  Wind: ${weather.wind_mph}mph from ${weather.wind_dir}`);
            console.log(`  Humidity: ${weather.humidity}%`);
            console.log(`  Pressure: ${weather.pressure_mb.toFixed(2)} inHg`);
            console.log(`  Elevation: ${weather.elevation_ft}ft`);
            
            console.log('\nEnvironmental Effects:');
            console.log(`  Wind Distance Effect: ${(0 * 100).toFixed(1)}%`);
            console.log(`  Wind Lateral Effect: ${(0 * 100).toFixed(1)}%`);
            console.log(`  Altitude Effect: +${((calculateAltitudeEffect(weather.elevation_ft).total - 1) * 100).toFixed(1)}%`);
            console.log(`  Temperature Effect: +${(calculateTemperatureEffect(weather.temp_f) * 100).toFixed(1)}%`);
            console.log(`  Air Density Effect: +${((calculateAirDensityRatio({
                temp: weather.temp_f,
                pressure: weather.pressure_mb,
                humidity: weather.humidity
            }) - 1) * 100).toFixed(1)}%`);
            
            console.log('\nAdjusted Distances:');
            for (const [club, baseYardage] of Object.entries(clubs)) {
                // Calculate total effect
                const windAdjusted = baseYardage * (1 + 0);
                const adjustedDistance = calculateAdjustedDistance(windAdjusted, {
                    windDistanceEffect: 0,
                    windLateralEffect: 0,
                    altitudeEffect: calculateAltitudeEffect(weather.elevation_ft).total - 1,
                    temperatureEffect: calculateTemperatureEffect(weather.temp_f),
                    airDensityEffect: calculateAirDensityRatio({
                        temp: weather.temp_f,
                        pressure: weather.pressure_mb,
                        humidity: weather.humidity
                    }) - 1
                });
                const lateralMovement = baseYardage * 0;
                
                console.log(`\n${club} (${baseYardage} yards):`);
                console.log(`  Final Carry: ${adjustedDistance.toFixed(1)} yards`);
                console.log(`  Total Change: ${(adjustedDistance - baseYardage).toFixed(1)} yards`);
                if (Math.abs(lateralMovement) > 0.1) {
                    console.log(`  Lateral Movement: ${lateralMovement.toFixed(1)} yards`);
                }
            }
            
            console.log('\n------------------------');
        } catch (error) {
            console.error(`Error processing ${location.name}:`, error);
        }
    }
}

async function testLocation(locationIndex) {
    console.log('Starting location test...');
    console.log('Location index:', locationIndex);
    
    if (locationIndex < 0 || locationIndex >= locations.length) {
        console.error('Invalid location index');
        return;
    }

    const location = locations[locationIndex];
    console.log(`Testing location: ${location.name}`);
    console.log('Location details:', JSON.stringify(location, null, 2));
    
    try {
        console.log('Fetching weather data...');
        const weather = await fetchWeatherData(location);
        console.log('Weather data received:', JSON.stringify(weather, null, 2));
        
        console.log('\nWeather Conditions:');
        console.log(`  Temperature: ${weather.temp_f}°F`);
        console.log(`  Humidity: ${weather.humidity}%`);
        console.log(`  Pressure: ${weather.pressure_mb} inHg`);
        console.log(`  Elevation: ${weather.elevation_ft}ft`);
        
        const effects = calculateTotalEffect(weather);
        
        console.log('\nEnvironmental Effects:');
        console.log(`  Altitude Effect: +${(effects.altitudeEffect * 100).toFixed(1)}%`);
        console.log(`  Temperature Effect: ${(effects.temperatureEffect * 100).toFixed(1)}%`);
        console.log(`  Air Density Effect: ${(effects.airDensityEffect * 100).toFixed(1)}%`);
        
        console.log('\nAdjusted Distances:');
        for (const [club, baseYardage] of Object.entries(clubs)) {
            const adjustedDistance = calculateAdjustedDistance(baseYardage, effects);
            console.log(`\n${club} (${baseYardage} yards):`);
            console.log(`  Final Carry: ${adjustedDistance.toFixed(1)} yards`);
            console.log(`  Total Change: ${(adjustedDistance - baseYardage).toFixed(1)} yards`);
        }
    } catch (error) {
        console.error(`Error processing ${location.name}:`, error);
    }
}

// Export the test function
export { testLocation, locations, runTests, calculateTemperatureEffect, calculateTotalEffect, calculateAdjustedDistance };

// Only run tests if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    const locationIndex = process.argv[2] ? parseInt(process.argv[2]) : 0;
    testLocation(locationIndex);
}
