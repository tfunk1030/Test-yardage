import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { join } from 'path';
import { getWeatherData } from './script.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root directory
// config({ path: join(__dirname, '.env') });

// Verify API key is loaded (mask most of it)
// const apiKey = process.env.WEATHERAPI_KEY;
// if (!apiKey) {
//     console.error('Error: WEATHERAPI_KEY not found in environment variables');
//     process.exit(1);
// }
// console.log('API Key loaded:', apiKey.slice(0, 4) + '...' + apiKey.slice(-4));

// Test locations
const testLocations = [
    { name: 'New York', lat: 40.7128, lon: -74.0060 },
    { name: 'Denver', lat: 39.7392, lon: -104.9903 },
    { name: 'San Francisco', lat: 37.7749, lon: -122.4194 }
];

// API key (this is your actual API key)
const API_KEY = '9998dc5d92804e58a04163540241312';

async function testWeatherAPI() {
    console.log('Testing Weather API Integration...\n');

    for (const location of testLocations) {
        try {
            console.log(`Testing location: ${location.name}`);
            const weatherData = await getWeatherData(location.lat, location.lon, API_KEY);
            
            console.log('Current Conditions:');
            console.log(`- Temperature: ${weatherData.current.temp}°F`);
            console.log(`- Wind: ${weatherData.current.windSpeed} mph from ${weatherData.current.windDir}`);
            console.log(`- Humidity: ${weatherData.current.humidity}%`);
            console.log(`- Pressure: ${weatherData.current.pressure} inHg`);
            
            console.log('\nForecast:');
            console.log(`- High/Low: ${weatherData.forecast.maxTemp}°F/${weatherData.forecast.minTemp}°F`);
            console.log(`- Conditions: ${weatherData.forecast.condition}`);
            console.log(`- Rain Chance: ${weatherData.forecast.rainChance}%`);
            
            if (weatherData.marine) {
                console.log('\nMarine Conditions:');
                console.log(`- Swell Height: ${weatherData.marine.swellHeight} ft`);
                console.log(`- Swell Direction: ${weatherData.marine.swellDir}`);
                console.log(`- Swell Period: ${weatherData.marine.swellPeriod} seconds`);
            }
            
            console.log('\nStatus: PASSED ✓');
        } catch (error) {
            console.log(`\nStatus: FAILED ✗`);
            console.log(`Error: ${error.message}`);
        }
        console.log('------------------------\n');
    }
}

// Run the test
testWeatherAPI().catch(console.error);
