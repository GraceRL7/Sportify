import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

// Import BOTH Providers
import { AuthProvider } from './context/AuthContext'; 
import { NotificationProvider } from './context/NotificationContext'; // Import NotificationProvider

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* AuthProvider wraps NotificationProvider */}
      <AuthProvider> 
        {/* NotificationProvider wraps App */}
        <NotificationProvider> 
          <App />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();