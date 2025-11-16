// C:\sportify\src\components\TrialApplication.jsx

import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

// --- Styling ---
const trialCardStyle = {
  padding: '15px',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  backgroundColor: 'white',
  marginBottom: '10px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
const trialCardTitle = {
  fontSize: '1.2em',
  fontWeight: '600',
  color: '#007bff',
};
const trialCardDetails = {
  fontSize: '0.9em',
  color: '#555',
  margin: '5px 0',
};
const applyButtonStyle = {
  padding: '8px 15px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
};
const formGroupStyle = { marginBottom: '15px' };
const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontWeight: 'bold',
};
const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ced4da',
  boxSizing: 'border-box',
};

function TrialApplication() {
  const { user, userId, db, appId, userRole, isLoading, userProfile } =
    useAuth();
  const { addNotification } = useNotification();

  const [trials, setTrials] = useState([]);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    phoneNumber: '',
    aadhar: '',
    experience: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Fetch Trials Effect ---
  useEffect(() => {
    if (isLoading || !db || !appId) return;

    const trialsCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/trials`
    );

    const unsubscribe = onSnapshot(
      trialsCollectionRef,
      (snapshot) => {
        const trialList = [];
        snapshot.forEach((docSnap) => {
          trialList.push({ id: docSnap.id, ...docSnap.data() });
        });
        setTrials(trialList);
        setIsDataLoading(false);
      },
      (error) => {
        console.error('Error fetching trials: ', error);
        addNotification('Failed to load available trials.', 'error');
        setIsDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, isLoading, addNotification]);

  // --- Pre-fill Form Effect ---
  useEffect(() => {
    if (userProfile) {
      setFormData((prev) => ({
        ...prev,
        fullName: userProfile.name || '',
        phoneNumber: userProfile.phoneNumber || '',
        dob: userProfile.dob || '',
      }));
    }
  }, [userProfile]);

  // --- Input Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handlePhoneInput = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value.slice(0, 10),
    }));
  };

  const handleAadharInput = (e) => {
    const value = e.target.value.replace(/[^0-9-]/g, ''); // Allow digits and hyphens
    // Auto-format
    let formattedValue = value.replace(/-/g, '');
    if (formattedValue.length > 4) {
      formattedValue = formattedValue.slice(0, 4) + '-' + formattedValue.slice(4);
    }
    if (formattedValue.length > 9) {
      formattedValue = formattedValue.slice(0, 9) + '-' + formattedValue.slice(9);
    }
    setFormData((prev) => ({
      ...prev,
      aadhar: formattedValue.slice(0, 14),
    }));
  };

  // --- Handle Form Submission with Validation & Notifications ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const phoneRegex = /^\d{10}$/;
    const aadharRegex = /^\d{4}-\d{4}-\d{4}$/;

    if (!phoneRegex.test(formData.phoneNumber)) {
      addNotification('Phone number must be exactly 10 digits.', 'error');
      return;
    }

    if (formData.aadhar && !aadharRegex.test(formData.aadhar)) {
      addNotification(
        'Aadhar number must be in XXXX-XXXX-XXXX format (12 digits).',
        'error'
      );
      return;
    }

    setIsSubmitting(true);

    if (!db || !userId || !selectedTrial) {
      addNotification(
        'Error: Authentication or trial selection is not ready.',
        'error'
      );
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Application data to admin collection
      const applicationData = {
        fullName: formData.fullName,
        dob: formData.dob,
        phoneNumber: formData.phoneNumber,
        aadhar: formData.aadhar,
        experience: formData.experience,
        userId: userId,
        email: user?.email,
        sport: selectedTrial.sport,
        trialId: selectedTrial.id,
        trialName: `${selectedTrial.sport} on ${selectedTrial.date}`,
        submissionDate: new Date(),
        status: 'Pending Review',
      };

      const profileData = {
        name: formData.fullName,
        phoneNumber: formData.phoneNumber,
        dob: formData.dob,
        sport: selectedTrial.sport,
      };

      const adminApplicationPath = collection(
        db,
        `artifacts/${appId}/admin/data/pending_applications`
      );
      const userProfileRef = doc(
        db,
        `artifacts/${appId}/public/data/users`,
        userId
      );

      await addDoc(adminApplicationPath, applicationData);
      await updateDoc(userProfileRef, profileData);

      // 2. 🔔 ALSO write a notification document for this player
      const notifRef = collection(
        db,
        `artifacts/${appId}/public/data/notifications`
      );

      await addDoc(notifRef, {
        message: 'Your trial application was submitted successfully.',
        type: 'success',
        targetRole: 'player',
        targetUserId: userId,
        createdAt: new Date(), // stored as Timestamp by Firestore
        related: `Trial: ${selectedTrial.sport} on ${selectedTrial.date}`,
      });

      // 3. Local toast
      addNotification(
        'Application submitted successfully! Your profile is updated.',
        'success'
      );

      // Reset and go back
      setSelectedTrial(null);
      setFormData({
        fullName: '',
        dob: '',
        phoneNumber: '',
        aadhar: '',
        experience: '',
      });
    } catch (error) {
      addNotification(
        'Application submission failed. Please try again.',
        'error'
      );
      console.error('Error submitting trial application: ', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmittingDisabled =
    isLoading || userRole !== 'player' || isSubmitting;

  // --- Render Logic ---
  if (isLoading || isDataLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading available trials...
      </div>
    );
  }
  if (userRole !== 'player') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#dc3545',
        }}
      >
        Access Denied: Only players can submit trial applications.
      </div>
    );
  }

  // --- STEP 2: Show the Application Form ---
  if (selectedTrial) {
    return (
      <div
        style={{
          padding: '20px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          maxWidth: '500px',
          margin: '20px auto',
          backgroundColor: 'white',
        }}
      >
        <button
          onClick={() => setSelectedTrial(null)}
          style={{
            ...applyButtonStyle,
            backgroundColor: '#777',
            marginBottom: '15px',
          }}
        >
          &larr; Back to Trial List
        </button>

        <h2>📝 Apply for {selectedTrial.sport}</h2>
        <p style={trialCardDetails}>
          <strong>Date:</strong> {selectedTrial.date} |{' '}
          <strong>Location:</strong> {selectedTrial.location}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={formGroupStyle}>
            <label htmlFor="fullName" style={labelStyle}>
              Full Name:
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="dob" style={labelStyle}>
              Date of Birth:
            </label>
            <input
              type="date"
              id="dob"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="phoneNumber" style={labelStyle}>
              Phone Number:
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneInput}
              onInput={handlePhoneInput}
              required
              style={inputStyle}
              maxLength="10"
              placeholder="10 digits e.g. 9876543210"
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="aadhar" style={labelStyle}>
              Aadhar Number (Optional):
            </label>
            <input
              type="text"
              id="aadhar"
              name="aadhar"
              value={formData.aadhar}
              onChange={handleAadharInput}
              onInput={handleAadharInput}
              style={inputStyle}
              placeholder="XXXX-XXXX-XXXX"
              maxLength="14"
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="experience" style={labelStyle}>
              Years of Experience:
            </label>
            <input
              type="number"
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              min="0"
              required
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmittingDisabled}
            style={{
              ...applyButtonStyle,
              width: '100%',
              padding: '12px',
              fontSize: '1em',
              backgroundColor: isSubmitting ? '#ccc' : '#28a745',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm and Apply'}
          </button>
        </form>
      </div>
    );
  }

  // --- STEP 1: Show the List of Available Trials ---
  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '20px auto' }}>
      <h2>Available Trials</h2>
      <p
        style={{
          color: '#555',
          marginTop: 0,
          marginBottom: '20px',
        }}
      >
        Select a trial from the list below to apply.
      </p>

      {trials.length === 0 ? (
        <p>No trials are currently scheduled by the admin.</p>
      ) : (
        <div>
          {trials.map((trial) => (
            <div key={trial.id} style={trialCardStyle}>
              <div>
                <div style={trialCardTitle}>{trial.sport}</div>
                <div style={trialCardDetails}>
                  <strong>Date:</strong> {trial.date}
                </div>
                <div style={trialCardDetails}>
                  <strong>Location:</strong> {trial.location}
                </div>
              </div>
              <button
                style={applyButtonStyle}
                onClick={() => setSelectedTrial(trial)}
              >
                Apply Now
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TrialApplication;
