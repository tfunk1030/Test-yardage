import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  altitude: number; // Added altitude property
  timestamp: number;
}

interface WeatherContextType {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refreshWeather: (lat: number, lon: number) => Promise<void>;
}

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshWeather = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);

      // Get user's location if not provided
      if (!lat || !lon) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        lat = position.coords.latitude;
        lon = position.coords.longitude;
      }

      // Get altitude from elevation API
      const elevationResponse = await axios.get(
        `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`
      );
      const altitude = elevationResponse.data.results[0].elevation;

      // Get weather data
      const weatherResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/weather?lat=${lat}&lon=${lon}`
      );

      setWeather({
        ...weatherResponse.data,
        altitude,
        timestamp: Date.now()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWeather(0, 0); // Initial weather fetch
  }, []);

  return (
    <WeatherContext.Provider value={{ weather, loading, error, refreshWeather }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};
