import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Icons from lucide-react (Consolidated)
import { 
    LayoutDashboard, CheckCircle, CalendarDays, 
    FileBarChart, UserCheck 
} from "lucide-react"; // LogOut icon is no longer needed here

// Components
import DashboardLayout from '../components/DashboardLayout';
import ApproveRegistrations from '../components/ApproveRegistrations';
import GenerateReports from '../components/GenerateReports';
import ManageTrials from '../components/ManageTrials';
import AssignCoaches from '../components/AssignCoaches'; 

// Context
import { useAuth } from '../context/AuthContext';

// Firebase
import { db, appId as FIREBASE_APP_ID } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

// --- Sidebar Navigation (Defined ONCE) ---
const ADMIN_NAV_ITEMS = [
  { key: 'overview', label: 'Admin Overview', icon: <LayoutDashboard size={18} /> },
  { key: 'approve', label: 'Approve Registrations', icon: <CheckCircle size={18} /> },
  { key: 'manageTrials', label: 'Manage Trials/Schedules', icon: <CalendarDays size={18} /> },
  { key: 'assign', label: 'Assign Coaches', icon: <UserCheck size={18} /> },
  { key: 'reports', label: 'System Reports', icon: <FileBarChart size={18} /> },
];

// --- Firestore Paths (CORRECTED) ---
const PENDING_APPLICATIONS_COLLECTION = `artifacts/${FIREBASE_APP_ID}/admin/data/pending_applications`;
const TRIALS_COLLECTION = `artifacts/${FIREBASE_APP_ID}/public/data/trials`;
const COACHES_COLLECTION = `artifacts/${FIREBASE_APP_ID}/public/data/users`; 

// --- Styling ---
const cardGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '20px',
  marginTop: '30px',
  marginBottom: '30px',
};
const cardStyle = (color) => ({
  padding: '25px',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  backgroundColor: '#fff',
  borderLeft: `6px solid ${color}`,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
});
const cardTitleStyle = {
  margin: '0 0 8px 0',
  fontSize: '0.9em',
  color: '#6c757d',
  fontWeight: '600',
  textTransform: 'uppercase',
};
const cardValueStyle = {
  margin: '0',
  fontSize: '2.4em',
  fontWeight: '700',
  color: '#343a40',
};

// --- Child Components ---
const Card = ({ title, value, color }) => (
  <div
    style={cardStyle(color)}
    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
  >
    <p style={cardTitleStyle}>{title}</p>
    <p style={{ ...cardValueStyle, color }}>{value}</p>
  </div>
);

const AdminOverview = () => {
  const { db } = useAuth(); // Get db from context
  const [stats, setStats] = useState({
    pendingApps: '...',
    activeCoaches: '...',
    upcomingTrials: '...',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // db check is important as it comes from context
    if (!db) { 
        setLoading(false);
        return;
    }

    let unsubscribeApps, unsubscribeCoaches, unsubscribeTrials;
    setLoading(true);

    const appsRef = collection(db, PENDING_APPLICATIONS_COLLECTION);
    const pendingQuery = query(appsRef, where('status', '==', 'Pending Review'));
    unsubscribeApps = onSnapshot(
      pendingQuery,
      (snapshot) => setStats((prev) => ({ ...prev, pendingApps: snapshot.size })),
      (error) => console.error('Error fetching pending count:', error)
    );

    const coachesRef = collection(db, COACHES_COLLECTION);
    const coachesQuery = query(coachesRef, where('role', '==', 'coach'));
    unsubscribeCoaches = onSnapshot(
      coachesQuery,
      (snapshot) => setStats((prev) => ({ ...prev, activeCoaches: snapshot.size })),
      (error) => console.error('Error fetching coaches count:', error)
    );

    const trialsRef = collection(db, TRIALS_COLLECTION);
    unsubscribeTrials = onSnapshot(
      trialsRef,
      (snapshot) => {
        setStats((prev) => ({ ...prev, upcomingTrials: snapshot.size }));
        setLoading(false); 
      },
      (error) => console.error('Error fetching trials count:', error)
    );

    return () => {
      if (unsubscribeApps) unsubscribeApps();
      if (unsubscribeCoaches) unsubscribeCoaches();
      if (unsubscribeTrials) unsubscribeTrials();
    };
  }, [db]); // Dependency array only needs db

  return (
    <div style={{ padding: '0 20px' }}>
      <p style={{ fontSize: '1.1em', color: '#555' }}>
        Welcome to the <strong>Sportify Admin Panel</strong>. Manage user approvals, schedule trials, and monitor live reports all in one place.
      </p>
      <h3
        style={{
          borderBottom: '2px solid #007bff',
          paddingBottom: '10px',
          marginTop: '30px',
          color: '#343a40',
        }}
      >
        Live System Metrics
      </h3>
      {loading ? (
        <p style={{ marginTop: '30px', fontSize: '1.1em', color: '#888' }}>Loading data...</p>
      ) : (
        <div style={cardGridStyle}>
          <Card title="Pending Approvals" value={stats.pendingApps} color="#dc3545" />
          <Card title="Active Coaches" value={stats.activeCoaches} color="#28a745" />
          <Card title="Upcoming Trials" value={stats.upcomingTrials} color="#ffc107" />
        </div>
      )}
    </div>
  );
};

// --- Main Component Function ---
export default function AdminDashboard() {
  const [activeFeature, setActiveFeature] = useState('overview');
  const navigate = useNavigate();
  const { logout } = useAuth(); // Get logout function from context

  // This function will be passed to the layout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error)
      {
      console.error('Logout failed:', error);
      navigate('/');
    }
  };

  const renderContent = () => {
    switch (activeFeature) {
      case 'approve':
        return <ApproveRegistrations />;
      case 'manageTrials':
        return <ManageTrials />;
      case 'assign': 
        return <AssignCoaches />;
      case 'reports':
        return <GenerateReports />;
      case 'overview':
      default:
        return <AdminOverview />;
    }
  };

  const currentTitle =
    ADMIN_NAV_ITEMS.find((item) => item.key === activeFeature)?.label || 'Admin Dashboard';

  // The local LogoutButton component is removed.

  return (
    <DashboardLayout
      title={currentTitle}
      navItems={ADMIN_NAV_ITEMS} 
      activeFeature={activeFeature}
      setActiveFeature={setActiveFeature}
      onLogout={handleLogout} // Pass the handleLogout function as a prop
    >
      {renderContent()}
    </DashboardLayout>
  );
}