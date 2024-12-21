import axios from 'axios';
import { calculateAirDensity, calculateDewPoint, calculateEffectiveWindSpeed } from '../calculations/air-density-calculations';

interface Location {
    lat: number;
    lon: number;
}

interface WeatherData {
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    altitude: number;
}

class WeatherService {
    private readonly TOMORROW_IO_API_KEY = process.env.TOMORROW_IO_API_KEY;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private cachedWeather: WeatherData | null = null;
    private lastFetch: number | null = null;

    async fetchWeatherData(location: Location): Promise<WeatherData> {
        try {
            // Check cache first
            if (this.isCacheValid()) {
                console.log('Using cached weather data');
                return this.cachedWeather!;
            }

            console.log('Fetching weather data...');
            const url = `https://api.tomorrow.io/v4/weather/realtime?location=${location.lat},${location.lon}&units=imperial&apikey=${this.TOMORROW_IO_API_KEY}`;
            
            const response = await axios.get(url);
            const data = response.data.data.values;

            const weatherData: WeatherData = {
                temperature: data.temperature,
                humidity: data.humidity,
                windSpeed: data.windSpeed,
                windDirection: data.windDirection,
                pressure: data.pressureSeaLevel,
                altitude: data.altitude || 0
            };

            // Cache the data
            this.cachedWeather = weatherData;
            this.lastFetch = Date.now();

            return weatherData;
        } catch (error) {
            console.error('Error fetching weather data:', error);
            return this.getMockWeatherData();
        }
    }

    private isCacheValid(): boolean {
        return !!this.cachedWeather && 
               !!this.lastFetch && 
               (Date.now() - this.lastFetch < this.CACHE_DURATION);
    }

    getMockWeatherData(): WeatherData {
        return {
            temperature: 70,
            humidity: 50,
            windSpeed: 10,
            windDirection: 0,
            pressure: 29.92,
            altitude: 0
        };
    }
}

export const weatherService = new WeatherService();
