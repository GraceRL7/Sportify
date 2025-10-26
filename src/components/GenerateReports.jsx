import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    db,
    collection,
    query,
    where,
    getDocs,
    onSnapshot
} from '../firebase'; 

// Helper function to convert JSON data to a CSV string
const convertToCSV = (data) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
        }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
};

const GenerateReports = () => {
    const { db, appId, isLoading: isAuthLoading } = useAuth();
    
    const [selectedTrialId, setSelectedTrialId] = useState('');
    const [statusMessage, setStatusMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [availableTrials, setAvailableTrials] = useState([]);
    const [trialsLoading, setTrialsLoading] = useState(true);

    const TRIALS_COLLECTION = `artifacts/${appId}/public/data/trials`;
    const APPLICATIONS_COLLECTION = `artifacts/${appId}/admin/data/pending_applications`;

    // Fetch Trials
    useEffect(() => {
        if (isAuthLoading || !db || !appId) return;

        const trialsRef = collection(db, TRIALS_COLLECTION);
        const q = query(trialsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const trialsList = [];
            snapshot.forEach((doc) => {
                trialsList.push({ id: doc.id, ...doc.data() });
            });
            trialsList.sort((a, b) => new Date(a.date) - new Date(b.date));
            setAvailableTrials(trialsList);
            setTrialsLoading(false);
        }, (error) => {
            console.error("Error fetching available trials:", error);
            setStatusMessage({ type: 'error', text: 'Failed to load available trials from Firestore.' });
            setTrialsLoading(false);
        });

        return () => unsubscribe(); 
    }, [isAuthLoading, db, appId, TRIALS_COLLECTION]);

    const handleGenerateAndDownload = async () => {
        if (!selectedTrialId || !appId) {
            setStatusMessage({ type: 'error', text: 'Please select a trial first.' });
            return;
        }

        const selectedTrial = availableTrials.find(t => t.id === selectedTrialId);
        if (!selectedTrial) return; 

        setStatusMessage(null);
        setLoading(true);

        try {
            const applicationsRef = collection(db, APPLICATIONS_COLLECTION);
            
            const q = query(
                applicationsRef, 
                where("sport", "==", selectedTrial.sport), 
                where("status", "==", "Approved") 
            );

            const snapshot = await getDocs(q);
            const players = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                // --- ADDED Player Name to export ---
                players.push({
                    playerId: data.userId || doc.id, 
                    playerName: data.fullName || 'N/A', // Use fullName from application
                    email: data.email || 'N/A', 
                    sport: data.sport,
                    dob: data.dob,
                    experience: data.experience || 'N/A',
                });
            });

            if (players.length === 0) {
                setStatusMessage({ type: 'info', text: `No approved players found for the ${selectedTrial.sport} trial.` });
                setLoading(false);
                return;
            }

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
            setStatusMessage({ type: 'error', text: 'Failed to generate report. (Check Firestore Index/Rules)' });
        } finally {
            setLoading(false);
        }
    };
    
    if (isAuthLoading || trialsLoading) {
        return <p style={{ padding: '40px', textAlign: 'center' }}>Loading report tools and trial data...</p>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '20px auto' }}>
            <h2>📑 Generate Reports</h2>
            
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
                
                {availableTrials.length === 0 && !trialsLoading && (
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
            
            <div style={{ marginTop: '30px', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ borderBottom: '2px solid #007bff', paddingBottom: '5px', color: '#007bff' }}>
                    System Overview (Quick Stats)
                </h3>
                <p>Upcoming Trials: {availableTrials.length}</p>
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