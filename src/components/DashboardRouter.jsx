import React from 'react';
import { Navigate } from 'react-router-dom';
import AdminDashboard from '../pages/AdminDashboard';
import CoachDashboard from '../pages/CoachDashboard';
import PlayerDashboard from '../pages/PlayerDashboard';

function getUserRole() {
  return localStorage.getItem('role'); 
}

export default function DashboardRouter() {
  const role = getUserRole();

  if (!role) {
    // If no role is found (user not logged in), redirect to the main login selector
    return <Navigate to="/" replace />;
  }

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'coach':
      return <CoachDashboard />;
    case 'player':
      return <PlayerDashboard />;
    default:
      // If a role exists but is unrecognized, redirect to main login
      return <Navigate to="/" replace />;
  }
}