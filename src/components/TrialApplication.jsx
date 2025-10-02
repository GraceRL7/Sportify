import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc } from '../firebase'; 

function TrialApplication() {
  const { db, userId, appId, userRole, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    sport: '',
    dob: '',
    experience: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState(null); // 'success', 'error', 'submitting'

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmissionStatus('submitting');

    if (!db || !userId) {
        setSubmissionStatus('error');
        console.error("Database connection or User ID not ready.");
        alert('Error: Authentication is not ready. Please try again.');
        return;
    }

    try {
        // Data to be saved in Firestore
        const applicationData = {
            ...formData,
            userId: userId,
            submissionDate: new Date(),
            status: 'Pending Review', // AdminDashboard will change this
        };

        // Firestore Path for PRIVATE player data: 
        // /artifacts/{appId}/users/{userId}/trial_applications
        const applicationsCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/trial_applications`);

        await addDoc(applicationsCollectionRef, applicationData);

        setSubmissionStatus('success');
        setFormData({ sport: '', dob: '', experience: '' }); // Clear form
        setTimeout(() => setSubmissionStatus(null), 3000);
        
    } catch (error) {
        setSubmissionStatus('error');
        console.error("Error submitting trial application: ", error);
        alert('Application submission failed. Check console for details.');
    }
  };
  
  // Prevent form submission if authentication is loading or user is not a player
  const isSubmittingDisabled = isLoading || userRole !== 'player' || submissionStatus === 'submitting';

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading application form...</div>;
  }

  if (userRole !== 'player') {
      return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Access Denied: Only players can submit trial applications.</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', maxWidth: '400px', margin: '20px auto', backgroundColor: 'white' }}>
      <h2>📝 Apply for Trials</h2>
      
      {submissionStatus === 'success' && (
        <div style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '5px', marginBottom: '15px' }}>
          Application submitted successfully! Awaiting Admin review.
        </div>
      )}
       {submissionStatus === 'error' && (
        <div style={{ padding: '10px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb', borderRadius: '5px', marginBottom: '15px' }}>
          Submission failed. See console for details.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={formGroupStyle}>
          <label htmlFor="sport" style={labelStyle}>Preferred Sport:</label>
          <select 
            id="sport" 
            name="sport" 
            value={formData.sport} 
            onChange={handleChange} 
            required
            style={inputStyle}
            disabled={isSubmittingDisabled}
          >
            <option value="">Select a Sport</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
            <option value="cricket">Cricket</option>
          </select>
        </div>
        
        <div style={formGroupStyle}>
          <label htmlFor="dob" style={labelStyle}>Date of Birth:</label>
          <input
            type="date"
            id="dob"
            name="dob"
            value={formData.dob}
            onChange={handleChange}
            required
            style={inputStyle}
            disabled={isSubmittingDisabled}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="experience" style={labelStyle}>Years of Experience:</label>
          <input
            type="number"
            id="experience"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
            required
            style={inputStyle}
            disabled={isSubmittingDisabled}
          />
        </div>
        
        <button 
          type="submit"
          disabled={isSubmittingDisabled}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: isSubmittingDisabled ? '#ccc' : '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isSubmittingDisabled ? 'not-allowed' : 'pointer',
            width: '100%',
            transition: 'background-color 0.3s'
          }}
        >
          {submissionStatus === 'submitting' ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
      <p style={{ marginTop: '15px', fontSize: '0.8em', color: '#666', textAlign: 'center' }}>
        Current User ID: {userId}
      </p>
    </div>
  );
}

const formGroupStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ced4da', boxSizing: 'border-box' };

export default TrialApplication;