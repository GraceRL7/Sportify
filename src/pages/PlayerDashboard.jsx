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

// ---------- Player Overview with analytics + detail panels ----------
function PlayerOverview() {
  const { db, appId, isLoading, userId, userProfile } = useAuth();

  const [stats, setStats] = useState({
    myPendingApplications: 0,
    availableTrials: 0,
    myNotifications: 0,
  });

  // store detail lists for each card
  const [details, setDetails] = useState({
    pending: [],
    trials: [],
    notifications: [],
  });

  // which card is expanded? 'pending' | 'trials' | 'notifications' | null
  const [detailView, setDetailView] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoading || !db || !appId || !userId) return;

    const fetchStats = async () => {
      try {
        // ----- Pending applications for this player -----
        const pendingRef = collection(
          db,
          `artifacts/${appId}/admin/data/pending_applications`
        );
        const pendingQuery = query(pendingRef, where('userId', '==', userId));
        const pendingSnap = await getDocs(pendingQuery);
        const pendingList = [];
        pendingSnap.forEach((docSnap) => {
          const data = docSnap.data() || {};
          pendingList.push({
            id: docSnap.id,
            trialName: data.trialName || data.sport || 'Trial',
            status: data.status || 'Pending',
            submissionDate: data.submissionDate || null,
          });
        });

        // ----- All visible trials -----
        const trialsRef = collection(
          db,
          `artifacts/${appId}/public/data/trials`
        );
        const trialsSnap = await getDocs(trialsRef);
        const trialsList = [];
        trialsSnap.forEach((docSnap) => {
          const data = docSnap.data() || {};
          trialsList.push({
            id: docSnap.id,
            sport: data.sport || 'Sport',
            date: data.date || '',
            location: data.location || '',
            coachName: data.coachName || '',
          });
        });

        // ----- Notifications for this player (or broadcast) -----
        const notifRef = collection(
          db,
          `artifacts/${appId}/public/data/notifications`
        );
        const notifSnap = await getDocs(notifRef);
        const notifList = [];
        let notifCount = 0;

        notifSnap.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const matchesRole =
            data.targetRole === 'player' || data.targetRole === 'all';
          const matchesUser =
            !data.targetUserId || data.targetUserId === userId;

          if (matchesRole && matchesUser) {
            notifCount += 1;
            notifList.push({
              id: docSnap.id,
              message: data.message || '',
              type: data.type || 'info',
              createdAt: data.createdAt || null,
              related: data.related || '',
            });
          }
        });

        setStats({
          myPendingApplications: pendingSnap.size,
          availableTrials: trialsSnap.size,
          myNotifications: notifCount,
        });

        setDetails({
          pending: pendingList,
          trials: trialsList,
          notifications: notifList,
        });
      } catch (err) {
        console.error('Player overview stats error:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [db, appId, isLoading, userId]);

  const toggleDetailView = (key) => {
    setDetailView((prev) => (prev === key ? null : key));
  };

  const formatDateTime = (value) => {
    if (!value) return '';
    try {
      if (typeof value.toDate === 'function') return value.toDate().toLocaleString();
      if (value instanceof Date) return value.toLocaleString();
      if (typeof value === 'string') return value;
    } catch {
      return '';
    }
    return '';
  };

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
        Welcome to Sportify
        {userProfile?.name ? `, ${userProfile.name.split(' ')[0]}!` : '!'}
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
          onClick={() => toggleDetailView('pending')}
          active={detailView === 'pending'}
        />
        <PlayerStatCard
          title="Available Trials"
          value={loadingStats ? '—' : stats.availableTrials}
          icon={<Calendar size={22} />}
          accent="#38bdf8"
          onClick={() => toggleDetailView('trials')}
          active={detailView === 'trials'}
        />
        <PlayerStatCard
          title="Notifications"
          value={loadingStats ? '—' : stats.myNotifications}
          icon={<Bell size={22} />}
          accent="var(--sportify-red, #BC0E4C)"
          onClick={() => toggleDetailView('notifications')}
          active={detailView === 'notifications'}
        />
      </div>

      {/* Detail view under the cards */}
      {detailView === 'pending' && (
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ marginBottom: '10px', color: '#0f172a' }}>
            My Pending Applications
          </h3>
          {details.pending.length === 0 ? (
            <p style={{ color: '#6b7280' }}>
              You don’t have any pending applications right now.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {details.pending.map((app) => (
                <li
                  key={app.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    marginBottom: '8px',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.9rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{app.trialName}</div>
                    <div style={{ color: '#6b7280' }}>
                      Submitted: {formatDateTime(app.submissionDate)}
                    </div>
                  </div>
                  <span
                    style={{
                      alignSelf: 'center',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: 'rgba(234,179,8,0.12)',
                      color: '#92400e',
                      textTransform: 'uppercase',
                    }}
                  >
                    {app.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {detailView === 'trials' && (
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ marginBottom: '10px', color: '#0f172a' }}>
            Available Trials
          </h3>
          {details.trials.length === 0 ? (
            <p style={{ color: '#6b7280' }}>
              No trials are currently scheduled. Please check again later.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {details.trials.map((trial) => (
                <li
                  key={trial.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    marginBottom: '8px',
                    boxShadow: '0 2px 6px rgba(15,23,42,0.04)',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#111827' }}>
                    {trial.sport}
                  </div>
                  <div style={{ color: '#6b7280' }}>
                    Date: {trial.date || 'TBA'} | Location:{' '}
                    {trial.location || 'TBA'}
                  </div>
                  {trial.coachName && (
                    <div style={{ color: '#6b7280' }}>
                      Coach: {trial.coachName}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {detailView === 'notifications' && (
        <div style={{ marginTop: '28px' }}>
          <h3 style={{ marginBottom: '10px', color: '#0f172a' }}>
            Recent Notifications
          </h3>
          {details.notifications.length === 0 ? (
            <p style={{ color: '#6b7280' }}>
              No notifications yet. You’ll see updates here when something
              changes.
            </p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {details.notifications.map((n) => (
                <li
                  key={n.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '14px',
                    marginBottom: '8px',
                    backgroundColor:
                      n.type === 'success'
                        ? '#ecfdf3'
                        : n.type === 'error'
                        ? '#fef2f2'
                        : '#eff6ff',
                    fontSize: '0.9rem',
                  }}
                >
                  <div style={{ fontWeight: 500 }}>{n.message}</div>
                  {n.related && (
                    <div style={{ color: '#4b5563', marginTop: '2px' }}>
                      {n.related}
                    </div>
                  )}
                  <div
                    style={{
                      color: '#9ca3af',
                      fontSize: '0.75rem',
                      marginTop: '4px',
                    }}
                  >
                    {formatDateTime(n.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Small stat card for player dashboard
function PlayerStatCard({ title, value, icon, accent, onClick, active }) {
  return (
    <div
      onClick={onClick}
      role="button"
      style={{
        borderRadius: '14px',
        backgroundColor: '#ffffff',
        padding: '18px 18px',
        boxShadow: '0 10px 20px rgba(15,23,42,0.06)',
        borderTop: `4px solid ${accent}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        transform: active ? 'translateY(-3px)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
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
