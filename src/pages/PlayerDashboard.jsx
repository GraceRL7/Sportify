import React, { useState } from 'react'; // <-- This line was fixed
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, User, CheckSquare, Calendar } from 'lucide-react'; // Added icons

// Components (src/pages -> src/components/)
import DashboardLayout from '../components/DashboardLayout'; 
import PlayerProfile from '../components/PlayerProfile'; // Based on file structure image
import TrialApplication from '../components/TrialApplication'; // This is the file we are rebuilding
import PlayerSchedule from '../components/PlayerSchedule'; 

// Context (src/pages -> src/context/)
import { useAuth } from '../context/AuthContext'; 
import styles from '../components/DashboardLayout.module.css'; // Import layout styles

// Placeholder component for Player-specific content
const PlayerOverview = () => (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ color: '#0072ff', borderBottom: '2px solid #0072ff', paddingBottom: '10px' }}>
            Welcome, Player!
        </h2>
        <p style={{ fontSize: '1.1em', color: '#555', marginTop: '20px' }}>
            This is your personal Player Dashboard. Here you can view your schedule, track your performance stats, and manage your profile.
        </p>
        <div style={{ marginTop: '30px', padding: '25px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#e0f7fa' }}>
            <h3 style={{ color: '#20143b' }}>Quick Stats</h3>
            <p><strong>Next Practice:</strong> Tuesday, 5:00 PM (Football Field A)</p>
            <p><strong>Recent Evaluation Score:</strong> 8.5/10</p>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '15px' }}>
                *Note: Connect to Firestore to load real player data here.*
            </p>
        </div>
    </div>
);

// --- Define navigation items for the Player sidebar ---
const PLAYER_NAV_ITEMS = [
    { key: 'overview', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'profile', label: 'Manage Profile', icon: <User size={18} /> },
    { key: 'apply', label: 'Apply for Trial', icon: <CheckSquare size={18} /> },
    { key: 'schedule', label: 'View Schedule', icon: <Calendar size={18} /> },
];


export default function PlayerDashboard() {
    const [activeFeature, setActiveFeature] = useState('overview');
    const navigate = useNavigate();
    const { logout } = useAuth(); // Get logout function from context

    const handleLogout = async () => {
        try {
            await logout(); 
            navigate('/');
        } catch (error) {
            console.error("Logout failed:", error);
            navigate('/'); 
        }
    };

    // --- renderContent ---
    const renderContent = () => {
        // Render content based on selected feature
        switch (activeFeature) {
            case 'profile':
                return <PlayerProfile />;
            case 'apply':
                return <TrialApplication />; // This will now show the new component
            case 'schedule':
                return <PlayerSchedule />;
            case 'overview':
            default:
                return <PlayerOverview />; 
        }
    };

    const currentTitle = PLAYER_NAV_ITEMS.find(item => item.key === activeFeature)?.label || 'Player Dashboard';

    // This dashboard uses the same layout but passes its own logout handler
    return (
        <DashboardLayout 
            title={currentTitle} 
            navItems={PLAYER_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
            onLogout={handleLogout} // <-- Pass the logout function to the layout
        >
            {/* We must also override the sidebar header and logout button colors 
                to match the player theme (Blue/Teal) instead of the admin theme (Yellow/Red)
            */}
            <style>
                {`
                    .${styles.sidebarHeader} {
                        color: #30D5C8; /* Teal */
                    }
                    .${styles.activeNavItem} {
                        background-color: #0072ff; /* Blue */
                        border-left: 5px solid #30D5C8;
                    }
                    .${styles.logoutButton} {
                        background-color: #0072ff; /* Blue */
                    }
                    .${styles.logoutButton}:hover {
                        background-color: #005bb7;
                    }
                `}
            </style>
            {renderContent()}
        </DashboardLayout>
    );
}