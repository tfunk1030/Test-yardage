import React, { useState } from 'react';
import { useWeather } from '../contexts/WeatherContext';
import { useStorage } from '../contexts/StorageContext';
import { BallPhysics } from '../calculations/ball-physics';
import { weatherService } from '../services/weather.service';

interface CalculatorState {
  club: string;
  initialVelocity: number;
  launchAngle: number;
  spinRate: number;
}

const Calculator: React.FC = () => {
  const { weather, loading: weatherLoading, error: weatherError } = useWeather();
  const { saveShot, error: storageError } = useStorage();
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    club: 'driver',
    initialVelocity: 70,
    launchAngle: 12,
    spinRate: 2500,
  });
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    try {
      if (!weather) {
        console.error('Weather data not available');
        return;
      }

      const physics = new BallPhysics();
      const shotResult = physics.calculateTrajectory({
        ...calculatorState,
        temperature: weather.temperature,
        pressure: weather.pressure,
        humidity: weather.humidity,
        altitude: weather.altitude || 0,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
      });

      setResult(shotResult);

      // Save shot data
      await saveShot({
        club: calculatorState.club,
        distance: shotResult.carry,
        conditions: {
          temperature: weather.temperature,
          humidity: weather.humidity,
          pressure: weather.pressure,
          windSpeed: weather.windSpeed,
          windDirection: weather.windDirection,
        },
      });
    } catch (error) {
      console.error('Error calculating shot:', error);
      // Use mock weather data as fallback
      const mockWeather = weatherService.getMockWeatherData();
      const physics = new BallPhysics();
      const shotResult = physics.calculateTrajectory({
        ...calculatorState,
        ...mockWeather,
      });
      setResult(shotResult);
    }
  };

  return (
    <div 
      className="calculator-container"
      role="main"
      aria-labelledby="calculator-title"
    >
      <h1 id="calculator-title" className="text-2xl font-bold mb-6">
        Golf Yardage Calculator
      </h1>

      <form onSubmit={(e) => e.preventDefault()} role="form" aria-label="Yardage calculation form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section 
            className="club-selection"
            role="region"
            aria-labelledby="club-section"
          >
            <h2 id="club-section" className="text-xl font-semibold mb-4">Club Selection</h2>
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="club-type"
                  className="block text-sm font-medium"
                >
                  Club Type
                </label>
                <select
                  id="club-type"
                  value={calculatorState.club}
                  onChange={(e) => setCalculatorState(prev => ({ ...prev, club: e.target.value }))}
                  className="mt-1 block w-full rounded-md"
                  aria-required="true"
                >
                  <option value="driver">Driver</option>
                  <option value="3-wood">3 Wood</option>
                  <option value="5-iron">5 Iron</option>
                  {/* Add more club options */}
                </select>
              </div>
            </div>
          </section>

          <section 
            className="environmental-conditions"
            role="region"
            aria-labelledby="environment-section"
          >
            <h2 id="environment-section" className="text-xl font-semibold mb-4">
              Environmental Conditions
            </h2>
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="temperature"
                  className="block text-sm font-medium"
                >
                  Temperature (°F)
                </label>
                <input
                  type="number"
                  id="temperature"
                  value={weather?.temperature}
                  onChange={(e) => setCalculatorState(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md"
                  min="-20"
                  max="120"
                  aria-required="true"
                  aria-describedby="temperature-description"
                />
                <p id="temperature-description" className="text-sm text-gray-500">
                  Enter temperature between -20°F and 120°F
                </p>
              </div>

              <div>
                <label 
                  htmlFor="wind-speed"
                  className="block text-sm font-medium"
                >
                  Wind Speed (mph)
                </label>
                <input
                  type="number"
                  id="wind-speed"
                  value={weather?.windSpeed}
                  onChange={(e) => setCalculatorState(prev => ({ ...prev, windSpeed: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md"
                  min="0"
                  max="50"
                  aria-required="true"
                  aria-describedby="wind-speed-description"
                />
                <p id="wind-speed-description" className="text-sm text-gray-500">
                  Enter wind speed up to 50 mph
                </p>
              </div>

              <div>
                <label 
                  htmlFor="wind-direction"
                  className="block text-sm font-medium"
                >
                  Wind Direction (degrees)
                </label>
                <input
                  type="number"
                  id="wind-direction"
                  value={weather?.windDirection}
                  onChange={(e) => setCalculatorState(prev => ({ ...prev, windDirection: Number(e.target.value) }))}
                  className="mt-1 block w-full rounded-md"
                  min="0"
                  max="360"
                  aria-required="true"
                  aria-describedby="wind-direction-description"
                />
                <p id="wind-direction-description" className="text-sm text-gray-500">
                  Enter direction between 0° and 360°
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8">
          <button
            type="button"
            onClick={handleCalculate}
            className="w-full bg-indigo-600 text-white rounded-md py-3 px-6"
            aria-label="Calculate yardage"
          >
            Calculate
          </button>
        </div>
      </form>

      {weatherLoading && (
        <div 
          className="loading-indicator mt-4"
          role="status"
          aria-label="Calculating results"
        >
          <div className="spinner"></div>
          <p>Calculating...</p>
        </div>
      )}

      {weatherError && (
        <div 
          className="error-message mt-4 text-red-600"
          role="alert"
          aria-live="polite"
        >
          {weatherError}
        </div>
      )}

      {result && (
        <section 
          className="results mt-8"
          role="region"
          aria-labelledby="results-section"
        >
          <h2 id="results-section" className="text-xl font-semibold mb-4">
            Results
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="result-card p-4 rounded-lg bg-white shadow-md">
              <h3 className="font-medium mb-2">Carry Distance</h3>
              <p className="text-2xl font-bold">{result.carry} yards</p>
            </div>
            <div className="result-card p-4 rounded-lg bg-white shadow-md">
              <h3 className="font-medium mb-2">Total Distance</h3>
              <p className="text-2xl font-bold">{result.total} yards</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Calculator;
