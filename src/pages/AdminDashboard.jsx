// C:\sportify\src\pages\AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCog,
  Users,
  FileChartColumn,
  Bell,
  Trophy,
  UserCheck,
  UserPlus,
} from 'lucide-react';

import DashboardLayout from '../components/DashboardLayout';
import ApproveRegistrations from '../components/ApproveRegistrations';
import ManageTrials from '../components/ManageTrials';
import ManageSchedules from '../components/ManageSchedules';
import AssignCoaches from '../components/AssignCoaches';
import GenerateReports from '../components/GenerateReports';
import AdminNotifications from '../components/AdminNotifications';

import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, where } from '../firebase';

// ---------- Admin Overview with analytics + registration history ----------
function AdminOverview() {
  const { db, appId, isLoading } = useAuth();
  const [stats, setStats] = useState({
    pendingApplications: 0,
    approvedPlayers: 0,
    activeCoaches: 0,
    upcomingTrials: 0,
    totalApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
  });
  const [allApplications, setAllApplications] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (isLoading || !db || !appId) return;

    const fetchStats = async () => {
      try {
        // ---- All applications (any status) ----
        const applicationsRef = collection(
          db,
          `artifacts/${appId}/admin/data/pending_applications`
        );
        const applicationsSnap = await getDocs(applicationsRef);

        let total = 0;
        let pending = 0;
        let approvedApp = 0;
        let rejectedApp = 0;
        const all = [];

        applicationsSnap.forEach((docSnap) => {
          const data = docSnap.data() || {};
          const statusRaw = data.status || 'Pending';
          const status =
            statusRaw === 'Pending Review' ? 'Pending' : statusRaw;

          total += 1;
          if (status === 'Approved') approvedApp += 1;
          else if (status === 'Rejected') rejectedApp += 1;
          else pending += 1;

          all.push({
            id: docSnap.id,
            ...data,
            status,
          });
        });

        // ---- Approved players from roster ----
        const rosterRef = collection(
          db,
          `artifacts/${appId}/public/data/roster`
        );
        const rosterQuery = query(rosterRef, where('status', '==', 'Approved'));
        const rosterSnap = await getDocs(rosterQuery);

        // ---- Coaches ----
        const coachesRef = collection(
          db,
          `artifacts/${appId}/public/data/coaches`
        );
        const coachesSnap = await getDocs(coachesRef);

        // ---- Trials ----
        const trialsRef = collection(
          db,
          `artifacts/${appId}/public/data/trials`
        );
        const trialsSnap = await getDocs(trialsRef);

        setStats({
          pendingApplications: pending,
          approvedPlayers: rosterSnap.size,
          activeCoaches: coachesSnap.size,
          upcomingTrials: trialsSnap.size,
          totalApplications: total,
          approvedApplications: approvedApp,
          rejectedApplications: rejectedApp,
        });

        // Sort latest first by submissionDate if present
        const sorted = [...all].sort((a, b) => {
          const da = a.submissionDate?.toDate
            ? a.submissionDate.toDate()
            : a.submissionDate
            ? new Date(a.submissionDate)
            : 0;
          const dbb = b.submissionDate?.toDate
            ? b.submissionDate.toDate()
            : b.submissionDate
            ? new Date(b.submissionDate)
            : 0;
          return dbb - da;
        });

        setAllApplications(sorted);
      } catch (err) {
        console.error('Error loading admin overview stats:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [db, appId, isLoading]);

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <h2
        style={{
          color: 'var(--sportify-royal, var(--sportify-navy))',
          borderBottom: '2px solid var(--sportify-yellow)',
          paddingBottom: '10px',
          margin: 0,
        }}
      >
        Welcome, Admin!
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
        <StatCard
          title="Pending Applications"
          value={loadingStats ? '—' : stats.pendingApplications}
          icon={<UserPlus size={22} />}
          accent="var(--sportify-yellow, #FFC501)"
        />
        <StatCard
          title="Approved Players"
          value={loadingStats ? '—' : stats.approvedPlayers}
          icon={<Trophy size={22} />}
          accent="#22c55e"
        />
        <StatCard
          title="Active Coaches"
          value={loadingStats ? '—' : stats.activeCoaches}
          icon={<UserCheck size={22} />}
          accent="#38bdf8"
        />
        <StatCard
          title="Upcoming Trials"
          value={loadingStats ? '—' : stats.upcomingTrials}
          icon={<CalendarCog size={22} />}
          accent="var(--sportify-red, #BC0E4C)"
        />
      </div>

      {/* Registration Overview (all requests & status counts) */}
      <div
        style={{
          marginTop: '32px',
          padding: '18px 18px',
          borderRadius: '14px',
          backgroundColor: '#ffffff',
          boxShadow: '0 10px 20px rgba(15,23,42,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '10px',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: '1rem',
              color: '#111827',
            }}
          >
            Registration Overview
          </h3>

          {/* Small status summary chips */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              fontSize: '0.8rem',
            }}
          >
            <StatusChip
              label="Total"
              value={loadingStats ? '—' : stats.totalApplications}
              color="#4b5563"
            />
            <StatusChip
              label="Pending"
              value={loadingStats ? '—' : stats.pendingApplications}
              color="#f59e0b"
            />
            <StatusChip
              label="Approved"
              value={loadingStats ? '—' : stats.approvedApplications}
              color="#16a34a"
            />
            <StatusChip
              label="Rejected"
              value={loadingStats ? '—' : stats.rejectedApplications}
              color="#dc2626"
            />
          </div>
        </div>

        {allApplications.length === 0 ? (
          <div
            style={{
              fontSize: '0.9rem',
              color: '#6b7280',
              paddingTop: '6px',
            }}
          >
            No registration requests have been submitted yet.
          </div>
        ) : (
          <div
            style={{
              marginTop: '8px',
              overflowX: 'auto',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.85rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: 'left',
                    borderBottom: '1px solid #e5e7eb',
                    color: '#6b7280',
                  }}
                >
                  <th style={{ padding: '8px 4px' }}>Player</th>
                  <th style={{ padding: '8px 4px' }}>Email</th>
                  <th style={{ padding: '8px 4px' }}>Sport / Trial</th>
                  <th style={{ padding: '8px 4px' }}>Submitted On</th>
                  <th style={{ padding: '8px 4px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {allApplications.map((app) => {
                  const submittedAt = app.submissionDate?.toDate
                    ? app.submissionDate.toDate()
                    : app.submissionDate
                    ? new Date(app.submissionDate)
                    : null;

                  const dateString = submittedAt
                    ? submittedAt.toLocaleDateString()
                    : '-';

                  return (
                    <tr
                      key={app.id}
                      style={{ borderBottom: '1px solid #f3f4f6' }}
                    >
                      <td style={{ padding: '8px 4px', color: '#111827' }}>
                        {app.fullName || app.name || '—'}
                      </td>
                      <td style={{ padding: '8px 4px', color: '#4b5563' }}>
                        {app.email || '—'}
                      </td>
                      <td style={{ padding: '8px 4px', color: '#4b5563' }}>
                        {app.trialName ||
                          app.sport ||
                          app.primarySport ||
                          '—'}
                      </td>
                      <td style={{ padding: '8px 4px', color: '#6b7280' }}>
                        {dateString}
                      </td>
                      <td style={{ padding: '8px 4px' }}>
                        <StatusPill status={app.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// KPI stat cards
function StatCard({ title, value, icon, accent }) {
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

// Small chips for status counts
function StatusChip({ label, value, color }) {
  return (
    <div
      style={{
        padding: '4px 10px',
        borderRadius: '999px',
        border: `1px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span style={{ fontSize: '0.75rem', color }}>{label}</span>
      <span
        style={{
          fontSize: '0.8rem',
          fontWeight: 600,
          color: '#111827',
        }}
      >
        {value}
      </span>
    </div>
  );
}

// Pill for row status
function StatusPill({ status }) {
  let bg = '#e5e7eb';
  let text = '#374151';

  if (status === 'Approved') {
    bg = '#dcfce7';
    text = '#166534';
  } else if (status === 'Rejected') {
    bg = '#fee2e2';
    text = '#b91c1c';
  } else if (status === 'Pending') {
    bg = '#fef3c7';
    text = '#92400e';
  }

  return (
    <span
      style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '4px 10px',
        borderRadius: '999px',
        backgroundColor: bg,
        color: text,
      }}
    >
      {status}
    </span>
  );
}

// ---------- Navigation config (Approve Registrations removed from sidebar) ----------
const ADMIN_NAV_ITEMS = [
  { key: 'overview', label: 'Admin Overview', icon: <LayoutDashboard size={18} /> },
  { key: 'trials', label: 'Manage Trials', icon: <CalendarCog size={18} /> },
  { key: 'schedules', label: 'Manage Schedules', icon: <CalendarCog size={18} /> },
  { key: 'coaches', label: 'Assign Coaches', icon: <Users size={18} /> },
  { key: 'reports', label: 'System Reports', icon: <FileChartColumn size={18} /> },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
];

export default function AdminDashboard() {
  const [activeFeature, setActiveFeature] = useState('overview');
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/');
    }
  };

  const renderContent = () => {
    switch (activeFeature) {
      // still keep the screen available internally if ever needed
      case 'approve':
        return <ApproveRegistrations />;
      case 'trials':
        return <ManageTrials />;
      case 'schedules':
        return <ManageSchedules />;
      case 'coaches':
        return <AssignCoaches />;
      case 'reports':
        return <GenerateReports />;
      case 'notifications':
        return <AdminNotifications />;
      case 'overview':
      default:
        return <AdminOverview />;
    }
  };

  if (userRole && userRole !== 'admin') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        Access Denied: You must be an administrator to view this page.
      </div>
    );
  }

  const currentTitle =
    ADMIN_NAV_ITEMS.find((item) => item.key === activeFeature)?.label ||
    'Admin Dashboard';

  return (
    <DashboardLayout
      title={currentTitle}
      navItems={ADMIN_NAV_ITEMS}
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      onLogout={handleLogout}
    >
      {renderContent()}
    </DashboardLayout>
  );
}
