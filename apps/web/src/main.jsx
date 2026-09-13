import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

import './styles/variables.css';
import './styles/animations.css';
import './styles/global.css';
import './styles/control.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Progressive Web App Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('✅ [PWA] Service Worker registered successfully, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('⚠️ [PWA] Service Worker registration failed:', err);
      });
  });
}

