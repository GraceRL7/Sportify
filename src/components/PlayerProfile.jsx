// C:\sportify\src\components\PlayerProfile.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';

const PlayerProfile = () => {
  const { user, userProfile, isLoading, db, appId } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    sport: '',
  });
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState({ title: '', year: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Populate from profile
  useEffect(() => {
    if (userProfile && user) {
      setFormData({
        name: userProfile.name || '',
        email: user.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        sport: userProfile.sport || 'N/A',
      });
      setAchievements(userProfile.achievements || []);
    }
  }, [userProfile, user]);

  const userDocPath = `artifacts/${appId}/public/data/users/${user?.uid}`;

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    if (!user || !user.uid || !db) {
      setMessage({ type: 'error', text: 'Error: User not authenticated.' });
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, userDocPath);
      await updateDoc(docRef, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
      });
      setMessage({
        type: 'success',
        text: 'Personal details updated successfully!',
      });
    } catch (error) {
      console.error('Error updating personal details:', error);
      setMessage({
        type: 'error',
        text: `Failed to update details: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAchievement = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!newAchievement.title || !newAchievement.year) {
      setMessage({
        type: 'error',
        text: 'Achievement title and year are required.',
      });
      return;
    }
    if (!user || !user.uid || !db) {
      setMessage({ type: 'error', text: 'Error: User not authenticated.' });
      return;
    }

    const updatedAchievements = [...achievements, newAchievement];

    try {
      const docRef = doc(db, userDocPath);
      await updateDoc(docRef, {
        achievements: updatedAchievements,
      });

      setAchievements(updatedAchievements);
      setNewAchievement({ title: '', year: '' });
      setMessage({
        type: 'success',
        text: 'Achievement added successfully!',
      });
    } catch (error) {
      console.error('Error adding achievement:', error);
      setMessage({
        type: 'error',
        text: `Failed to add achievement: ${error.message}`,
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading profile data...
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        Please log in to view your profile.
      </div>
    );
  }

  // --- UI styles using Sportify colours ---
  const card = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
    padding: '20px 24px',
    marginBottom: '25px',
    borderTop: '4px solid var(--sportify-yellow)',
  };

  const sectionTitle = {
    color: 'var(--sportify-navy)',
    borderBottom: '1px solid #eef0f4',
    paddingBottom: '6px',
    marginBottom: '18px',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const pill = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(188,14,76,0.08)',
    color: '#BC0E4C',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  return (
    <div style={{ padding: '10px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header row with avatar + summary */}
      <div
        style={{
          display: 'flex',
          gap: '18px',
          alignItems: 'center',
          marginBottom: '18px',
        }}
      >
        <div
          style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            background:
              'linear-gradient(135deg, var(--sportify-red), var(--sportify-yellow))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.4rem',
          }}
        >
          {formData.name
            ? formData.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
            : 'P'}
        </div>

        <div>
          <div style={pill}>Player Profile</div>
          <h2 style={{ margin: '6px 0 4px', color: 'var(--sportify-navy)' }}>
            {formData.name || 'Player'}
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
            {formData.sport && formData.sport !== 'N/A'
              ? `${formData.sport} | Sportify Academy`
              : 'Sportify Academy'}
          </p>
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            marginBottom: '18px',
            fontSize: '0.9rem',
            backgroundColor:
              message.type === 'error' ? '#f8d7da' : '#d4edda',
            color: message.type === 'error' ? '#721c24' : '#155724',
            border: `1px solid ${
              message.type === 'error' ? '#f5c6cb' : '#c3e6cb'
            }`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* PERSONAL DETAILS CARD */}
      <div style={card}>
        <div style={sectionTitle}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: 'rgba(53,79,96,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}
          >
            👤
          </span>
          <span>1. Personal & Contact Details</span>
        </div>

        <form onSubmit={handleUpdateDetails} style={formGridStyle}>
          <div style={formGroupStyle}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Email (Read Only)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              style={{
                ...inputStyle,
                backgroundColor: '#f5f5f7',
                cursor: 'not-allowed',
              }}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleFormChange}
              required
              style={inputStyle}
            />
          </div>

          <div style={formGroupStyle}>
            <label style={labelStyle}>Primary Sport</label>
            <input
              type="text"
              name="sport"
              value={formData.sport}
              readOnly
              style={{
                ...inputStyle,
                backgroundColor: '#f5f5f7',
                cursor: 'not-allowed',
              }}
            />
          </div>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Saving...' : 'Update Details'}
          </button>
        </form>
      </div>

      {/* ACHIEVEMENTS CARD */}
      <div style={card}>
        <div style={sectionTitle}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,197,1,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.9rem',
            }}
          >
            🏆
          </span>
          <span>2. Sporting Achievements</span>
        </div>

        <div style={achievementsListStyle}>
          {achievements.length === 0 ? (
            <p style={{ fontStyle: 'italic', color: '#6c757d', margin: 0 }}>
              No achievements added yet. Start building your Sportify journey!
            </p>
          ) : (
            achievements.map((item, index) => (
              <div key={index} style={achievementItemStyle}>
                <strong>{item.title}</strong>{' '}
                <span style={{ color: '#666' }}>({item.year})</span>
              </div>
            ))
          )}
        </div>

        <h4
          style={{
            borderBottom: '1px dashed #eee',
            paddingBottom: '5px',
            marginTop: '20px',
            marginBottom: '10px',
            fontSize: '1rem',
            color: 'var(--sportify-navy)',
          }}
        >
          Add New Achievement
        </h4>

        <form
          onSubmit={handleAddAchievement}
          style={{ display: 'flex', gap: '10px', alignItems: 'center' }}
        >
          <input
            type="text"
            placeholder="Title (e.g., District Level Winner)"
            value={newAchievement.title}
            onChange={(e) =>
              setNewAchievement({ ...newAchievement, title: e.target.value })
            }
            required
            style={inputStyle}
          />
          <input
            type="number"
            placeholder="Year"
            value={newAchievement.year}
            onChange={(e) =>
              setNewAchievement({ ...newAchievement, year: e.target.value })
            }
            required
            style={{ ...inputStyle, maxWidth: '100px' }}
          />
          <button
            type="submit"
            style={{
              ...buttonStyle,
              backgroundColor: 'var(--sportify-yellow)',
              color: '#333',
              marginTop: 0,
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </form>
      </div>
    </div>
  );
};

// layout styles
const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '18px 24px',
};

const formGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
};

const labelStyle = {
  marginBottom: '5px',
  fontWeight: 'bold',
  fontSize: '0.9em',
  color: '#343a40',
};

const inputStyle = {
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #d0d4dc',
  boxSizing: 'border-box',
  width: '100%',
  fontSize: '0.9rem',
};

const buttonStyle = {
  gridColumn: 'span 2',
  padding: '11px 15px',
  backgroundColor: 'var(--sportify-red)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  marginTop: '8px',
  fontWeight: 600,
  fontSize: '0.95rem',
};

const achievementsListStyle = {
  padding: '10px',
  border: '1px solid #e1e4eb',
  borderRadius: '8px',
  backgroundColor: '#f8f9fb',
  minHeight: '50px',
};

const achievementItemStyle = {
  padding: '5px 0',
  borderBottom: '1px dotted #e0e0e0',
};

export default PlayerProfile;
