import React from 'react';
import { Routes, Route } from 'react-router-dom';
// FIX: Using './components/' for shared modules (Logins and Routers)
import MainLoginSelector from './components/MainLoginSelector'; 
import AdminLogin from './components/AdminLogin'; 
import CoachLogin from './components/CoachLogin'; 
import PlayerLogin from './components/PlayerLogin'; 
import DashboardRouter from './components/DashboardRouter'; 
// FIX: Using './pages/' for page-level components (Dashboards)
import AdminDashboard from './pages/AdminDashboard'; 
import CoachDashboard from './pages/CoachDashboard'; 
import PlayerDashboard from './pages/PlayerDashboard'; 


function App() {
  return (
    <>
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
        {/* 1. Login Selectors */}
        <Route path="/" element={<MainLoginSelector />} />

        {/* 2. Specific Login Forms */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/coach/login" element={<CoachLogin />} />
        <Route path="/player/login" element={<PlayerLogin />} /> 

        {/* 3. CRITICAL: Explicit Dashboard Routes (Target of successful login) */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
        <Route path="/coach-dashboard" element={<CoachDashboard />} /> 
        <Route path="/player-dashboard" element={<PlayerDashboard />} /> 

        {/* General fallback routes */}
        <Route path="/dashboard" element={<DashboardRouter />} />
      </Routes>
    </>
  );
}

export default App;
