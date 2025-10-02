import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs, doc, setDoc, query, onSnapshot } from '../firebase'; 

function ManageSchedules() {
    const { db, appId, userRole, isLoading, user } = useAuth();
    const [schedules, setSchedules] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [submissionStatus, setSubmissionStatus] = useState(null); 

    const [newSchedule, setNewSchedule] = useState({
        sport: '',
        date: '',
        time: '',
        location: '',
        spots: 10,
        targetUserIds: ['default'] // Include this array for querying later
    });

    // --- 1. SETUP: CHECK ADMIN PROFILE & FETCH EXISTING SCHEDULES ---
    useEffect(() => {
        if (isLoading || userRole !== 'admin' || !db || !user) return;

        // CRITICAL CHECK: Ensure Admin profile exists if it failed during login
        const ensureAdminProfile = async () => {
            const adminDocRef = doc(db, `artifacts/${appId}/public/data/users`, user.uid);
            try {
                // If the profile doesn't exist, create it now to guarantee the Admin role is recognized for subsequent writes.
                await setDoc(adminDocRef, { 
                    email: user.email, 
                    role: userRole, 
                    registeredAt: new Date(),
                    name: 'Admin User'
                }, { merge: true }); 
            } catch (e) {
                console.error("Failed to ensure Admin profile exists:", e);
            }
        };

        // Fetch schedules (READ)
        const schedulesCollectionRef = collection(db, `artifacts/${appId}/public/data/schedules`);
        const q = query(schedulesCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = [];
            snapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() });
            });
            setSchedules(events);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching schedules:", error);
            setIsDataLoading(false);
        });
        
        ensureAdminProfile();

        return () => unsubscribe();
    }, [db, appId, userRole, isLoading, user]);

    // --- 2. ADD SCHEDULE LOGIC (WRITE) ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewSchedule(prev => ({ ...prev, [name]: value }));
    };

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        setSubmissionStatus({ type: 'info', message: 'Creating schedule...' });

        if (!newSchedule.sport || !newSchedule.date || newSchedule.spots <= 0) {
            setSubmissionStatus({ type: 'error', message: 'Please fill all required fields.' });
            return;
        }

        try {
            const scheduleWithMetadata = {
                ...newSchedule,
                spots: parseInt(newSchedule.spots),
                creatorId: user.uid,
                createdAt: new Date(),
                // Placeholder user IDs for player schedule query (must be an array)
                targetUserIds: ['admin-check'], 
            };

            const schedulesCollectionRef = collection(db, `artifacts/${appId}/public/data/schedules`);
            await addDoc(schedulesCollectionRef, scheduleWithMetadata);

            setSubmissionStatus({ type: 'success', message: 'Schedule created successfully!' });
            setNewSchedule(prev => ({ ...prev, sport: '', date: '', time: '', location: '', spots: 10 })); // Clear form
            
        } catch (error) {
            console.error("Error adding schedule:", error);
            setSubmissionStatus({ type: 'error', message: `Failed to create schedule: ${error.message}` });
        }
    };

    // --- 3. RENDERING ---
    if (isLoading || isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading schedule manager...</div>;
    }
    if (userRole !== 'admin') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied. Must be an Admin.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
            <h2>🗓️ Manage Trial Schedules</h2>
            
            {submissionStatus && (
                <p style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', textAlign: 'center',
                    backgroundColor: submissionStatus.type === 'error' ? '#f8d7da' : '#d4edda',
                    color: submissionStatus.type === 'error' ? '#721c24' : '#155724'
                }}>
                    {submissionStatus.message}
                </p>
            )}

            {/* ADD NEW SCHEDULE FORM */}
            <div style={{ border: '1px solid #007bff', padding: '15px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#e9f7ff' }}>
                <h3>Add New Trial</h3>
                <form onSubmit={handleAddSchedule} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <input type="text" name="sport" value={newSchedule.sport} onChange={handleChange} placeholder="Sport" required style={inputStyle} />
                    <input type="date" name="date" value={newSchedule.date} onChange={handleChange} required style={inputStyle} />
                    <input type="time" name="time" value={newSchedule.time} onChange={handleChange} required style={inputStyle} />
                    <input type="text" name="location" value={newSchedule.location} onChange={handleChange} placeholder="Location" required style={inputStyle} />
                    <input type="number" name="spots" value={newSchedule.spots} onChange={handleChange} placeholder="Max Spots" min="1" required style={inputStyle} />
                    <button type="submit" style={buttonStyle}>Create Schedule</button>
                </form>
            </div>

            {/* EXISTING SCHEDULES LIST */}
            <h3>Existing Schedules ({schedules.length})</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th style={tableHeaderStyle}>Sport</th>
                        <th style={tableHeaderStyle}>Date & Time</th>
                        <th style={tableHeaderStyle}>Location</th>
                        <th style={tableHeaderStyle}>Spots</th>
                    </tr>
                </thead>
                <tbody>
                    {schedules.map((schedule) => (
                        <tr key={schedule.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={tableCellStyle}>{schedule.sport}</td>
                            <td style={tableCellStyle}>{schedule.date} at {schedule.time}</td>
                            <td style={tableCellStyle}>{schedule.location}</td>
                            <td style={tableCellStyle}>{schedule.spots}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Simple styling
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const buttonStyle = { padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const tableHeaderStyle = { padding: '12px', border: 'none' };
const tableCellStyle = { padding: '12px', border: 'none' };

export default ManageSchedules;