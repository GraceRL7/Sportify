import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ApproveRegistrations from '../components/ApproveRegistrations';
import GenerateReports from '../components/GenerateReports';
import ManageTrials from '../components/ManageTrials'; 

// Import Firebase dependencies for AdminOverview component
import { 
    initializeApp,
    getApps,
    getApp
} from 'firebase/app';
import {
    getFirestore,
    collection,
    query,
    where,
    onSnapshot
} from 'firebase/firestore';

// --- Firebase Configuration copied from AdminLogin.jsx for standalone use ---
const firebaseConfig = {
    apiKey: "AIzaSyAzkQJo_aAcs1jvj4VOgzFksINuur9uvb8",
    authDomain: "sportify-df84b.firebaseapp.com",
    projectId: "sportify-df84b",
    storageBucket: "sportify-df84b.firebasestorage.app",
    messagingSenderId: "125792303495",
    appId: "1:125792303495:web:8944023fee1e655eee7b22",
    measurementId: "G-ZBMG376GBS"
};
const appName = 'sportify'; 
const app = getApps().some(a => a.name === appName) ? getApp(appName) : initializeApp(firebaseConfig, appName);
const db = getFirestore(app);
const FIREBASE_APP_ID = firebaseConfig.appId;

// --- PATH FIX: Using valid 3-segment path structure ---
const PENDING_APPLICATIONS_COLLECTION = `admin_data/${FIREBASE_APP_ID}/pending_applications`;
const COACHES_COLLECTION = 'coaches'; 


// Icons 
const ICON_DASHBOARD = '📊';
const ICON_APPROVE = '✔️';
const ICON_REPORTS = '📑';
const ICON_TRIALS = '🗓️';

// Define the navigation items for the sidebar
const ADMIN_NAV_ITEMS = [
    { key: 'overview', label: 'Admin Overview', icon: ICON_DASHBOARD },
    { key: 'approve', label: 'Approve Registrations', icon: ICON_APPROVE },
    { key: 'manageTrials', label: 'Manage Trials', icon: ICON_TRIALS }, 
    { key: 'reports', label: 'System Reports', icon: ICON_REPORTS },
];


// --- STYLING CONSTANTS FOR THE NEW CARD LAYOUT ---
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


// --- UPDATED: AdminOverview component now fetches live data and uses Cards ---
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

    return (
        <DashboardLayout 
            title={currentTitle} 
            navItems={ADMIN_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
        >
            {renderContent()}
        </DashboardLayout>
    );
}