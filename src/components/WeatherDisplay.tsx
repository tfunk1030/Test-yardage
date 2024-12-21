import React from 'react';
import { useWeather } from '../contexts/WeatherContext';

const WeatherDisplay: React.FC = () => {
  const { weather, loading, error, refreshWeather } = useWeather();

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
    <div className="p-6 space-y-6">
      {/* Location and Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Current Location</h2>
          <p className="text-sm text-gray-400">Updated {new Date().toLocaleTimeString()}</p>
        </div>
        <button
          onClick={() => refreshWeather(0, 0)}
          disabled={loading}
          className="button button-secondary flex items-center gap-2"
        >
          <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
          <span className="text-sm">Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-red-500"></i>
          </div>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {weather && (
        <div className="space-y-6">
          {/* Main Weather Card */}
          <div className={`bg-gradient-to-r ${getWeatherBackground(weather.temperature)} rounded-xl p-6 text-white`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-4xl font-bold">{Math.round(weather.temperature)}°</h3>
                <p className="text-sm opacity-90">Feels warmer in direct sunlight</p>
              </div>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <i className="fas fa-sun text-2xl"></i>
              </div>
            </div>
          </div>

          {/* Weather Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Wind Card */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <i className={`fas fa-location-arrow ${getWindDirectionIcon(weather.windDirection)}`}></i>
                </div>
                <span className="text-sm text-gray-400">Wind</span>
              </div>
              <div className="space-y-1">
                <p className="text-xl font-semibold">{Math.round(weather.windSpeed)} mph</p>
                <p className="text-sm text-gray-400">{weather.windDirection}°</p>
              </div>
            </div>

            {/* Humidity Card */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-teal-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-tint text-teal-400"></i>
                </div>
                <span className="text-sm text-gray-400">Humidity</span>
              </div>
              <p className="text-xl font-semibold">{Math.round(weather.humidity)}%</p>
            </div>

            {/* Pressure Card */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-compress-alt text-purple-400"></i>
                </div>
                <span className="text-sm text-gray-400">Pressure</span>
              </div>
              <p className="text-xl font-semibold">{weather.pressure} inHg</p>
            </div>

            {/* Altitude Card */}
            <div className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <i className="fas fa-mountain text-amber-400"></i>
                </div>
                <span className="text-sm text-gray-400">Altitude</span>
              </div>
              <p className="text-xl font-semibold">Sea Level</p>
            </div>
          </div>

          {/* Shot Recommendation */}
          <div className="card p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fas fa-bullseye text-green-400"></i>
              </div>
              <div>
                <h3 className="font-medium text-white mb-1">Shot Recommendation</h3>
                <p className="text-sm text-gray-400">
                  With current wind conditions, aim {weather.windSpeed > 5 ? 'slightly into the wind' : 'normally'} and 
                  consider {weather.windSpeed > 10 ? 'clubbing up' : 'standard club selection'}.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && !weather && (
        <div className="space-y-4">
          <div className="h-32 loading rounded-xl"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 loading rounded-xl"></div>
            <div className="h-24 loading rounded-xl"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherDisplay;
