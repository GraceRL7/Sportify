import React from 'react';
// BrowserRouter is handled in index.js
import { Routes, Route } from 'react-router-dom'; 

// 1. REMOVE NotificationProvider import (it's in index.js now)
// import { NotificationProvider } from './context/NotificationContext'; 

// Import Components
import MainLoginSelector from './components/MainLoginSelector'; 
import AdminLogin from './components/AdminLogin'; 
import CoachLogin from './components/CoachLogin'; 
import PlayerLogin from './components/PlayerLogin'; 
import DashboardRouter from './components/DashboardRouter'; 
import NotificationDisplay from './components/NotificationDisplay'; // Keep this import

// Import Pages
import AdminDashboard from './pages/AdminDashboard'; 
import CoachDashboard from './pages/CoachDashboard'; 
import PlayerDashboard from './pages/PlayerDashboard'; 


function App() {
  return (
    // 2. REMOVE NotificationProvider wrapper from here
    // <NotificationProvider> 
      <> {/* Use Fragment or a div */}
        {/* NotificationDisplay STAYS here, it will consume the context from index.js */}
        <NotificationDisplay /> 

        <style>{`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            background-color: #f4f7f6;
          }
          #root {
            min-height: 100vh;
          }
        `}</style>

        <Routes> 
          {/* Login Selectors */}
          <Route path="/" element={<MainLoginSelector />} />

          {/* Specific Login Forms */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/coach/login" element={<CoachLogin />} />
          <Route path="/player/login" element={<PlayerLogin />} /> 

          {/* Explicit Dashboard Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
          <Route path="/coach-dashboard" element={<CoachDashboard />} /> 
          <Route path="/player-dashboard" element={<PlayerDashboard />} /> 

          {/* General fallback routes */}
          <Route path="/dashboard" element={<DashboardRouter />} />
        </Routes>
      </>
    // </NotificationProvider> 
  );
}

export default App;