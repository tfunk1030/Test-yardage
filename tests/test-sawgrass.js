import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env') });

const location = {
    name: "TPC Sawgrass (Stadium), FL",
    coordinates: { lat: 30.1975, lon: -81.3959 },
    elevation_ft: 3
};

const clubs = {
    "9 Iron": 150,
    "Driver": 288
};

function calculateTemperatureEffect(temp_f) {
    const standardTemp = 70;
    const yardageChangePerDegree = 0.2;
    const tempDifference = temp_f - standardTemp;
    const percentageChange = (tempDifference * yardageChangePerDegree) / 100;
    return percentageChange;
}

function calculateAltitudeEffect(elevation_ft) {
    const percentChangePerThousandFeet = 0.0293;
    return {
        total: 1 + (elevation_ft / 1000 * percentChangePerThousandFeet)
    };
}

function calculateAirDensityRatio(conditions) {
    // This is a simplified calculation
    const standardPressure = 29.92; // inHg
    const pressureEffect = conditions.pressure / standardPressure;
    const temperatureEffect = (459.67 + 59) / (459.67 + conditions.temp);
    return pressureEffect * temperatureEffect;
}

function calculateTotalEffect(weather) {
    const altitudeEffect = calculateAltitudeEffect(weather.elevation_ft).total - 1;
    const temperatureEffect = calculateTemperatureEffect(weather.temp_f);
    const airDensityEffect = calculateAirDensityRatio({
        temp: weather.temp_f,
        pressure: weather.pressure_mb,
        humidity: weather.humidity
    }) - 1;
    
    return {
        altitudeEffect,
        temperatureEffect,
        airDensityEffect
    };
}

function calculateAdjustedDistance(baseYardage, effects) {
    const totalEffect = effects.altitudeEffect + 
                       effects.temperatureEffect + 
                       effects.airDensityEffect;
    
    return baseYardage * (1 + totalEffect);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt + 1} of ${maxRetries}`);
            const response = await fetch(url);
            
            if (response.status === 429) {
                const waitTime = Math.pow(2, attempt) * 5000; // Exponential backoff: 5s, 10s, 20s
                console.log(`Rate limited. Waiting ${waitTime/1000} seconds before retry...`);
                await sleep(waitTime);
                continue;
            }
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Raw API response:', JSON.stringify(data, null, 2));
            
            if (!data || !data.data || !data.data.values) {
                throw new Error('Invalid API response format');
            }
            
            return data;
        } catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error.message);
            if (attempt === maxRetries - 1) throw error;
            
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${waitTime/1000} seconds before retry...`);
            await sleep(waitTime);
        }
    }
}

async function fetchWeatherData() {
    const apiKey = process.env.TOMORROW_API_KEY;
    if (!apiKey) {
        throw new Error("TOMORROW_API_KEY not found in environment variables");
    }

    const url = `https://api.tomorrow.io/v4/weather/realtime?location=${location.coordinates.lat},${location.coordinates.lon}&units=imperial&apikey=${apiKey}`;
    
    try {
        console.log('Fetching weather data from Tomorrow.io...');
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
        console.error('Error fetching weather:', error);
        throw error;
    }
}

async function runTest() {
    try {
        console.log(`Testing ${location.name}`);
        console.log('Coordinates:', location.coordinates);
        console.log('Elevation:', location.elevation_ft, 'ft');
        
        const weather = await fetchWeatherData();
        
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
        console.error('Test failed:', error);
    }
}

runTest();
