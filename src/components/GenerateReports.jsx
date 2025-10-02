// C:\sportify\src\components\GenerateReports.js

import React, { useState, useEffect } from 'react';
import { 
    initializeApp,
    getApps,
    getApp
} from 'firebase/app';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    onSnapshot
} from 'firebase/firestore';

// --- Firebase Configuration copied from AdminLogin.jsx for standalone use ---
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
// --- PATH FIX: Using valid 3-segment path structure ---
const TRIALS_COLLECTION = `admin_data/${FIREBASE_APP_ID}/trials`;
const APPLICATIONS_COLLECTION = `admin_data/${FIREBASE_APP_ID}/pending_applications`; 


// Helper function to convert JSON data to a CSV string
const convertToCSV = (data) => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    const csvRows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            // Sanitize values for CSV (handle commas and quotes)
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        }).join(',')
    );

    return [csvHeaders, ...csvRows].join('\n');
};

const GenerateReports = () => {
    const [selectedTrialId, setSelectedTrialId] = useState('');
    const [statusMessage, setStatusMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [availableTrials, setAvailableTrials] = useState([]);
    const [trialsLoading, setTrialsLoading] = useState(true);

    // --- EFFECT: FETCH REAL TRIAL DATA ---
    useEffect(() => {
        const trialsRef = collection(db, TRIALS_COLLECTION);
        const q = query(trialsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const trialsList = [];
            snapshot.forEach((doc) => {
                trialsList.push({ id: doc.id, ...doc.data() });
            });
            // Sort by date ascending
            trialsList.sort((a, b) => new Date(a.date) - new Date(b.date));
            setAvailableTrials(trialsList);
            setTrialsLoading(false);
        }, (error) => {
            console.error("Error fetching available trials:", error);
            setStatusMessage({ type: 'error', text: 'Failed to load available trials from Firestore.' });
            setTrialsLoading(false);
        });

        return () => unsubscribe(); 
    }, []);

    const handleGenerateAndDownload = async () => {
        if (!selectedTrialId) {
            setStatusMessage({ type: 'error', text: 'Please select a trial first.' });
            return;
        }

        const selectedTrial = availableTrials.find(t => t.id === selectedTrialId);
        if (!selectedTrial) return; 

        setStatusMessage(null);
        setLoading(true);

        try {
            // 1. Query Firestore for approved players whose sport matches the selected trial's sport
            const applicationsRef = collection(db, APPLICATIONS_COLLECTION);
            
            // This query requires a composite index on (sport, status)
            const q = query(
                applicationsRef, 
                where("sport", "==", selectedTrial.sport), 
                where("status", "==", "Approved") 
            );

            const snapshot = await getDocs(q);
            const players = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                players.push({
                    id: doc.id,
                    email: data.email || 'N/A', 
                    sport: data.sport,
                    dob: data.dob,
                    coachAssignment: data.coach || 'Unassigned'
                });
            });

            if (players.length === 0) {
                setStatusMessage({ type: 'info', text: `No approved players found for the ${selectedTrial.sport} trial.` });
                setLoading(false);
                return;
            }

            // 2. Convert data to CSV and trigger download
            const csvData = convertToCSV(players);
            
            const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${selectedTrial.sport}_Trial_Registrations_${selectedTrial.date}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setStatusMessage({ type: 'success', text: `Successfully generated and downloaded ${players.length} records.` });

        } catch (error) {
            console.error("Error fetching or downloading data:", error);
            // Inform the user to check setup, as this is typically a configuration error
            setStatusMessage({ type: 'error', text: 'Failed to generate report due to a database or network error. (Check Firestore Index/Rules)' });
        } finally {
            setLoading(false);
        }
    };
    
    if (trialsLoading) {
        return <p style={{ padding: '40px', textAlign: 'center' }}>Loading report tools and trial data...</p>;
    }


    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '20px auto' }}>
            <h2>📑 Generate Reports</h2>
            
            {/* Download Player List for Trial */}
            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '25px', backgroundColor: '#fff' }}>
                <h3 style={{ borderBottom: '1px dashed #eee', paddingBottom: '10px' }}>Download Trial Registration List</h3>
                
                <div style={formGroupStyle}>
                    <label style={{ ...labelStyle, width: '150px', flexShrink: 0 }}>Select Trial Event:</label>
                    <select
                        value={selectedTrialId}
                        onChange={(e) => {
                            setSelectedTrialId(e.target.value);
                            setStatusMessage(null);
                        }}
                        style={{ ...inputStyle, flexGrow: 1 }}
                        disabled={availableTrials.length === 0}
                    >
                        <option value="">-- Select Trial (Sport & Date) --</option>
                        {availableTrials.map(trial => (
                            <option key={trial.id} value={trial.id}>
                                {trial.sport} - {trial.date}
                            </option>
                        ))}
                    </select>
                </div>
                
                {availableTrials.length === 0 && (
                     <p style={{ color: '#dc3545', margin: '10px 0' }}>No scheduled trials found. Please add trials under 'Manage Trials'.</p>
                )}

                <button 
                    onClick={handleGenerateAndDownload}
                    disabled={loading || !selectedTrialId || availableTrials.length === 0}
                    style={{ ...buttonStyle, marginTop: '20px', backgroundColor: '#007bff' }}
                >
                    {loading ? 'Generating CSV...' : 'Download Player List (CSV)'}
                </button>
            </div>

            {/* Status Message */}
            {statusMessage && (
                <div
                    style={{
                        ...alertStyle,
                        backgroundColor: statusMessage.type === "error" ? "#f8d7da" : (statusMessage.type === "success" ? "#d4edda" : "#fff3cd"),
                        color: statusMessage.type === "error" ? "#721c24" : (statusMessage.type === "success" ? "#155724" : "#856404"),
                    }}
                >
                    {statusMessage.text}
                </div>
            )}
            
            {/* Original System Overview Section (Optional, but included for completeness) */}
            <div style={{ marginTop: '30px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', color: '#007bff' }}>
                    System Overview (Quick Stats)
                </h3>
                {/* Simplified view of original mock data */}
                <p>Total Players: 154 | Coaches: 8 | Upcoming Trials: {availableTrials.length}</p>
                <p style={{ marginTop: '10px', fontSize: '0.9em', fontStyle: 'italic' }}>
                    Report generated on: {new Date().toLocaleString()}
                </p>
            </div>
        </div>
    );
}

// Simple styling
const buttonStyle = { 
    padding: '12px 25px', 
    color: 'white', 
    border: 'none', 
    borderRadius: '6px', 
    cursor: 'pointer',
    fontSize: '1em',
    width: '100%',
};

const formGroupStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px'
};

const labelStyle = { 
    margin: '0', 
    fontWeight: '600',
    color: '#333'
};

const inputStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
};

const alertStyle = {
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '15px',
    fontWeight: '500',
    border: '1px solid currentColor',
    textAlign: 'center'
};


export default GenerateReports;