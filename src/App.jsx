import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLoginSelector from './components/MainLoginSelector'; 
import AdminLogin from './components/AdminLogin'; 
import CoachLogin from './components/CoachLogin'; 
import PlayerLogin from './components/PlayerLogin'; 
import DashboardRouter from './components/DashboardRouter';

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
        {/* Root path */}
        <Route path="/" element={<MainLoginSelector />} />

        {/* Login Forms */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/coach/login" element={<CoachLogin />} />
        <Route path="/player/login" element={<PlayerLogin />} /> 

        {/* Universal Dashboard Router */}
        <Route path="/dashboard" element={<DashboardRouter />} />

        {/* Catch-all */}
        <Route path="/*" element={<DashboardRouter />} />
      </Routes>
    </>
  );
}

export default App;
