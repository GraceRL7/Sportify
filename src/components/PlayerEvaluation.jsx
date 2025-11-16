// C:\sportify\src\components\PlayerEvaluation.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc } from '../firebase';
import { useNotification } from '../context/NotificationContext';

const skills = [
  'Technical Skill',
  'Fitness & Stamina',
  'Teamwork',
  'Attitude & Discipline',
];

function PlayerEvaluation() {
  const { db, appId, userRole, isLoading, userProfile, userId } = useAuth();
  const { addNotification } = useNotification();

  const [players, setPlayers] = useState([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const [evaluation, setEvaluation] = useState({
    playerId: '',
    sessionType: '',
    ratings: skills.reduce((acc, skill) => ({ ...acc, [skill]: 3 }), {}),
    comments: '',
  });

  // Load players for this coach's sport
  useEffect(() => {
    if (isLoading || !db || !appId || userRole !== 'coach' || !userProfile?.assignedSport) {
      return;
    }

    const rosterRef = collection(db, `artifacts/${appId}/public/data/roster`);
    const q = query(
      rosterRef,
      where('status', '==', 'Approved'),
      where('sport', '==', userProfile.assignedSport)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setPlayers(list);
        setLoadingPlayers(false);
      },
      (err) => {
        console.error('Error loading players for evaluation:', err);
        addNotification('Failed to load players for evaluation.', 'error');
        setLoadingPlayers(false);
      }
    );

    return () => unsub();
  }, [db, appId, userRole, isLoading, userProfile, addNotification]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (skills.includes(name)) {
      setEvaluation((prev) => ({
        ...prev,
        ratings: { ...prev.ratings, [name]: Number(value) },
      }));
    } else {
      setEvaluation((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!evaluation.playerId) {
      addNotification('Please choose a player to evaluate.', 'warning');
      return;
    }

    try {
      const evalRef = collection(db, `artifacts/${appId}/public/data/player_evaluations`);

      await addDoc(evalRef, {
        playerId: evaluation.playerId,
        sessionType: evaluation.sessionType || 'General',
        ratings: evaluation.ratings,
        comments: evaluation.comments,
        coachId: userId,
        coachName: userProfile?.name || null,
        sport: userProfile?.assignedSport || null,
        createdAt: new Date(),
      });

      addNotification('Player evaluation saved successfully.', 'success');

      // reset
      setEvaluation({
        playerId: '',
        sessionType: '',
        ratings: skills.reduce((acc, skill) => ({ ...acc, [skill]: 3 }), {}),
        comments: '',
      });
    } catch (err) {
      console.error('Error saving evaluation:', err);
      addNotification('Failed to save evaluation.', 'error');
    }
  };

  if (userRole !== 'coach') {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#BC0E4C' }}>
        Evaluation is only available for coaches.
      </div>
    );
  }

  if (loadingPlayers) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading players…</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '650px', margin: '20px auto' }}>
      <h2 style={{ color: 'var(--sportify-navy)' }}>⭐ Evaluate Players</h2>

      <form onSubmit={handleSubmit}>
        {/* Player Selection */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Select Player:</label>
          <select
            name="playerId"
            value={evaluation.playerId}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">-- Select a Player --</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || p.fullName || p.email || p.id}
              </option>
            ))}
          </select>
        </div>

        {/* Type of evaluation (trial / training etc.) */}
        <div style={formGroupStyle}>
          <label style={labelStyle}>Session / Evaluation Type:</label>
          <input
            type="text"
            name="sessionType"
            placeholder="e.g. Fitness Trial, Matchday, Weekly Review"
            value={evaluation.sessionType}
            onChange={handleChange}
            style={inputStyle}
          />
        </div>

        <h3 style={{ marginTop: '25px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>
          Skill Assessment (1 = Poor, 5 = Excellent)
        </h3>

        {skills.map((skill) => (
          <div key={skill} style={formGroupStyle}>
            <label style={labelStyle}>{skill}</label>
            <input
              type="range"
              min="1"
              max="5"
              name={skill}
              value={evaluation.ratings[skill]}
              onChange={handleChange}
              style={{ width: '80%' }}
            />
            <span style={{ fontWeight: '600', marginTop: '4px' }}>
              {evaluation.ratings[skill]}
            </span>
          </div>
        ))}

        <div style={formGroupStyle}>
          <label style={labelStyle}>Comments / Notes:</label>
          <textarea
            name="comments"
            value={evaluation.comments}
            onChange={handleChange}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <button type="submit" style={buttonStyle}>
          Save Evaluation
        </button>
      </form>
    </div>
  );
}

const formGroupStyle = { marginBottom: '15px', display: 'flex', flexDirection: 'column' };
const labelStyle = { fontWeight: '600', marginBottom: '5px', fontSize: '0.92em' };
const inputStyle = {
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ced4da',
  boxSizing: 'border-box',
  width: '100%',
};
const buttonStyle = {
  marginTop: '20px',
  padding: '10px 20px',
  backgroundColor: 'var(--sportify-red)',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  width: '100%',
};

export default PlayerEvaluation;
