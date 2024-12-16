import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.TOMORROW_IO_API_KEY; // Ensure your .env has this variable
const BASE_URL = 'https://api.tomorrow.io/v4/timelines';

export async function fetchWeatherData(location) {
    try {
        const response = await axios.get(`${BASE_URL}`, {
            params: {
                location: location,
                fields: ['temperature', 'humidity', 'windSpeed', 'windDirection', 'pressure', 'altitude'],
                units: 'imperial',
                timesteps: 'current',
                apikey: API_KEY
            }
        });

        const weatherData = response.data.data[0]; // Assuming the first data point is the current weather
        return {
            temperature: weatherData.temperature,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            windDirection: weatherData.windDirection,
            pressure: weatherData.pressure,
            altitude: weatherData.altitude
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}
