import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WeatherProvider } from './contexts/WeatherContext';
import { StorageProvider } from './contexts/StorageContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Calculator from './pages/Calculator';

const App: React.FC = () => {
  useEffect(() => {
    // Add mobile viewport meta tag dynamically
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
  }, []);

  return (
    <Router>
      <StorageProvider>
        <WeatherProvider>
          <div className="min-h-screen bg-gray-900 overflow-hidden touch-manipulation">
            <div className="page-transition">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/calculator" element={<Calculator />} />
                {/* Add more routes as needed */}
              </Routes>
            </div>
            <Navigation />
          </div>
        </WeatherProvider>
      </StorageProvider>
    </Router>
  );
};

export default App;
