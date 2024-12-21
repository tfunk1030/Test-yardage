import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Add ripple effect on touch
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.touches[0].clientX - rect.left - size / 2;
    const y = e.touches[0].clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      top: ${y}px;
      left: ${x}px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `;

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <nav className="flex justify-around bg-gray-900/95 backdrop-blur-md border-t border-gray-800 fixed bottom-0 left-0 right-0 h-16 px-2 pb-safe">
      <Link
        to="/"
        onTouchStart={handleTouchStart}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 ${
          isActive('/') 
            ? 'text-green-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        <i className="fas fa-cloud text-lg mb-0.5"></i>
        <span className="text-xs font-medium">Weather</span>
        {isActive('/') && (
          <span className="absolute bottom-0 left-1/2 w-1 h-1 bg-green-400 rounded-full transform -translate-x-1/2"></span>
        )}
      </Link>

      <Link
        to="/clubs"
        onTouchStart={handleTouchStart}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 ${
          isActive('/clubs') 
            ? 'text-green-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        <i className="fas fa-golf-ball text-lg mb-0.5"></i>
        <span className="text-xs font-medium">Clubs</span>
        {isActive('/clubs') && (
          <span className="absolute bottom-0 left-1/2 w-1 h-1 bg-green-400 rounded-full transform -translate-x-1/2"></span>
        )}
      </Link>

      <Link
        to="/calculator"
        onTouchStart={handleTouchStart}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 ${
          isActive('/calculator') 
            ? 'text-green-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        <i className="fas fa-calculator text-lg mb-0.5"></i>
        <span className="text-xs font-medium">Calc</span>
        {isActive('/calculator') && (
          <span className="absolute bottom-0 left-1/2 w-1 h-1 bg-green-400 rounded-full transform -translate-x-1/2"></span>
        )}
      </Link>

      <Link
        to="/wind"
        onTouchStart={handleTouchStart}
        className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all duration-200 active:scale-95 ${
          isActive('/wind') 
            ? 'text-green-400' 
            : 'text-gray-400 hover:text-gray-300'
        }`}
      >
        <i className="fas fa-wind text-lg mb-0.5"></i>
        <span className="text-xs font-medium">Wind</span>
        {isActive('/wind') && (
          <span className="absolute bottom-0 left-1/2 w-1 h-1 bg-green-400 rounded-full transform -translate-x-1/2"></span>
        )}
      </Link>
    </nav>
  );
};

export default Navigation;
