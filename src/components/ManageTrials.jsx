// C:\sportify\src\components\ManageTrials.jsx (Updated with Notifications)

import React, { useState, useEffect } from 'react';
// 1. Import useAuth to get the authenticated user and db
import { useAuth } from '../context/AuthContext';
// 2. Import ALL firestore functions from your central firebase.js file
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
} from '../firebase';
// 3. Import Notification context
import { useNotification } from '../context/NotificationContext';

function ManageTrials() {
  // 4. Get authenticated context (db and userRole will now be correct)
  const { db, appId, userRole, isLoading } = useAuth();
  const { addNotification } = useNotification();

  const [trials, setTrials] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    sport: '',
    location: '',
    coachId: '',
  });
  const [message, setMessage] = useState(null);

  const [coaches, setCoaches] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // --- EFFECT TO FETCH TRIALS AND COACHES ---
  useEffect(() => {
    // 5. This check will now pass because useAuth provides all values
    if (isLoading || !db || !appId || userRole !== 'admin') {
      if (userRole !== 'admin' && !isLoading) {
        setIsDataLoading(false);
      }
      return;
    }

    const TRIALS_COLLECTION_PATH = `artifacts/${appId}/public/data/trials`;
    const COACHES_COLLECTION_PATH = `artifacts/${appId}/public/data/users`;

    // 6. Fetch Trials
    const trialsUnsub = onSnapshot(
      collection(db, TRIALS_COLLECTION_PATH),
      (snapshot) => {
        const fetchedTrials = [];
        snapshot.forEach((docSnap) => {
          fetchedTrials.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetchedTrials.sort((a, b) => new Date(a.date) - new Date(b.date));
        setTrials(fetchedTrials);
      },
      (error) => {
        console.error('Error fetching trials:', error);
        const msg = 'Failed to load trials from database.';
        setMessage({ type: 'error', text: msg });
        addNotification(msg, 'error');
      }
    );

    // 7. Fetch REAL Coaches
    const coachesQuery = query(
      collection(db, COACHES_COLLECTION_PATH),
      where('role', '==', 'coach')
    );
    const coachesUnsub = onSnapshot(
      coachesQuery,
      (snapshot) => {
        const fetchedCoaches = [];
        snapshot.forEach((docSnap) => {
          fetchedCoaches.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCoaches(fetchedCoaches);
        setIsDataLoading(false);
      },
      (error) => {
        console.error('Error fetching coaches:', error);
        const msg = 'Failed to load coaches list.';
        setMessage({ type: 'error', text: msg });
        addNotification(msg, 'error');
        setIsDataLoading(false);
      }
    );

    return () => {
      trialsUnsub();
      coachesUnsub();
    };
  }, [db, appId, userRole, isLoading, addNotification]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTrial = async (e) => {
    e.preventDefault();
    setMessage(null);

    const selectedCoach = coaches.find((c) => c.id === formData.coachId);

    if (!selectedCoach) {
      const msg = 'Please select a valid coach.';
      setMessage({ type: 'error', text: msg });
      addNotification(msg, 'error');
      return;
    }

    const newTrialData = {
      date: formData.date,
      sport: formData.sport,
      location: formData.location,
      coachId: selectedCoach.id,
      coachName: selectedCoach.name || selectedCoach.email, // Use name or email
      createdAt: new Date(),
    };

    try {
      const trialsCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/trials`
      );
      await addDoc(trialsCollectionRef, newTrialData);

      setFormData({ date: '', sport: '', location: '', coachId: '' });

      const msg = `New trial for ${newTrialData.sport} successfully scheduled.`;
      setMessage({ type: 'success', text: msg });
      addNotification('New trial scheduled successfully.', 'success');
    } catch (error) {
      console.error('Error adding document: ', error);
      const msg = `Failed to schedule trial: ${error.message}`;
      setMessage({ type: 'error', text: msg });
      addNotification('Failed to schedule trial.', 'error');
    }

    setTimeout(() => setMessage(null), 5000);
  };

  // 8. Loading checks
  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Authenticating...
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#dc3545',
        }}
      >
        Permission Denied. Must be an Admin.
      </div>
    );
  }

  if (isDataLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading Trials and Coach Data...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '900px',
        margin: '20px auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
      }}
    >
      <h2>🗓️ Manage Upcoming Trials</h2>

      {/* Status Message */}
      {message && (
        <p
          style={{
            padding: '10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            backgroundColor:
              message.type === 'error'
                ? '#f8d7da'
                : message.type === 'success'
                ? '#d4edda'
                : '#fff3cd',
            color:
              message.type === 'error'
                ? '#721c24'
                : message.type === 'success'
                ? '#155724'
                : '#856404',
            marginBottom: '20px',
          }}
        >
          {message.text}
        </p>
      )}

      {/* ADD NEW TRIAL FORM */}
      <div
        style={{
          border: '1px solid #28a745',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          backgroundColor: '#e6ffe6',
        }}
      >
        <h3 style={{ marginTop: '0', color: '#28a745' }}>
          Add New Trial Event
        </h3>
        <form
          onSubmit={handleAddTrial}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '15px',
          }}
        >
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
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name || coach.email}
                  {coach.assignedSport ? ` (${coach.assignedSport})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              gridColumn: 'span 4',
              textAlign: 'right',
              paddingTop: '10px',
            }}
          >
            <button type="submit" style={buttonStyle}>
              Schedule Trial
            </button>
          </div>
        </form>
      </div>

      {/* UPCOMING TRIALS LIST */}
      <h3
        style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}
      >
        Upcoming Scheduled Trials ({trials.length})
      </h3>

      {trials.length === 0 ? (
        <p style={{ fontStyle: 'italic', color: '#666' }}>
          No trials are currently scheduled.
        </p>
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
              <tr
                key={trial.id}
                style={{ borderBottom: '1px solid #eee' }}
              >
                <td style={tableCellStyle}>{trial.date}</td>
                <td style={tableCellStyle}>{trial.sport}</td>
                <td style={tableCellStyle}>{trial.location}</td>
                <td
                  style={{
                    ...tableCellStyle,
                    fontWeight: 'bold',
                    color: '#007bff',
                  }}
                >
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
const labelStyle = {
  marginBottom: '5px',
  fontWeight: 'bold',
  fontSize: '0.9em',
};
const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc',
  boxSizing: 'border-box',
};
const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '1em',
};
const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left',
  marginBottom: '30px',
};
const tableHeaderStyle = { padding: '12px', border: 'none' };
const tableCellStyle = { padding: '12px', border: 'none' };

export default ManageTrials;
