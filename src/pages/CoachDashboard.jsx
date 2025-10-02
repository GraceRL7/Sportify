import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
// Import mock/placeholder components for coach features
// Uncomment these when you create the actual files:
// import ViewRoster from './ViewRoster'; 
// import PlayerEvaluations from './PlayerEvaluations'; 
// import Schedule from './Schedule';
// import Players from './Players';

// Define navigation items for the Coach sidebar
const COACH_NAV_ITEMS = [
    { key: 'overview', label: 'Coach Overview', icon: '匠' },
    // Uncomment these to enable them in the sidebar:
    // { key: 'roster', label: 'My Roster', icon: '則' },
    // { key: 'evaluations', label: 'Player Evaluations', icon: '統' },
    // { key: 'schedule', label: 'Team Schedule', icon: '欄ｸ },
    // { key: 'players', label: 'Manage Players', icon: '則' },
];

// --- Placeholder Content Components ---
const CoachOverview = () => (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
        <p style={{ fontSize: '1.1em', color: '#555' }}>
            Welcome to your **Sportify Coach Panel**. Use the sidebar to access your assigned players, manage evaluations, and view team schedules.
        </p>
        <div style={{ marginTop: '30px', padding: '25px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f0f0f0' }}>
            <h3 style={{ color: '#28a745' }}>Quick Access</h3>
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
    // Start on the overview screen
    const [activeFeature, setActiveFeature] = useState('overview');

    const renderContent = () => {
        // CLEANED AND CORRECTED SWITCH LOGIC
        switch(activeFeature) {
            case 'overview':
                return <CoachOverview />;
            // Uncomment and replace PlaceholderFeature with your actual component
            // case 'roster':
            //     return <ViewRoster />; 
            // case 'evaluations':
            //     return <PlayerEvaluations />; 
            // case 'schedule':
            //     return <Schedule />;
            // case 'players':
            //     return <Players />;
            default:
                // Handles any key not explicitly defined above
                return <PlaceholderFeature featureName={`Feature: ${activeFeature}`} />; 
        }
    };

    // Find the title for the layout
    const currentTitle = COACH_NAV_ITEMS.find(item => item.key === activeFeature)?.label || 'Coach Dashboard';

    return (
        <DashboardLayout 
            title={currentTitle} 
            navItems={COACH_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
        >
            {renderContent()}
        </DashboardLayout>
    );
}