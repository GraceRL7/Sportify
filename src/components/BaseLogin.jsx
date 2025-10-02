// C:\sportify\src\components\AssignCoaches.jsx - FINALIZED FOR SPORT/ROSTER ASSIGNMENT

import React, { useState } from 'react';

// Mock Data: List of all sports to manage
const mockSports = [
    { name: 'Football', assignedCoach: 'Coach Mark Johnson' },
    { name: 'Basketball', assignedCoach: 'Coach Alex Vales' },
    { name: 'Cricket', assignedCoach: 'Coach Emma Davis' },
    { name: 'Tennis', assignedCoach: 'Unassigned' },
    { name: 'Swimming', assignedCoach: 'Unassigned' },
];

// Mock Data: List of available Coaches
const mockCoaches = [
    { id: 301, name: 'Coach Mark Johnson', expertise: 'Football' },
    { id: 302, name: 'Coach Emma Davis', expertise: 'Basketball, Cricket' },
    { id: 303, name: 'Coach Alex Vales', expertise: 'Football, Basketball' },
    { id: 304, name: 'Coach Ben Smith', expertise: 'Swimming, Tennis' },
];

function AssignCoaches() {
    // State now manages assignments per sport
    const [sportsRoster, setSportsRoster] = useState(mockSports);
    const [selectedSport, setSelectedSport] = useState('');
    const [selectedCoachId, setSelectedCoachId] = useState('');

    const handleAssignment = (e) => {
        e.preventDefault();
        if (!selectedSport || !selectedCoachId) {
            alert("Please select both a sport and a coach.");
            return;
        }

        // 1. Find the coach name
        const coachName = mockCoaches.find(c => c.id === parseInt(selectedCoachId))?.name || 'Unassigned';
        
        // 2. Update the state with the new assignment
        setSportsRoster(prev => 
            prev.map(sportRoster => 
                sportRoster.name === selectedSport
                    ? { ...sportRoster, assignedCoach: coachName }
                    : sportRoster
            )
        );

        console.log(`Assigned Coach ${coachName} to the entire ${selectedSport} roster.`);
        alert(`Successfully assigned ${coachName} to the ${selectedSport} roster!`);

        // 3. Reset form
        setSelectedSport('');
        setSelectedCoachId('');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto' }}>
            <h2>👨‍🏫 Assign Coaches to Sports Roster</h2>
            
            {/* ASSIGNMENT FORM (ONLY SPORT AND COACH) */}
            <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#e9f7ff' }}>
                <h3>Assign Coach to a Sport Roster</h3>
                <form onSubmit={handleAssignment} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                    
                    {/* Select Sport */}
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Select Sport Roster:</label>
                        <select 
                            value={selectedSport} 
                            onChange={(e) => setSelectedSport(e.target.value)} 
                            required 
                            style={inputStyle}
                        >
                            <option value="">-- Choose Sport --</option>
                            {sportsRoster.map(sportRoster => (
                                <option key={sportRoster.name} value={sportRoster.name}>
                                    {sportRoster.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Select Coach */}
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
                                <option key={coach.id} value={coach.id}>
                                    {coach.name} (Expertise: {coach.expertise})
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <button type="submit" style={buttonStyle}>Assign Coach to Sport</button>
                </form>
            </div>

            {/* CURRENT ASSIGNMENTS TABLE (DISPLAYING SPORT ROSTERS) */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Current Sport Roster Assignments</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={tableHeaderStyle}>Sport Roster</th>
                        <th style={tableHeaderStyle}>Assigned Head Coach</th>
                    </tr>
                </thead>
                <tbody>
                    {sportsRoster.map((sportRoster) => (
                        <tr key={sportRoster.name} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{sportRoster.name}</td>
                            <td style={{ 
                                ...tableCellStyle, 
                                color: sportRoster.assignedCoach === 'Unassigned' ? 'red' : 'green', 
                                fontWeight: 'bold' 
                            }}>
                                {sportRoster.assignedCoach}
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