import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, getDocs } from '../firebase';

// Mock Data: List of Approved Players (This would ideally come from the PlayerList component/roster data)
const mockPlayers = [
    { id: 'uid101', name: 'Ava Chen', sport: 'Football' },
    { id: 'uid102', name: 'Ben Smith', sport: 'Basketball' },
    { id: 'uid103', name: 'Cara Lopez', sport: 'Football' },
];

// Common performance metrics for trials
const performanceMetrics = [
    { name: 'Sprint Time (s)', key: 'sprintTime' },
    { name: 'Agility Score', key: 'agilityScore' },
    { name: 'Passing Accuracy (%)', key: 'passingAccuracy' },
];

function UploadTrialResults() {
    const { db, userId, appId, userRole, isLoading } = useAuth();
    const [players, setPlayers] = useState(mockPlayers);
    const [submissionStatus, setSubmissionStatus] = useState(null);
    
    // Initializing state with empty scores
    const initialScores = performanceMetrics.reduce((acc, metric) => ({ ...acc, [metric.key]: '' }), {});

    const [resultsData, setResultsData] = useState({
        playerId: '',
        playerSport: '',
        trialDate: new Date().toISOString().split('T')[0],
        scores: initialScores,
        feedback: '',
        recommendation: 'Pending', 
    });

    // NOTE: In a complete application, you would fetch the live list of players 
    // here using getDocs on the Roster collection, but we use mockPlayers for stability.
    // useEffect(() => { /* Fetch roster here */ }, [db, appId, userRole]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'playerId') {
            const selectedPlayer = players.find(p => p.id === value);
            setResultsData(prev => ({ 
                ...prev, 
                playerId: value,
                playerSport: selectedPlayer ? selectedPlayer.sport : '',
            }));
            return;
        }

        if (performanceMetrics.map(m => m.key).includes(name)) {
            setResultsData(prev => ({
                ...prev,
                scores: { ...prev.scores, [name]: parseFloat(value) || '' }
            }));
        } else {
            setResultsData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmissionStatus('submitting');

        if (!db || userRole !== 'coach' || !resultsData.playerId) {
            setSubmissionStatus('error');
            alert('Error: Must be logged in as a Coach and select a Player.');
            return;
        }

        try {
            const submission = {
                ...resultsData,
                userId: resultsData.playerId, // Player's ID
                coachId: userId,             // Coach's ID
                submissionDate: new Date(),
                sport: resultsData.playerSport,
            };

            // Firestore Path: Central collection for all trial results (read by players)
            // /artifacts/{appId}/public/data/trial_results
            const resultsCollectionRef = collection(db, `artifacts/${appId}/public/data/trial_results`);
            await addDoc(resultsCollectionRef, submission);

            setSubmissionStatus('success');
            setResultsData(prev => ({ ...prev, scores: initialScores, feedback: '' })); // Clear specific fields
            setTimeout(() => setSubmissionStatus(null), 3000);
            
        } catch (error) {
            setSubmissionStatus('error');
            console.error("Error submitting trial results: ", error);
            alert('Upload failed. Check console.');
        }
    };

    const isSubmittingDisabled = isLoading || userRole !== 'coach' || submissionStatus === 'submitting' || !resultsData.playerId;

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Coach Panel...</div>;
    }
    if (userRole !== 'coach') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied. Must be a Coach.</div>;
    }
    
    // --- Render Content ---
    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px' }}>
            <h2>📊 Upload Trial Results</h2>
            
            {submissionStatus === 'success' && <p style={successStyle}>Results uploaded successfully!</p>}
            {submissionStatus === 'error' && <p style={errorStyle}>Upload failed. See console.</p>}

            <form onSubmit={handleSubmit}>
                {/* Player Selection and Date */}
                <div style={formGroupStyle}>
                    <label htmlFor="playerId" style={labelStyle}>Select Player:</label>
                    <select 
                        id="playerId" 
                        name="playerId" 
                        value={resultsData.playerId} 
                        onChange={handleChange} 
                        required
                        style={inputStyle}
                        disabled={isSubmittingDisabled}
                    >
                        <option value="">-- Select a Player --</option>
                        {players.map(player => (
                            <option key={player.id} value={player.id}>{player.name} ({player.sport})</option>
                        ))}
                    </select>
                </div>
                
                <div style={formGroupStyle}>
                    <label htmlFor="trialDate" style={labelStyle}>Trial Date:</label>
                    <input
                        type="date"
                        id="trialDate"
                        name="trialDate"
                        value={resultsData.trialDate}
                        onChange={handleChange}
                        required
                        style={inputStyle}
                        disabled={isSubmittingDisabled}
                    />
                </div>
                
                {/* Performance Metrics */}
                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Performance Scores</h3>
                {performanceMetrics.map(metric => (
                    <div key={metric.key} style={formGroupStyle}>
                        <label htmlFor={metric.key} style={labelStyle}>{metric.name}:</label>
                        <input
                            type="number"
                            step="0.1"
                            id={metric.key}
                            name={metric.key}
                            value={resultsData.scores[metric.key]}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                            disabled={isSubmittingDisabled || !resultsData.playerId}
                        />
                    </div>
                ))}
                
                {/* Feedback and Recommendation */}
                <div style={formGroupStyle}>
                    <label htmlFor="feedback" style={labelStyle}>Overall Feedback:</label>
                    <textarea
                        id="feedback"
                        name="feedback"
                        value={resultsData.feedback}
                        onChange={handleChange}
                        rows="4"
                        style={{ ...inputStyle, resize: 'vertical' }}
                        disabled={isSubmittingDisabled || !resultsData.playerId}
                    ></textarea>
                </div>

                <div style={formGroupStyle}>
                    <label htmlFor="recommendation" style={labelStyle}>Recommendation Status:</label>
                    <select 
                        id="recommendation" 
                        name="recommendation" 
                        value={resultsData.recommendation} 
                        onChange={handleChange} 
                        required
                        style={inputStyle}
                        disabled={isSubmittingDisabled || !resultsData.playerId}
                    >
                        <option value="Pending">Pending</option>
                        <option value="Selected">Selected</option>
                        <option value="Waitlist">Waitlist</option>
                        <option value="Not Selected">Not Selected</option>
                    </select>
                </div>
                
                <button 
                    type="submit"
                    disabled={isSubmittingDisabled}
                    style={{ 
                        marginTop: '20px', 
                        padding: '10px 20px', 
                        backgroundColor: isSubmittingDisabled ? '#ccc' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '5px', 
                        cursor: isSubmittingDisabled ? 'not-allowed' : 'pointer',
                        width: '100%'
                    }}
                >
                    {submissionStatus === 'submitting' ? 'Uploading...' : 'Upload Results'}
                </button>
            </form>
        </div>
    );
}

// Simple styling
const formGroupStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const successStyle = { padding: '10px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '4px' };
const errorStyle = { padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' };

export default UploadTrialResults;
