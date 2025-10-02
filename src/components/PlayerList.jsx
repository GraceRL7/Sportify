import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from '../firebase'; 

function PlayerList() {
    const { db, appId, userRole, isLoading } = useAuth();
    const [roster, setRoster] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (isLoading || userRole !== 'coach' || !db) return;

        // Collection Path: Assuming Approved Players are listed in a centralized,
        // publicly accessible 'roster' collection for coaches and admins.
        const rosterCollectionRef = collection(db, `artifacts/${appId}/public/data/roster`);
        
        // Query: Filter only players whose status is explicitly 'Approved'
        const q = query(rosterCollectionRef, where("status", "==", "Approved"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const players = [];
            snapshot.forEach((doc) => {
                players.push({ id: doc.id, ...doc.data() });
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
        <div style={{ padding: '20px', maxWidth: '600px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px' }}>
            <h2>👥 Registered Players ({roster.length})</h2>
            
            {roster.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>No approved players found in the roster.</p>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={tableHeaderStyle}>ID (Partial)</th>
                            <th style={tableHeaderStyle}>Sport</th>
                            <th style={tableHeaderStyle}>Coach</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roster.map((player) => (
                            <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tableCellStyle}>{player.id.substring(0, 8)}...</td>
                                <td style={tableCellStyle}>{player.sport || 'N/A'}</td>
                                <td style={tableCellStyle}>{player.assignedCoach || 'Unassigned'}</td>
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
