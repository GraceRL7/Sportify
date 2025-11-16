// C:\sportify\src\pages\PlayerDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  CheckSquare,
  Calendar,
  Bell,
} from 'lucide-react';

// Layout + feature components
import DashboardLayout from '../components/DashboardLayout';
import PlayerProfile from '../components/PlayerProfile';
import TrialApplication from '../components/TrialApplication';
import PlayerNotifications from '../components/PlayerNotifications';

import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where } from '../firebase';

// ---------- Player Overview with light analytics ----------
function PlayerOverview() {
  const { db, appId, isLoading, userId, userProfile } = useAuth();
  const [stats, setStats] = useState({
    myPendingApplications: 0,
    availableTrials: 0,
    myNotifications: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoading || !db || !appId || !userId) return;

    const fetchStats = async () => {
      try {
        // Pending applications for this player
        const pendingRef = collection(
          db,
          `artifacts/${appId}/admin/data/pending_applications`
        );
        const pendingQuery = query(pendingRef, where('userId', '==', userId));
        const pendingSnap = await getDocs(pendingQuery);

        // All visible trials
        const trialsRef = collection(
          db,
          `artifacts/${appId}/public/data/trials`
        );
        const trialsSnap = await getDocs(trialsRef);

        // Notifications for this player (or broadcast)
        const notifRef = collection(
          db,
          `artifacts/${appId}/public/data/notifications`
        );
        const notifSnap = await getDocs(notifRef);
        let notifCount = 0;
        notifSnap.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            (data.targetRole === 'player' || data.targetRole === 'all') &&
            (!data.targetUserId || data.targetUserId === userId)
          ) {
            notifCount += 1;
          }
        });

        setStats({
          myPendingApplications: pendingSnap.size,
          availableTrials: trialsSnap.size,
          myNotifications: notifCount,
        });
      } catch (err) {
        console.error('Player overview stats error:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [db, appId, isLoading, userId]);

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
        Welcome to Sportify{userProfile?.name ? `, ${userProfile.name.split(' ')[0]}!` : '!'}
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
        <PlayerStatCard
          title="My Pending Applications"
          value={loadingStats ? '—' : stats.myPendingApplications}
          icon={<CheckSquare size={22} />}
          accent="var(--sportify-yellow, #FFC501)"
        />
        <PlayerStatCard
          title="Available Trials"
          value={loadingStats ? '—' : stats.availableTrials}
          icon={<Calendar size={22} />}
          accent="#38bdf8"
        />
        <PlayerStatCard
          title="Notifications"
          value={loadingStats ? '—' : stats.myNotifications}
          icon={<Bell size={22} />}
          accent="var(--sportify-red, #BC0E4C)"
        />
      </div>
    </div>
  );
}

// Small stat card for player dashboard
function PlayerStatCard({ title, value, icon, accent }) {
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

// --- Define navigation items for the Player sidebar ---
const PLAYER_NAV_ITEMS = [
  { key: 'overview', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
  { key: 'profile', label: 'Manage Profile', icon: <User size={18} /> },
  { key: 'apply', label: 'Apply for Trial', icon: <CheckSquare size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

export default function PlayerDashboard() {
  const [activeFeature, setActiveFeature] = useState('overview');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  // --- renderContent ---
  const renderContent = () => {
    switch (activeFeature) {
      case 'profile':
        return <PlayerProfile />;
      case 'apply':
        return <TrialApplication />;
      case 'notifications':
        return <PlayerNotifications />;
      case 'overview':
      default:
        return <PlayerOverview />;
    }
  };

  const currentTitle =
    PLAYER_NAV_ITEMS.find((item) => item.key === activeFeature)?.label ||
    'Player Dashboard';

  return (
    <DashboardLayout
      title={currentTitle}
      navItems={PLAYER_NAV_ITEMS}
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
