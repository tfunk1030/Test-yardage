import axios from 'axios';

// Replace with your Tomorrow.io API key
const API_KEY = 'YOUR_API_KEY';
const API_URL = 'https://api.tomorrow.io/v4/weather';

export async function fetchWeatherData(location) {
    try {
        const response = await axios.get(`${API_URL}/current`, {
            params: {
                location: location,
                apikey: API_KEY,
                fields: 'temperature,humidity,pressure,windSpeed,windDirection'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}
