import { calculateAirDensity, calculateDewPoint, calculatePressureAtAltitude, calculateEffectiveWindSpeed } from './calculations/air-density-calculations';
import axios from 'axios';

const API_KEY = 'YOUR_API_KEY'; // Replace with your actual API key
const API_URL = 'https://api.weatherapi.com/v1/current.json';

export async function fetchWeatherData(location) {
    try {
        const response = await axios.get(`${API_URL}?key=${API_KEY}&q=${location}`);
        const data = response.data;

        const temperature = data.current.temp_f; // Temperature in Fahrenheit
        const humidity = data.current.humidity; // Humidity in percentage
        const pressure = data.current.pressure_in; // Pressure in inHg
        const windSpeed = data.current.wind_mph; // Wind speed in mph
        const windDirection = data.current.wind_dir; // Wind direction

        // Perform calculations
        const airDensity = calculateAirDensity(temperature, pressure);
        const dewPoint = calculateDewPoint(temperature, humidity);
        const effectiveWindSpeed = calculateEffectiveWindSpeed(windSpeed, 0); // Assuming altitude is 0 for now

        return {
            temperature,
            humidity,
            pressure,
            windSpeed,
            windDirection,
            airDensity,
            dewPoint,
            effectiveWindSpeed
        };
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}
