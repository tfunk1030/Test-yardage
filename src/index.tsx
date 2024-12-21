import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Remove the loading screen once the app is ready
const removeLoader = () => {
  const loader = document.querySelector('.initial-loader');
  if (loader && loader instanceof HTMLElement) {
    loader.addEventListener('transitionend', () => loader.remove());
    loader.style.opacity = '0';
  }
};

// Create root and render app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  // Remove loader after a small delay to ensure smooth transition
  setTimeout(removeLoader, 500);
}

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed:', registrationError);
      });
  });
}

// Add mobile touch handling
document.addEventListener('touchstart', () => {}, { passive: true });

// Prevent bounce scrolling on iOS
document.body.addEventListener('touchmove', (e) => {
  if (e.target === document.body) {
    e.preventDefault();
  }
}, { passive: false });

// Handle PWA install prompt
let deferredPrompt: any;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Export install prompt handler for use in components
export const showInstallPrompt = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User ${outcome} the install prompt`);
    deferredPrompt = null;
  }
};
