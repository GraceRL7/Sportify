// C:\sportify\src\components\AssignCoaches.jsx (Firebase Connected)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, collection, query, where, onSnapshot, doc, updateDoc, getDocs } from '../firebase';

// This is the list of sports your system supports.
const systemSports = [
    'Football',
    'Basketball',
    'Cricket',
    'Tennis',
    'Swimming',
];

function AssignCoaches() {
    const { db, appId, userRole, isLoading } = useAuth();
    const [coaches, setCoaches] = useState([]); // Real coaches from Firestore
    const [assignments, setAssignments] = useState({}); // { coachId: 'Sport' }
    const [isDataLoading, setIsDataLoading] = useState(true);
    
    const [selectedSport, setSelectedSport] = useState('');
    const [selectedCoachId, setSelectedCoachId] = useState('');
    const [statusMessage, setStatusMessage] = useState(null);

    // Effect to fetch all coach profiles
    useEffect(() => {
        if (isLoading || userRole !== 'admin' || !db) return;

        const usersRef = collection(db, `artifacts/${appId}/public/data/users`);
        const q = query(usersRef, where("role", "==", "coach"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const coachList = [];
            const currentAssignments = {};
            snapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                coachList.push(data);
                if (data.assignedSport) {
                    currentAssignments[data.id] = data.assignedSport;
                }
            });
            setCoaches(coachList);
            setAssignments(currentAssignments);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching coaches: ", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }, [db, appId, userRole, isLoading]);

    const handleAssignment = async (e) => {
        e.preventDefault();
        setStatusMessage(null);
        if (!selectedSport || !selectedCoachId) {
            setStatusMessage({ type: 'error', text: 'Please select both a sport and a coach.' });
            return;
        }

        try {
            // Get reference to the coach's user document
            const coachDocRef = doc(db, `artifacts/${appId}/public/data/users`, selectedCoachId);
            
            // Update the document with the new 'assignedSport' field
            await updateDoc(coachDocRef, {
                assignedSport: selectedSport
            });

            setStatusMessage({ type: 'success', text: 'Assignment saved successfully!' });
            setSelectedSport('');
            setSelectedCoachId('');
            
        } catch (error) {
            console.error("Error saving assignment: ", error);
            setStatusMessage({ type: 'error', text: 'Failed to save assignment.' });
        }
    };

    if (isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading coach data...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto' }}>
            <h2>👨‍🏫 Assign Coaches to Sports Roster</h2>
            
            {statusMessage && (
                <p style={{ color: statusMessage.type === 'error' ? 'red' : 'green' }}>
                    {statusMessage.text}
                </p>
            )}

            <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#e9f7ff' }}>
                <h3>Assign Coach to a Sport Roster</h3>
                <form onSubmit={handleAssignment} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                    
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Select Sport Roster:</label>
                        <select 
                            value={selectedSport} 
                            onChange={(e) => setSelectedSport(e.target.value)} 
                            required 
                            style={inputStyle}
                        >
                            <option value="">-- Choose Sport --</option>
                            {systemSports.map(sport => (
                                <option key={sport} value={sport}>{sport}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Select Coach:</label>
                        <select 
                            value={selectedCoachId} 
                            onChange={(e) => setSelectedCoachId(e.target.value)} 
                            required 
                            style={inputStyle}
                        >
                            <option value="">-- Choose Coach --</option>
                            {coaches.map(coach => (
                                <option key={coach.id} value={coach.id}>
                                    {coach.email}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <button type="submit" style={buttonStyle}>Assign Coach to Sport</button>
                </form>
            </div>

            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Current Coach Assignments</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={tableHeaderStyle}>Coach Email</th>
                        <th style={tableHeaderStyle}>Assigned Sport</th>
                    </tr>
                </thead>
                <tbody>
                    {coaches.map((coach) => (
                        <tr key={coach.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{coach.email}</td>
                            <td style={{ 
                                ...tableCellStyle, 
                                color: assignments[coach.id] ? 'green' : 'red', 
                                fontWeight: 'bold' 
                            }}>
                                {assignments[coach.id] || 'Unassigned'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Simple styling
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const buttonStyle = { padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const tableHeaderStyle = { padding: '12px', border: 'none' };
const tableCellStyle = { padding: '12px', border: 'none' };

export default AssignCoaches;