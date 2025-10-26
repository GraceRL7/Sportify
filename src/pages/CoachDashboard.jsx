// C:\sportify\src\pages\CoachDashboard.jsx (Firebase Connected)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout'; 
import { useAuth } from '../context/AuthContext'; 
import { db, collection, query, where, onSnapshot } from '../firebase'; // Import Firestore tools
import { LogOut, List, Edit, Calendar, Upload } from 'lucide-react'; // Import icons

// Imports for Coach-specific features
import PlayerList from '../components/PlayerList'; 
import PlayerEvaluation from '../components/PlayerEvaluation'; 
import PlayerSchedule from '../components/PlayerSchedule'; 
import UploadTrialResults from '../components/UploadTrialResults'; 

// Define navigation items for the Coach sidebar
const COACH_NAV_ITEMS = [
    { key: 'overview', label: 'Coach Overview', icon: <List size={18} /> },
    { key: 'roster', label: 'Player List', icon: <List size={18} /> },
    { key: 'evaluate', label: 'Evaluate Players', icon: <Edit size={18} /> },
    { key: 'schedule', label: 'View Schedule', icon: <Calendar size={18} /> },
    { key: 'upload', label: 'Upload Results', icon: <Upload size={18} /> },
];

// --- NEW: Dynamic CoachOverview Component ---
const CoachOverview = () => {
    const { userProfile, isLoading, db, appId } = useAuth(); // Get profile and db from context
    const [playerCount, setPlayerCount] = useState('...');
    const [assignedSport, setAssignedSport] = useState('Unassigned');

    useEffect(() => {
        if (isLoading || !userProfile || !db) return;

        // 1. Set the coach's assigned sport from their profile
        if (userProfile.assignedSport) {
            setAssignedSport(userProfile.assignedSport);

            // 2. Count players for that sport
            const rosterRef = collection(db, `artifacts/${appId}/public/data/roster`);
            const q = query(
                rosterRef,
                where("status", "==", "Approved"),
                where("sport", "==", userProfile.assignedSport)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                setPlayerCount(snapshot.size);
            }, (error) => {
                console.error("Error counting players: ", error);
                setPlayerCount('Error');
            });

            return () => unsubscribe();

        } else {
            setAssignedSport('Unassigned');
            setPlayerCount(0);
        }
    }, [userProfile, isLoading, db, appId]);
    
    if (isLoading) {
        return <p>Loading coach profile...</p>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{ color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
                Welcome, Coach {userProfile?.name || userProfile?.email}!
            </h2>
            <p style={{ fontSize: '1.1em', color: '#555', marginTop: '20px' }}>
                This is your **Sportify Coach Panel**. Use the sidebar to manage player evaluations, view schedules, and upload results.
            </p>
            <div style={{ marginTop: '30px', padding: '25px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#e9f7ff' }}>
                <h3 style={{ color: '#20143b' }}>Your Roster Details</h3>
                <p><strong>Your Email:</strong> {userProfile?.email}</p>
                <p><strong>Assigned Sport:</strong> 
                    <strong style={{ color: assignedSport === 'Unassigned' ? 'red' : 'green' }}>
                        {` ${assignedSport}`}
                    </strong>
                </p>
                <p><strong>Approved Players in Roster:</strong> 
                    <strong>{` ${playerCount}`}</strong>
                </p>
            </div>
        </div>
    );
};
// --- End of new CoachOverview Component ---

export default function CoachDashboard() {
    const [activeFeature, setActiveFeature] = useState('overview');
    const navigate = useNavigate();
    const { logout } = useAuth(); 

    const handleLogout = async () => {
        try {
            await logout(); 
            navigate('/'); 
        } catch (error) {
            console.error("Coach Logout failed:", error);
            navigate('/'); 
        }
    };

    const renderContent = () => {
        switch(activeFeature) {
            case 'roster':
                return <PlayerList />; 
            case 'evaluate':
                return <PlayerEvaluation />; 
            case 'schedule':
                return <PlayerSchedule />; 
            case 'upload':
                return <UploadTrialResults />; 
            case 'overview':
            default:
                return <CoachOverview />; // Now renders the dynamic component
        }
    };

    const currentTitle = COACH_NAV_ITEMS.find(item => item.key === activeFeature)?.label || 'Coach Dashboard';

    const LogoutButton = (
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <button 
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#28a745', // Coach theme color (Green)
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                }}
            >
                <LogOut size={16} style={{ marginRight: '5px' }} /> Logout
            </button>
        </div>
    );

    return (
        <DashboardLayout 
            title={currentTitle} 
            navItems={COACH_NAV_ITEMS} 
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
            sidebarFooter={LogoutButton} 
        >
            {renderContent()}
        </DashboardLayout>
    );
}