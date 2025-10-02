import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Components (src/pages -> src/components/)
import DashboardLayout from '../components/DashboardLayout'; 
import ApproveRegistrations from '../components/ApproveRegistrations'; 
import GenerateReports from '../components/GenerateReports'; 
import ManageTrials from '../components/ManageTrials'; // Assumed to handle schedules

// Path for AuthContext confirmed: src/pages -> src/context/AuthContext
import { useAuth } from '../context/AuthContext'; 

// Path for Firebase confirmed: src/pages -> src/firebase
import { 
    db, // Use the shared db instance
    appId as FIREBASE_APP_ID // Use the shared appId
} from '../firebase'; 

import {
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore'; 

// Icons 
const ICON_DASHBOARD = '📊';
const ICON_APPROVE = '✔️';
const ICON_REPORTS = '📑';
const ICON_TRIALS = '🗓️';

// Define the navigation items for the sidebar
const ADMIN_NAV_ITEMS = [
    { key: 'overview', label: 'Admin Overview', icon: ICON_DASHBOARD },
    { key: 'approve', label: 'Approve Registrations', icon: ICON_APPROVE },
    { key: 'manageTrials', label: 'Manage Trials/Schedules', icon: ICON_TRIALS }, 
    { key: 'reports', label: 'System Reports', icon: ICON_REPORTS },
];

const PENDING_APPLICATIONS_COLLECTION = `admin_data/${FIREBASE_APP_ID}/pending_applications`;
const COACHES_COLLECTION = 'coaches'; 

// --- STYLING CONSTANTS (No Change) ---
const cardGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginTop: '30px',
    marginBottom: '30px',
};

const cardStyle = (color) => ({
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
    borderLeft: `5px solid ${color}`,
    transition: 'transform 0.2s',
});

const cardTitleStyle = {
    margin: '0 0 5px 0',
    fontSize: '0.9em',
    color: '#6c757d',
    fontWeight: '600',
    textTransform: 'uppercase',
};

const cardValueStyle = {
    margin: '0',
    fontSize: '2.5em',
    fontWeight: '700',
    color: '#343a40',
};

const Card = ({ title, value, color }) => (
    <div style={cardStyle(color)}>
        <p style={cardTitleStyle}>{title}</p>
        <p style={{ ...cardValueStyle, color }}>{value}</p>
    </div>
);
// --- END STYLING CONSTANTS ---


const AdminOverview = () => {
    const [stats, setStats] = useState({ 
        pendingApps: '...', 
        activeCoaches: '...',
        upcomingTrials: '...',
        unassignedPlayers: 'N/A' 
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeApps;
        let unsubscribeCoaches;
        let unsubscribeTrials;

        setLoading(true);

        // 1. Get Pending Applications Count (Real-time listener)
        const appsRef = collection(db, PENDING_APPLICATIONS_COLLECTION);
        const pendingQuery = query(appsRef, where("status", "==", "Pending Review"));

        unsubscribeApps = onSnapshot(pendingQuery, (snapshot) => {
            setStats(prev => ({ ...prev, pendingApps: snapshot.size }));
        }, (error) => { console.error("Error fetching pending count:", error); });

        // 2. Get Active Coaches Count (Real-time listener)
        const coachesRef = collection(db, COACHES_COLLECTION);
        unsubscribeCoaches = onSnapshot(coachesRef, (snapshot) => {
            setStats(prev => ({ ...prev, activeCoaches: snapshot.size }));
        }, (error) => { console.error("Error fetching coaches count:", error); });
        
        // 3. Get Upcoming Trials Count (Real-time listener)
        const trialsRef = collection(db, `admin_data/${FIREBASE_APP_ID}/trials`);
        unsubscribeTrials = onSnapshot(trialsRef, (snapshot) => {
            setStats(prev => ({ ...prev, upcomingTrials: snapshot.size }));
            setLoading(false); // Set loading to false once all listeners are initialized
        }, (error) => { console.error("Error fetching trials count:", error); });


        return () => {
            if (unsubscribeApps) unsubscribeApps();
            if (unsubscribeCoaches) unsubscribeCoaches();
            if (unsubscribeTrials) unsubscribeTrials();
        };
    }, []);

    return (
        <div style={{ padding: '0 20px' }}>
            <p style={{ fontSize: '1.1em', color: '#555' }}>
                Welcome to the Sportify Admin Panel. Use the navigation to manage user approvals, schedule trials, and generate reports.
            </p>

            <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginTop: '30px', color: '#343a40' }}>
                Live System Metrics
            </h3>

            <div style={cardGridStyle}>
                
                <Card 
                    title="Pending Approvals" 
                    value={stats.pendingApps} 
                    color="#dc3545" // Red for urgent action
                />
                
                <Card 
                    title="Active Coaches" 
                    value={stats.activeCoaches} 
                    color="#28a745" // Green for active resources
                />
                
                <Card 
                    title="Upcoming Trials" 
                    value={stats.upcomingTrials} 
                    color="#ffc107" // Yellow/Orange for planning
                />
                
                <Card 
                    title="Unassigned Players" 
                    value={stats.unassignedPlayers} 
                    color="#007bff" // Blue for information
                />
            </div>
        </div>
    );
};


export default function AdminDashboard() {
    const [activeFeature, setActiveFeature] = useState('overview');
    const navigate = useNavigate();
    
    // 1. Retrieve the logout function from AuthContext
    const { logout } = useAuth(); 

    // 2. Define the local handler for logout and redirection
    const handleLogout = async () => {
        try {
            await logout(); // Call the central Firebase sign-out
            navigate('/'); // Redirect to the main login selector page
        } catch (error) {
            console.error("Logout failed:", error);
            navigate('/'); 
        }
    };

    const renderContent = () => {
        switch (activeFeature) {
            case 'approve':
                return <ApproveRegistrations />;
            case 'manageTrials': 
                return <ManageTrials />;
            case 'reports':
                return <GenerateReports />;
            case 'overview':
            default:
                return <AdminOverview />;
        }
    };

    const currentTitle = ADMIN_NAV_ITEMS.find(item => item.key === activeFeature)?.label || 'Admin Dashboard';

    // 3. Define the Logout Button JSX (This renders the button itself)
    const LogoutButton = (
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <button 
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#dc3545', // Admin theme color (Red for critical action)
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                }}
            >
                🚪 Logout
            </button>
        </div>
    );

    return (
        <DashboardLayout 
            title={currentTitle} 
            navItems={ADMIN_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
            // 4. Pass the Logout Button JSX to the DashboardLayout sidebar footer
            sidebarFooter={LogoutButton} 
        >
            {renderContent()}
        </DashboardLayout>
    );
}
