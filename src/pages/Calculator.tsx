import React, { useState } from 'react';
import { useWeather } from '../contexts/WeatherContext';
import { useStorage } from '../contexts/StorageContext';
import ClubSelector from '../components/ClubSelector';
import WindAdjustment from '../components/WindAdjustment';
import { BallPhysics } from '../physics/ball-physics';

interface CalculatorState {
  club: string;
  shotDirection: number;
}

const Calculator: React.FC = () => {
  const { weather } = useWeather();
  const { saveShot } = useStorage();
  const [calculatorState, setCalculatorState] = useState<CalculatorState>({
    club: 'driver',
    shotDirection: 0,
  });
  const [result, setResult] = useState<any>(null);

  const handleCalculate = async () => {
    if (!weather) return;

    const physics = new BallPhysics();
    const shotResult = physics.calculateTrajectory({
      club: calculatorState.club,
      conditions: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        pressure: weather.pressure,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
      }
    });

    setResult(shotResult);

    await saveShot({
      club: calculatorState.club,
      distance: shotResult.carry,
      conditions: {
        temperature: weather.temperature,
        humidity: weather.humidity,
        pressure: weather.pressure,
        windSpeed: weather.windSpeed,
        windDirection: weather.windDirection,
      }
    });
  };

  return (
    <div className="overlay min-h-screen pb-20">
      <div className="max-w-lg mx-auto p-4">
        <div className="bg-gray-900/95 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-700/20">
          <div className="bg-gradient-to-r from-green-800 to-green-900 p-8">
            <h1 className="text-2xl font-bold text-white">Shot Calculator</h1>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Select Club</h2>
              <ClubSelector
                selectedClub={calculatorState.club}
                onClubChange={(club) => setCalculatorState(prev => ({ ...prev, club }))}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Shot Direction</h2>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={calculatorState.shotDirection}
                  onChange={(e) => setCalculatorState(prev => ({ 
                    ...prev, 
                    shotDirection: parseInt(e.target.value) 
                  }))}
                  className="flex-1"
                />
                <span className="text-white font-medium w-20 text-center">
                  {calculatorState.shotDirection}°
                </span>
              </div>
            </div>

            {weather && (
              <WindAdjustment
                shotDirection={calculatorState.shotDirection}
                distance={result?.carry || 0}
              />
            )}

            <button
              onClick={handleCalculate}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-500 transition-all duration-300"
            >
              Calculate Shot
            </button>

            {result && (
              <div className="bg-gray-800 p-6 rounded-xl space-y-4">
                <h3 className="text-xl font-semibold text-white">Shot Results</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Carry Distance</div>
                    <div className="text-2xl text-white mt-1">
                      {Math.round(result.carry)} yards
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Total Distance</div>
                    <div className="text-2xl text-white mt-1">
                      {Math.round(result.total)} yards
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Max Height</div>
                    <div className="text-2xl text-white mt-1">
                      {Math.round(result.apex)} feet
                    </div>
                  </div>
                  <div className="bg-gray-700/50 p-4 rounded-lg">
                    <div className="text-sm text-gray-400">Landing Angle</div>
                    <div className="text-2xl text-white mt-1">
                      {Math.round(result.landingAngle)}°
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
