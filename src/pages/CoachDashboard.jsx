// C:\sportify\src\pages\CoachDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import DashboardLayout from '../components/DashboardLayout';

// Coach tools
import PlayerList from '../components/PlayerList';
import PlayerEvaluation from '../components/PlayerEvaluation';
import PlayerSchedule from '../components/PlayerSchedule';
import UploadTrialResults from '../components/UploadTrialResults';
import CoachNotifications from '../components/CoachNotifications';

import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  Bell,
  BarChart3,
} from 'lucide-react';

import { collection, getDocs } from '../firebase';

// ---------- Coach Overview with light analytics ----------
function CoachOverview() {
  const { db, appId, isLoading, userProfile } = useAuth();
  const [stats, setStats] = useState({
    squadSize: 0,
    upcomingSessions: 0,
    trialResults: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoading || !db || !appId) return;

    const fetchStats = async () => {
      try {
        // Players in roster (simple count)
        const rosterRef = collection(
          db,
          `artifacts/${appId}/public/data/roster`
        );
        const rosterSnap = await getDocs(rosterRef);

        // Sessions / schedules (simple count)
        const schedulesRef = collection(
          db,
          `artifacts/${appId}/public/data/schedules`
        );
        const schedulesSnap = await getDocs(schedulesRef);

        // Trial results uploaded (simple count)
        const resultsRef = collection(
          db,
          `artifacts/${appId}/public/data/trial_results`
        );
        const resultsSnap = await getDocs(resultsRef);

        setStats({
          squadSize: rosterSnap.size,
          upcomingSessions: schedulesSnap.size,
          trialResults: resultsSnap.size,
        });
      } catch (err) {
        console.error('Coach overview stats error:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [db, appId, isLoading]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2
        style={{
          color: 'var(--sportify-royal, var(--sportify-navy))',
          borderBottom: '2px solid var(--sportify-yellow)',
          paddingBottom: '10px',
          margin: 0,
        }}
      >
        Welcome, Coach{userProfile?.name ? ` ${userProfile.name.split(' ')[0]}` : ''}!
      </h2>

      {/* KPI Cards */}
      <div
        style={{
          marginTop: '30px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '18px',
        }}
      >
        <CoachStatCard
          title="Squad Size"
          value={loadingStats ? '—' : stats.squadSize}
          icon={<Users size={22} />}
          accent="#38bdf8"
        />
        <CoachStatCard
          title="Upcoming Sessions"
          value={loadingStats ? '—' : stats.upcomingSessions}
          icon={<Calendar size={22} />}
          accent="var(--sportify-yellow, #FFC501)"
        />
        <CoachStatCard
          title="Trial Results Uploaded"
          value={loadingStats ? '—' : stats.trialResults}
          icon={<BarChart3 size={22} />}
          accent="var(--sportify-red, #BC0E4C)"
        />
      </div>
    </div>
  );
}

// Small stat card for coach dashboard
function CoachStatCard({ title, value, icon, accent }) {
  return (
    <div
      style={{
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        padding: '18px 18px',
        boxShadow: '0 10px 20px rgba(15,23,42,0.06)',
        borderTop: `4px solid ${accent}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#4b5563',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: '#0f172a',
            marginTop: '4px',
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '999px',
          backgroundColor: 'rgba(15,23,42,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accent,
        }}
      >
        {icon}
      </div>
    </div>
  );
}

// ---------- Navigation config ----------
const COACH_NAV_ITEMS = [
  { key: 'overview', label: 'Coach Overview', icon: <LayoutDashboard size={18} /> },
  { key: 'players', label: 'Player List', icon: <Users size={18} /> },
  { key: 'evaluate', label: 'Evaluate Players', icon: <ClipboardCheck size={18} /> },
  { key: 'schedule', label: 'View Schedule', icon: <Calendar size={18} /> },
  { key: 'results', label: 'Upload Results', icon: <BarChart3 size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

export default function CoachDashboard() {
  const [activeFeature, setActiveFeature] = useState('overview');
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  const renderContent = () => {
    switch (activeFeature) {
      case 'players':
        return <PlayerList />;
      case 'evaluate':
        return <PlayerEvaluation />;
      case 'schedule':
        return <PlayerSchedule />;
      case 'results':
        return <UploadTrialResults />;
      case 'notifications':
        return <CoachNotifications />;
      case 'overview':
      default:
        return <CoachOverview />;
    }
  };

  if (userRole && userRole !== 'coach') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        Access Denied: You must be a coach to view this page.
      </div>
    );
  }

  const currentTitle =
    COACH_NAV_ITEMS.find((item) => item.key === activeFeature)?.label ||
    'Coach Dashboard';

  return (
    <DashboardLayout
      title={currentTitle}
      navItems={COACH_NAV_ITEMS}
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
