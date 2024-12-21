import React from 'react';
import { useWeather } from '../contexts/WeatherContext';

interface WindAdjustmentProps {
  shotDirection: number;
  distance: number;
}

const WindAdjustment: React.FC<WindAdjustmentProps> = ({ shotDirection, distance }) => {
  const { weather } = useWeather();

  const calculateWindEffect = () => {
    if (!weather) return { adjustment: 0, effect: 'none' };

    const windSpeed = weather.windSpeed;
    const windDirection = weather.windDirection;

    // Calculate relative wind angle (0° is headwind, 180° is tailwind)
    const relativeAngle = Math.abs((windDirection - shotDirection + 360) % 360);
    
    // Calculate wind effect
    let effect: 'headwind' | 'tailwind' | 'crosswind' | 'none' = 'none';
    let adjustment = 0;

    if (relativeAngle <= 45 || relativeAngle >= 315) {
      effect = 'headwind';
      adjustment = -(windSpeed * 0.1 * distance / 100); // Reduce distance by 1% per 10mph headwind
    } else if (relativeAngle >= 135 && relativeAngle <= 225) {
      effect = 'tailwind';
      adjustment = (windSpeed * 0.05 * distance / 100); // Increase distance by 0.5% per 10mph tailwind
    } else {
      effect = 'crosswind';
      // Crosswind adjustment is more complex and depends on many factors
      adjustment = 0; // Simplified for now
    }

    return { adjustment, effect };
  };

  const { adjustment, effect } = calculateWindEffect();

  return (
    <div className="bg-gray-800 p-6 rounded-xl">
      <h3 className="text-xl font-semibold text-white mb-4">Wind Adjustment</h3>
      
      {weather ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-gray-400">Wind Speed</div>
            <div className="text-white font-medium">{weather.windSpeed} mph</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-gray-400">Wind Direction</div>
            <div className="text-white font-medium">{weather.windDirection}°</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-gray-400">Effect Type</div>
            <div className="text-white font-medium capitalize">{effect}</div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-gray-400">Distance Adjustment</div>
            <div className={`font-medium ${adjustment > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {adjustment > 0 ? '+' : ''}{Math.round(adjustment)} yards
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm text-gray-400 mb-2">Wind Direction Relative to Shot</div>
            <div className="relative h-40 w-40 mx-auto">
              {/* Wind direction indicator */}
              <div 
                className="absolute inset-0 border-4 border-gray-700 rounded-full"
                style={{
                  transform: `rotate(${weather.windDirection}deg)`
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <i className="fas fa-arrow-up text-blue-400 text-2xl"></i>
                </div>
              </div>
              
              {/* Shot direction indicator */}
              <div 
                className="absolute inset-0"
                style={{
                  transform: `rotate(${shotDirection}deg)`
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <i className="fas fa-golf-ball text-green-400 text-2xl"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-400">
          Weather data not available
        </div>
      )}
    </div>
  );
};

export default WindAdjustment;
