import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from '../firebase'; 

function PlayerList() {
    const { db, appId, userRole, isLoading } = useAuth();
    const [roster, setRoster] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (isLoading || userRole !== 'coach' || !db || !appId) {
             setIsDataLoading(false); // Stop loading if prerequisites aren't met
            return;
        }

        // Collection Path: Use the standard user profile path
        const usersCollectionRef = collection(db, `artifacts/${appId}/public/data/users`);
        
        // Query: Filter only users with the 'player' role 
        // Note: We're fetching all players, not checking an 'approved' status here.
        // We assume only approved players have the 'player' role set correctly.
        const q = query(usersCollectionRef, where("role", "==", "player"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const players = [];
            snapshot.forEach((doc) => {
                // Include name and email directly from the user profile document
                players.push({ 
                    id: doc.id, 
                    name: doc.data().name || 'No Name Set', 
                    email: doc.data().email, 
                    sport: doc.data().sport || 'N/A', 
                    // Consider adding coach assignment if available:
                    // assignedCoach: doc.data().assignedCoach || 'Unassigned' 
                });
            });
            setRoster(players);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching player roster:", error);
            setIsDataLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [db, appId, userRole, isLoading]);

    if (isLoading || isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading player roster...</div>;
    }

    if (userRole !== 'coach') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied: Only Coaches can view the roster.</div>;
    }

    // --- Render Content ---
    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2>👥 Registered Players ({roster.length})</h2>
            
            {roster.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>No players found in the system.</p>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            {/* Updated Columns */}
                            <th style={tableHeaderStyle}>Name</th>
                            <th style={tableHeaderStyle}>Email</th>
                            <th style={tableHeaderStyle}>Sport</th>
                            {/* <th style={tableHeaderStyle}>Assigned Coach</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map((player) => (
                            <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                                {/* Updated Data Display */}
                                <td style={tableCellStyle}>{player.name}</td>
                                <td style={tableCellStyle}>{player.email}</td>
                                <td style={tableCellStyle}>{player.sport}</td>
                                {/* <td style={tableCellStyle}>{player.assignedCoach || 'Unassigned'}</td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// Simple styling
const tableHeaderStyle = { padding: '12px', border: 'none', textAlign: 'left' };
const tableCellStyle = { padding: '12px', border: 'none', textAlign: 'left' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left' };

export default PlayerList;