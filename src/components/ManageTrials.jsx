// C:\sportify\src\components\ManageTrials.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { 
    initializeApp,
    getApps,
    getApp
} from 'firebase/app'; 
import { 
    collection, 
    addDoc, 
    query, 
    onSnapshot,
    getFirestore
} from 'firebase/firestore'; 

// --- Temporary Firebase Setup (Copied from AdminLogin.jsx for standalone use) ---
const firebaseConfig = {
    apiKey: "AIzaSyAzkQJo_aAcs1jvj4VOgzFksINuur9uvb8",
    authDomain: "sportify-df84b.firebaseapp.com",
    projectId: "sportify-df84b",
    storageBucket: "sportify-df84b.firebasestorage.app",
    messagingSenderId: "125792303495",
    appId: "1:125792303495:web:8944023fee1e655eee7b22",
    measurementId: "G-ZBMG376GBS"
};
const appName = 'sportify'; 
const app = getApps().some(a => a.name === appName) ? getApp(appName) : initializeApp(firebaseConfig, appName);
const db = getFirestore(app);
const FIREBASE_APP_ID = firebaseConfig.appId;
// --- End Temporary Firebase Setup ---

// Define the collection path for trials
const TRIALS_COLLECTION_PATH = `artifacts/${FIREBASE_APP_ID}/public/data/trials`;

// Mock data for coaches (used for assignment dropdown)
const mockCoaches = [
    { id: '301', name: 'Coach Mark Johnson', sport: 'Football' },
    { id: '302', name: 'Coach Emma Davis', sport: 'Basketball/Cricket' },
    { id: '303', name: 'Coach Alex Vales', sport: 'Football/Basketball' },
];

function ManageTrials() {
    const [trials, setTrials] = useState([]);
    const [formData, setFormData] = useState({
        date: '',
        sport: '',
        location: '',
        coachId: '',
    });
    const [message, setMessage] = useState(null);
    const [isDataLoading, setIsDataLoading] = useState(true);

    // --- EFFECT TO FETCH TRIALS FROM FIREBASE ---
    useEffect(() => {
        const trialsCollectionRef = collection(db, TRIALS_COLLECTION_PATH);
        
        const unsubscribe = onSnapshot(trialsCollectionRef, (snapshot) => {
            const fetchedTrials = [];
            snapshot.forEach((doc) => {
                fetchedTrials.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date ascending
            fetchedTrials.sort((a, b) => new Date(a.date) - new Date(b.date));
            setTrials(fetchedTrials);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching trials:", error);
            setMessage({ type: "error", text: "Failed to load trials from database." });
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }, []); 

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleAddTrial = async (e) => {
        e.preventDefault();
        setMessage(null);
        
        const selectedCoach = mockCoaches.find(c => c.id === formData.coachId);
        
        if (!selectedCoach) {
            setMessage({ type: 'error', text: 'Please select a valid coach.' });
            return;
        }

        const newTrialData = {
            date: formData.date,
            sport: formData.sport,
            location: formData.location,
            coachId: selectedCoach.id,
            coachName: selectedCoach.name,
            createdAt: new Date(),
        };

        try {
            await addDoc(collection(db, TRIALS_COLLECTION_PATH), newTrialData);
            
            setFormData({ date: '', sport: '', location: '', coachId: '' });
            setMessage({ type: 'success', text: `New trial for ${newTrialData.sport} successfully scheduled.` });
        } catch (error) {
            console.error("Error adding document: ", error);
            setMessage({ type: 'error', text: `Failed to schedule trial: ${error.message}` });
        }
        
        setTimeout(() => setMessage(null), 5000);
    };

    if (isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Trials Data...</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
            <h2>🗓️ Manage Upcoming Trials</h2>
            
            {/* Status Message */}
            {message && (
                <p style={{ 
                    padding: '10px', 
                    borderRadius: '4px', 
                    fontWeight: 'bold',
                    backgroundColor: message.type === 'error' ? '#f8d7da' : (message.type === 'success' ? '#d4edda' : '#fff3cd'),
                    color: message.type === 'error' ? '#721c24' : (message.type === 'success' ? '#155724' : '#856404'),
                    marginBottom: '20px'
                }}>
                    {message.text}
                </p>
            )}

            {/* ADD NEW TRIAL FORM */}
            <div style={{ border: '1px solid #28a745', padding: '20px', borderRadius: '8px', marginBottom: '30px', backgroundColor: '#e6ffe6' }}>
                <h3 style={{ marginTop: '0', color: '#28a745' }}>Add New Trial Event</h3>
                <form onSubmit={handleAddTrial} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Date:</label>
                        <input 
                            type="date" 
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required 
                            style={inputStyle}
                        />
                    </div>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Sport:</label>
                        <select 
                            name="sport"
                            value={formData.sport}
                            onChange={handleChange}
                            required 
                            style={inputStyle}
                        >
                            <option value="">-- Select Sport --</option>
                            <option value="Football">Football</option>
                            <option value="Basketball">Basketball</option>
                            <option value="Cricket">Cricket</option>
                            <option value="Tennis">Tennis</option>
                        </select>
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Location:</label>
                        <input 
                            type="text" 
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g., Main Pitch A"
                            required 
                            style={inputStyle}
                        />
                    </div>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Assign Coach:</label>
                        <select 
                            name="coachId"
                            value={formData.coachId} 
                            onChange={handleChange} 
                            required 
                            style={inputStyle}
                        >
                            <option value="">-- Choose Coach --</option>
                            {mockCoaches.map(coach => (
                                <option key={coach.id} value={coach.id}>{coach.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ gridColumn: 'span 4', textAlign: 'right', paddingTop: '10px' }}>
                        <button type="submit" style={buttonStyle}>Schedule Trial</button>
                    </div>
                </form>
            </div>

            {/* UPCOMING TRIALS LIST */}
            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Upcoming Scheduled Trials ({trials.length})</h3>
            
            {trials.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>No trials are currently scheduled.</p>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#f0f0f0' }}>
                            <th style={tableHeaderStyle}>Date</th>
                            <th style={tableHeaderStyle}>Sport</th>
                            <th style={tableHeaderStyle}>Location</th>
                            <th style={tableHeaderStyle}>Assigned Coach</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trials.map((trial) => (
                            <tr key={trial.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tableCellStyle}>{trial.date}</td>
                                <td style={tableCellStyle}>{trial.sport}</td>
                                <td style={tableCellStyle}>{trial.location}</td>
                                <td style={{ ...tableCellStyle, fontWeight: 'bold', color: '#007bff' }}>
                                    {trial.coachName}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// Simple Styling
const formGroupStyle = { display: 'flex', flexDirection: 'column' };
const labelStyle = { marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9em' };
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' };
const buttonStyle = { padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1em' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '30px' };
const tableHeaderStyle = { padding: '12px', border: 'none' };
const tableCellStyle = { padding: '12px', border: 'none' };

export default ManageTrials;