import React from 'react';
import { WeatherData } from '../contexts/WeatherContext';

interface MobileWeatherCardProps {
  weather: WeatherData;
  onRefresh: () => void;
  loading?: boolean;
}

const MobileWeatherCard: React.FC<MobileWeatherCardProps> = ({ weather, onRefresh, loading }) => {
  const getWindDirectionIcon = (direction: number) => {
    const normalizedDirection = ((direction + 180) % 360);
    return `transform rotate-${normalizedDirection} transition-transform duration-300`;
  };

  const getWeatherBackground = (temp: number) => {
    if (temp >= 85) return 'from-orange-600 to-red-600';
    if (temp >= 70) return 'from-yellow-500 to-orange-500';
    if (temp >= 55) return 'from-green-500 to-emerald-500';
    return 'from-blue-500 to-cyan-500';
  };

  return (
    <div className="mobile-card overflow-hidden">
      {/* Main Weather Display */}
      <div className={`bg-gradient-to-r ${getWeatherBackground(weather.temperature)} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-5xl font-bold mb-2">{Math.round(weather.temperature)}°</h3>
            <p className="text-sm opacity-90">Feels warmer in direct sunlight</p>
          </div>
          <button 
            onClick={onRefresh}
            className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center touch-feedback"
            disabled={loading}
          >
            <i className={`fas fa-sync-alt text-xl ${loading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      </div>

      {/* Weather Details */}
      <div className="p-4">
        <div className="flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4 gap-4">
          {/* Wind Card */}
          <div className="flex-shrink-0 w-40 bg-gray-800/50 rounded-xl p-4 snap-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <i className={`fas fa-location-arrow ${getWindDirectionIcon(weather.windDirection)}`}></i>
              </div>
              <span className="text-sm text-gray-400">Wind</span>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-semibold">{Math.round(weather.windSpeed)} mph</p>
              <p className="text-sm text-gray-400">{weather.windDirection}°</p>
            </div>
          </div>

          {/* Humidity Card */}
          <div className="flex-shrink-0 w-40 bg-gray-800/50 rounded-xl p-4 snap-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-teal-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-tint text-teal-400"></i>
              </div>
              <span className="text-sm text-gray-400">Humidity</span>
            </div>
            <p className="text-2xl font-semibold">{Math.round(weather.humidity)}%</p>
          </div>

          {/* Pressure Card */}
          <div className="flex-shrink-0 w-40 bg-gray-800/50 rounded-xl p-4 snap-start">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <i className="fas fa-compress-alt text-purple-400"></i>
              </div>
              <span className="text-sm text-gray-400">Pressure</span>
            </div>
            <p className="text-2xl font-semibold">{weather.pressure} inHg</p>
          </div>
        </div>

        {/* Shot Recommendation */}
        <div className="mt-4 bg-gray-800/50 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fas fa-bullseye text-green-400"></i>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">Shot Recommendation</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                With current wind conditions, aim {weather.windSpeed > 5 ? 'slightly into the wind' : 'normally'} and 
                consider {weather.windSpeed > 10 ? 'clubbing up' : 'standard club selection'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileWeatherCard;
