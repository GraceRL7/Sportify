import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLoginSelector from './components/MainLoginSelector'; 
import AdminLogin from './components/AdminLogin'; 
import CoachLogin from './components/CoachLogin'; 
import PlayerLogin from './components/PlayerLogin'; 
import AdminDashboard from './pages/AdminDashboard'; // ✅ Imported
import CoachDashboard from './pages/CoachDashboard'; // ✅ Imported
import DashboardRouter from './components/DashboardRouter'; // Used as placeholder for Player

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
        {/* 1. Login Selector Root */}
        <Route path="/" element={<MainLoginSelector />} />

        {/* 2. Specific Login Forms */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/coach/login" element={<CoachLogin />} />
        <Route path="/player/login" element={<PlayerLogin />} /> 

        {/* 3. *** THE CRITICAL FIX: Explicit Dashboard Routes *** */}
        {/* Admin Login navigates to this path */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} /> 
        
        {/* Coach Login navigates to this path */}
        <Route path="/coach-dashboard" element={<CoachDashboard />} /> 
        
        {/* Player Login navigates to this path. Using DashboardRouter as a placeholder. */}
        <Route path="/player-dashboard" element={<DashboardRouter />} />

        {/* 4. Keep the general dashboard path for flexibility */}
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* 5. Catch-all: This can be dangerous if not handled in DashboardRouter. 
           It's best to remove it or direct it to a 404 page for stability.
           For now, we'll keep it commented out to prevent infinite redirects.
        <Route path="/*" element={<DashboardRouter />} /> 
        */}
      </Routes>
    </>
  );
}

export default App;