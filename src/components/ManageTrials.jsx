// C:\sportify\src\components\ManageTrials.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  collection,
  addDoc,
  query,
  onSnapshot,
  where,
} from '../firebase';

function ManageTrials() {
  const { db, appId, userRole, isLoading } = useAuth();
  const { addNotification } = useNotification();

  const [trials, setTrials] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [formData, setFormData] = useState({
    date: '',
    sport: '',
    location: '',
    coachId: '',
  });

  const [message, setMessage] = useState(null);

  // --- EFFECT TO FETCH TRIALS AND COACHES ---
  useEffect(() => {
    if (isLoading || !db || !appId || userRole !== 'admin') {
      if (userRole !== 'admin' && !isLoading) {
        setIsDataLoading(false);
      }
      return;
    }

    const TRIALS_COLLECTION_PATH = `artifacts/${appId}/public/data/trials`;
    const USERS_COLLECTION_PATH = `artifacts/${appId}/public/data/users`;

    // Fetch Trials
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

    // Fetch coaches (users with role = coach)
    const coachesQuery = query(
      collection(db, USERS_COLLECTION_PATH),
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

  // --- handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ADD TRIAL + WRITE NOTIFICATIONS
  const handleAddTrial = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!db || !appId) return;

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
      coachName: selectedCoach.name || selectedCoach.email,
      createdAt: new Date(),
    };

    try {
      const trialsCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/trials`
      );
      await addDoc(trialsCollectionRef, newTrialData);

      // reset form
      setFormData({
        date: '',
        sport: '',
        location: '',
        coachId: '',
      });

      const msg = `New trial for ${newTrialData.sport} scheduled successfully.`;
      setMessage({ type: 'success', text: msg });
      addNotification('New trial scheduled successfully.', 'success');

      // 🔔 ALSO write notifications in Firestore

      const notifRef = collection(
        db,
        `artifacts/${appId}/public/data/notifications`
      );

      // 1. Broadcast to all players
      await addDoc(notifRef, {
        message: `New ${newTrialData.sport} trial scheduled on ${newTrialData.date} at ${newTrialData.location}.`,
        type: 'info',
        targetRole: 'player',
        targetUserId: null, // all players
        createdAt: new Date(),
        related: 'New Trial',
      });

      // 2. Specific notification for the assigned coach
      await addDoc(notifRef, {
        message: `You have been assigned to a ${newTrialData.sport} trial on ${newTrialData.date}.`,
        type: 'info',
        targetRole: 'coach',
        targetUserId: selectedCoach.id,
        createdAt: new Date(),
        related: 'New Trial Assignment',
      });
    } catch (error) {
      console.error('Error adding trial: ', error);
      const msg = `Failed to schedule trial: ${error.message}`;
      setMessage({ type: 'error', text: msg });
      addNotification('Failed to schedule trial.', 'error');
    }

    setTimeout(() => setMessage(null), 5000);
  };

  if (isLoading || isDataLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading trials and coaches…
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        Only administrators can manage trials.
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto' }}>
      <h2
        style={{
          marginTop: 0,
          marginBottom: '16px',
          color: 'var(--sportify-royal, var(--sportify-navy))',
        }}
      >
        📅 Manage Trials
      </h2>

      {message && (
        <div
          style={{
            marginBottom: '18px',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.9rem',
            backgroundColor:
              message.type === 'error'
                ? '#fee2e2'
                : message.type === 'success'
                ? '#dcfce7'
                : '#e5e7eb',
            color:
              message.type === 'error'
                ? '#b91c1c'
                : message.type === 'success'
                ? '#166534'
                : '#374151',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Existing trials table */}
      <h3>Scheduled Trials</h3>
      {trials.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No trials have been scheduled yet.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr
              style={{
                backgroundColor: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
              }}
            >
              <th style={tableHeaderStyle}>Date</th>
              <th style={tableHeaderStyle}>Sport</th>
              <th style={tableHeaderStyle}>Location</th>
              <th style={tableHeaderStyle}>Coach</th>
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

      {/* New trial form */}
      <h3 style={{ marginTop: '30px' }}>Create New Trial</h3>
      <form
        onSubmit={handleAddTrial}
        style={{
          marginTop: '10px',
          padding: '16px',
          borderRadius: '10px',
          backgroundColor: '#ffffff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div style={formGroupStyle}>
            <label htmlFor="date" style={labelStyle}>
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="sport" style={labelStyle}>
              Sport
            </label>
            <input
              type="text"
              id="sport"
              name="sport"
              placeholder="e.g. Football"
              value={formData.sport}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="location" style={labelStyle}>
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Ground / Turf name"
              value={formData.location}
              onChange={handleInputChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label htmlFor="coachId" style={labelStyle}>
              Assign Coach
            </label>
            <select
              id="coachId"
              name="coachId"
              value={formData.coachId}
              onChange={handleInputChange}
              required
              style={inputStyle}
            >
              <option value="">Select coach</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name || coach.email}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: '18px', textAlign: 'right' }}>
          <button type="submit" style={buttonStyle}>
            Save Trial
          </button>
        </div>
      </form>
    </div>
  );
}

// Simple styling
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
