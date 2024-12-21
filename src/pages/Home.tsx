import React, { useState } from 'react';
import WeatherDisplay from '../components/WeatherDisplay';

const Home: React.FC = () => {
  const [touchStart, setTouchStart] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = async (e: React.TouchEvent) => {
    const touchDelta = e.touches[0].clientY - touchStart;
    
    // Pull to refresh logic
    if (touchDelta > 100 && !refreshing && window.scrollY === 0) {
      setRefreshing(true);
      try {
        // Trigger weather refresh here
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated refresh
      } finally {
        setRefreshing(false);
      }
    }
  };

  return (
    <div 
      className="min-h-screen pb-20 overflow-x-hidden touch-manipulation"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
    >
      {/* Pull to refresh indicator */}
      <div 
        className={`fixed top-0 left-0 right-0 flex items-center justify-center transition-transform duration-300 bg-green-600/20 backdrop-blur-sm z-50 h-16 ${
          refreshing ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-sync-alt animate-spin text-green-400"></i>
          <span className="text-green-400 font-medium">Refreshing...</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Header Card */}
        <div className="card">
          <div className="bg-gradient-to-r from-green-800 to-green-900 p-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800/50 rounded-full flex items-center justify-center">
                  <i className="fas fa-golf-ball text-green-400"></i>
                </div>
                Golf Yardage Pro
              </h1>
              <button className="button button-secondary">
                <i className="fas fa-cog"></i>
              </button>
            </div>
          </div>
          <WeatherDisplay />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button className="card p-4 touch-feedback active:scale-95 transition-transform duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <i className="fas fa-history text-blue-400"></i>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-white">Recent Shots</h3>
                <p className="text-sm text-gray-400">View history</p>
              </div>
            </div>
          </button>

          <button className="card p-4 touch-feedback active:scale-95 transition-transform duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <i className="fas fa-chart-line text-purple-400"></i>
              </div>
              <div className="text-left">
                <h3 className="font-medium text-white">Statistics</h3>
                <p className="text-sm text-gray-400">View stats</p>
              </div>
            </div>
          </button>
        </div>

        {/* Tips Card */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Today's Tip</h2>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex-shrink-0 flex items-center justify-center">
              <i className="fas fa-lightbulb text-yellow-400"></i>
            </div>
            <div>
              <p className="text-gray-300">
                In today's conditions, consider club up by 1 due to the headwind. 
                This will help maintain your usual trajectory.
              </p>
              <button className="text-green-400 text-sm font-medium mt-2">
                Learn more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
