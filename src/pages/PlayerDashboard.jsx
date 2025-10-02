import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Components (src/pages -> src/components/)
import DashboardLayout from '../components/DashboardLayout'; 
import PlayerProfile from '../components/PlayerProfile'; // Based on file structure image
import TrialApplication from '../components/TrialApplication'; // Based on file structure image
import PlayerSchedule from '../components/PlayerSchedule'; // Based on file structure image
import TrialResults from '../components/TrialResults'; // Based on file structure image

// Context (src/pages -> src/context/)
import { useAuth } from '../context/AuthContext'; 

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

// Define navigation items for the Player sidebar
const PLAYER_NAV_ITEMS = [
    { key: 'overview', label: 'My Dashboard', icon: '⚽' },
    { key: 'profile', label: 'Manage Profile', icon: '👤' },
    { key: 'apply', label: 'Apply for Trial', icon: '📝' },
    { key: 'schedule', label: 'View Schedule', icon: '🗓️' },
    { key: 'results', label: 'View Results', icon: '📈' },
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
            console.error("Logout failed:", error);
            navigate('/'); 
        }
    };

    const renderContent = () => {
        // Render content based on selected feature
        switch (activeFeature) {
            case 'profile':
                return <PlayerProfile />;
            case 'apply':
                return <TrialApplication />;
            case 'schedule':
                return <PlayerSchedule />;
            case 'results':
                return <TrialResults />;
            case 'overview':
            default:
                return <PlayerOverview />; 
        }
    };

    const currentTitle = PLAYER_NAV_ITEMS.find(item => item.key === activeFeature)?.label || 'Player Dashboard';

    const LogoutButton = (
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <button 
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#0072ff', // Blue logout button for Player
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
            navItems={PLAYER_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
            sidebarFooter={LogoutButton} 
        >
            {renderContent()}
        </DashboardLayout>
    );
}
