import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc } from '../firebase'; 

// NOTE: In a real app, this list would be filtered by the coach's assigned players,
// but here we fetch the entire approved roster for simplicity.

function MarkAttendance() {
    const { db, appId, userRole, isLoading, userId } = useAuth();
    const [roster, setRoster] = useState([]);
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState({}); // { playerId: 'Present'/'Absent' }
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');

    // --- Fetch Approved Roster (READ) ---
    useEffect(() => {
        if (isLoading || userRole !== 'coach' || !db) return;

        // Collection Path: Public roster (read-only for coach)
        const rosterCollectionRef = collection(db, `artifacts/${appId}/public/data/roster`);
        const q = query(rosterCollectionRef, where("status", "==", "Approved"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const players = [];
            const initialAttendance = {};
            snapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                players.push(data);
                // Initialize all players as 'Absent' (or 'Present', depending on policy)
                initialAttendance[data.id] = 'Absent'; 
            });
            setRoster(players);
            setAttendanceRecords(initialAttendance);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching player roster:", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }, [db, appId, userRole, isLoading]);

    // --- UI/State Logic ---
    const toggleAttendance = (playerId) => {
        setAttendanceRecords(prev => ({
            ...prev,
            [playerId]: prev[playerId] === 'Present' ? 'Absent' : 'Present'
        }));
    };

    // --- Submission Logic (CREATE) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage('Submitting attendance...');

        if (!roster.length) {
            setStatusMessage('Error: Roster is empty. Cannot submit.');
            return;
        }

        try {
            const recordsToSave = roster.map(player => ({
                playerId: player.id,
                playerName: player.name,
                status: attendanceRecords[player.id],
                date: attendanceDate,
                coachId: userId,
                submittedAt: new Date(),
            }));

            // Firestore Path: Central collection for attendance records (writable by coach)
            const attendanceCollectionRef = collection(db, `artifacts/${appId}/public/data/attendance_records`);
            
            // Batch writes would be better, but for simplicity, we submit records sequentially:
            for (const record of recordsToSave) {
                await addDoc(attendanceCollectionRef, record);
            }

            setStatusMessage(`Attendance for ${attendanceDate} successfully recorded!`);
            
        } catch (error) {
            console.error("Error submitting attendance:", error);
            setStatusMessage("Failed to record attendance.");
        }
    };

    if (isLoading || isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading attendance sheet...</div>;
    }
    if (userRole !== 'coach') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied. Must be a Coach.</div>;
    }

    // --- Render Content ---
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px' }}>
            <h2>✅ Mark Attendance</h2>
            
            {statusMessage && (
                <p style={{ color: statusMessage.includes('Failed') || statusMessage.includes('Error') ? 'red' : 'green', fontWeight: 'bold' }}>
                    {statusMessage}
                </p>
            )}

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date of Session:</label>
                    <input
                        type="date"
                        value={attendanceDate}
                        onChange={(e) => setAttendanceDate(e.target.value)}
                        required
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>

                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {roster.map((player) => (
                        <li 
                            key={player.id} 
                            style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                padding: '10px 0', 
                                borderBottom: '1px solid #eee' 
                            }}
                        >
                            <span style={{ fontWeight: '500' }}>{player.name}</span>
                            <button 
                                type="button"
                                onClick={() => toggleAttendance(player.id)}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    backgroundColor: attendanceRecords[player.id] === 'Present' ? '#28a745' : '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                }}
                            >
                                {attendanceRecords[player.id] === 'Present' ? 'Present' : 'Absent'}
                            </button>
                        </li>
                    ))}
                </ul>
                
                <button 
                    type="submit"
                    disabled={!roster.length}
                    style={{ 
                        marginTop: '20px', 
                        padding: '10px 20px', 
                        backgroundColor: roster.length ? '#007bff' : '#ccc', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: roster.length ? 'pointer' : 'not-allowed',
                        width: '100%'
                    }}
                >
                    Save Attendance Records
                </button>
            </form>
        </div>
    );
}

export default MarkAttendance;