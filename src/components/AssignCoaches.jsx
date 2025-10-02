// C:\sportify\src\components\AssignCoaches.jsx

import React, { useState } from 'react';

// Mock Data: List of Approved Players (from ApproveRegistrations logic)
const mockPlayers = [
    { id: 101, name: 'Ava Chen', sport: 'Football', assignedCoach: 'Coach Mark' },
    { id: 102, name: 'Ben Smith', sport: 'Basketball', assignedCoach: 'Unassigned' },
    { id: 103, name: 'Cara Lopez', sport: 'Football', assignedCoach: 'Coach Mark' },
    { id: 104, name: 'David Lee', sport: 'Cricket', assignedCoach: 'Coach Emma' },
];

// Mock Data: List of available Coaches
const mockCoaches = [
    { id: 301, name: 'Coach Mark Johnson', sport: 'Football' },
    { id: 302, name: 'Coach Emma Davis', sport: 'Basketball/Cricket' },
    { id: 303, name: 'Coach Alex Vales', sport: 'Football/Basketball' },
];

function AssignCoaches() {
    const [players, setPlayers] = useState(mockPlayers);
    const [selectedPlayerId, setSelectedPlayerId] = useState('');
    const [selectedCoachId, setSelectedCoachId] = useState('');

    const handleAssignment = (e) => {
        e.preventDefault();
        if (!selectedPlayerId || !selectedCoachId) {
            alert("Please select both a player and a coach.");
            return;
        }

        const coachName = mockCoaches.find(c => c.id === parseInt(selectedCoachId))?.name || 'Unassigned';
        
        // Update the player's assignment
        setPlayers(prev => 
            prev.map(p => 
                p.id === parseInt(selectedPlayerId)
                    ? { ...p, assignedCoach: coachName }
                    : p
            )
        );

        console.log(`Assigned Player ID ${selectedPlayerId} to ${coachName}`);
        alert(`Player successfully assigned to ${coachName}!`);

        // Reset form
        setSelectedPlayerId('');
        setSelectedCoachId('');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto' }}>
            <h2>👨‍🏫 Assign Coaches</h2>
            
            {/* ASSIGNMENT FORM */}
            <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#e9f7ff' }}>
                <h3>Make New Assignment</h3>
                <form onSubmit={handleAssignment} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Select Player:</label>
                        <select 
                            value={selectedPlayerId} 
                            onChange={(e) => setSelectedPlayerId(e.target.value)} 
                            required 
                            style={inputStyle}
                        >
                            <option value="">-- Choose Player --</option>
                            {players.map(player => (
                                <option key={player.id} value={player.id}>{player.name} ({player.sport})</option>
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
                            {mockCoaches.map(coach => (
                                <option key={coach.id} value={coach.id}>{coach.name} ({coach.sport})</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" style={buttonStyle}>Assign</button>
                </form>
            </div>

            {/* CURRENT ASSIGNMENTS LIST */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Current Player Roster Assignments</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={tableHeaderStyle}>Player Name</th>
                        <th style={tableHeaderStyle}>Sport</th>
                        <th style={tableHeaderStyle}>Assigned Coach</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map((player) => (
                        <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{player.name}</td>
                            <td style={tableCellStyle}>{player.sport}</td>
                            <td style={{ ...tableCellStyle, color: player.assignedCoach === 'Unassigned' ? 'red' : 'green', fontWeight: 'bold' }}>
                                {player.assignedCoach}
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