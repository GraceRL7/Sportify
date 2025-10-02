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
      return <Navigate to="/" replace />;
  }
}
