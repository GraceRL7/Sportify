import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs, query, where } from '../firebase'; 

// NOTE: In a real app, this roster would be limited to players assigned to the coach.
// Here, we fetch all approved players for selection.

function UploadTrialResults() {
    const { db, appId, userRole, isLoading, userId } = useAuth();
    const [players, setPlayers] = useState([]);
    const [isRosterLoading, setIsRosterLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);

    const [resultsData, setResultsData] = useState({
        playerId: '',
        trialDate: new Date().toISOString().split('T')[0],
        speedScore: '',
        agilityScore: '',
        feedback: '',
        recommendation: 'Pending', 
    });

    // Fetch the list of approved players for the dropdown
    useEffect(() => {
        if (isLoading || userRole !== 'coach' || !db) return;

        const rosterCollectionRef = collection(db, `artifacts/${appId}/public/data/roster`);
        const q = query(rosterCollectionRef, where("status", "==", "Approved")); 

        const fetchRoster = async () => {
            try {
                const snapshot = await getDocs(q);
                const approvedPlayers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setPlayers(approvedPlayers);
            } catch (error) {
                console.error("Error fetching approved roster:", error);
            } finally {
                setIsRosterLoading(false);
            }
        };

        fetchRoster();
    }, [db, appId, userRole, isLoading]);

    // --- Form Handlers ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setResultsData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: 'info', message: 'Uploading results...' });

        if (!resultsData.playerId) {
            setStatusMessage({ type: 'error', message: 'Please select a player.' });
            return;
        }

        try {
            const player = players.find(p => p.id === resultsData.playerId);
            const dataToSave = {
                ...resultsData,
                playerId: player.id,
                playerName: player.name,
                coachId: userId,
                uploadDate: new Date(),
            };

            // Firestore Path: Central collection for trial results (writable by coach)
            const resultsCollectionRef = collection(db, `artifacts/${appId}/public/data/trial_results`);
            await addDoc(resultsCollectionRef, dataToSave);

            setStatusMessage({ type: 'success', message: `Results uploaded successfully for ${player.name}!` });
            
        } catch (error) {
            console.error("Error uploading trial results:", error);
            setStatusMessage({ type: 'error', message: `Upload failed: ${error.message}` });
        }
    };

    if (isLoading || isRosterLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading approved players...</div>;
    }
    if (userRole !== 'coach') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied.</div>;
    }

    // --- Render Content ---
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' }}>
            <h2>📊 Upload Trial Results</h2>
            
            {statusMessage && (
                 <p style={{ padding: '10px', marginBottom: '15px', borderRadius: '4px', textAlign: 'center',
                     backgroundColor: statusMessage.type === 'error' ? '#f8d7da' : '#d4edda',
                     color: statusMessage.type === 'error' ? '#721c24' : '#155724'
                 }}>
                     {statusMessage.message}
                 </p>
             )}

            <form onSubmit={handleSubmit}>
                {/* Player Selection and Date */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Select Player:</label>
                    <select 
                        name="playerId" 
                        value={resultsData.playerId} 
                        onChange={handleChange} 
                        required
                        style={inputStyle}
                    >
                        <option value="">-- Select a Player --</option>
                        {players.map(player => (
                            <option key={player.id} value={player.id}>{player.name} ({player.email})</option>
                        ))}
                    </select>
                </div>
                
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Trial Date:</label>
                    <input
                        type="date"
                        name="trialDate"
                        value={resultsData.trialDate}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                    />
                </div>
                
                {/* Performance Metrics */}
                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Performance Scores</h3>
                
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Sprint Time (s):</label>
                    <input type="number" step="0.1" name="speedScore" value={resultsData.speedScore} onChange={handleChange} required style={inputStyle} />
                </div>
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Agility Score:</label>
                    <input type="number" step="0.1" name="agilityScore" value={resultsData.agilityScore} onChange={handleChange} required style={inputStyle} />
                </div>
                
                {/* Feedback and Recommendation */}
                <div style={formGroupStyle}>
                    <label style={labelStyle}>Overall Feedback:</label>
                    <textarea name="feedback" value={resultsData.feedback} onChange={handleChange} rows="3" style={{ ...inputStyle, resize: 'vertical' }}></textarea>
                </div>

                <div style={formGroupStyle}>
                    <label style={labelStyle}>Recommendation Status:</label>
                    <select name="recommendation" value={resultsData.recommendation} onChange={handleChange} required style={inputStyle}>
                        <option value="Pending">Pending</option>
                        <option value="Selected">Selected</option>
                        <option value="Waitlist">Waitlist</option>
                        <option value="Not Selected">Not Selected</option>
                    </select>
                </div>
                
                <button type="submit" style={buttonStyle}>
                    Upload Results
                </button>
            </form>
        </div>
    );
}

// Simple styling
const formGroupStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' };
const buttonStyle = { 
    marginTop: '20px', 
    padding: '10px 20px', 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    borderRadius: '5px', 
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.3s'
};

export default UploadTrialResults;