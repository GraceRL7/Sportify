import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout'; // 🎯 FIX: Assuming components/ is sibling to pages/
import { useAuth } from '../context/AuthContext'; // 🎯 FIX: Assuming context/ is sibling to pages/

// Define navigation items for the Coach sidebar
const COACH_NAV_ITEMS = [
    { key: 'overview', label: 'Coach Overview', icon: '匠' },
    // Add other navigation items here
];

// --- Placeholder Content Components ---
const CoachOverview = () => (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
        <h2 style={{ color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
            Welcome, Coach!
        </h2>
        <p style={{ fontSize: '1.1em', color: '#555', marginTop: '20px' }}>
            Welcome to your **Sportify Coach Panel**. Use the sidebar to access your assigned players, manage evaluations, and view team schedules.
        </p>
        <div style={{ marginTop: '30px', padding: '25px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#e9f7ff' }}>
            <h3 style={{ color: '#20143b' }}>Quick Access</h3>
            <p><strong>Assigned Players:</strong> 12 (View Roster)</p>
            <p><strong>Pending Evaluations:</strong> 3 (Complete Now)</p>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '15px' }}>
                *Note: Feature modules need to be implemented.*
            </p>
        </div>
    </div>
);

const PlaceholderFeature = ({ featureName }) => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: '#007bff' }}>{featureName} Feature</h2>
        <p>This content area is ready for the **{featureName}** component.</p>
    </div>
);
// --- End Placeholder Components ---


export default function CoachDashboard() {
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
            console.error("Coach Logout failed:", error);
            navigate('/'); 
        }
    };

    const renderContent = () => {
        switch(activeFeature) {
            case 'overview':
                return <CoachOverview />;
            default:
                return <PlaceholderFeature featureName={`Feature: ${activeFeature}`} />; 
        }
    };

    const currentTitle = COACH_NAV_ITEMS.find(item => item.key === activeFeature)?.label || 'Coach Dashboard';

    // 3. Define the Logout Button JSX (This renders the button itself)
    const LogoutButton = (
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <button 
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#28a745', // Coach theme color
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
            navItems={COACH_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
            // 4. Pass the Logout Button JSX to the DashboardLayout sidebar footer
            sidebarFooter={LogoutButton} 
        >
            {renderContent()}
        </DashboardLayout>
    );
}
