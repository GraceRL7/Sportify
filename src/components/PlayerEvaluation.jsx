// C:\sportify\src\components\PlayerEvaluation.js

import React, { useState } from 'react';

// Reusing mock player data
const mockPlayers = [
  { id: 101, name: 'Ava Chen' },
  { id: 102, name: 'Ben Smith' },
  { id: 103, name: 'Cara Lopez' },
  { id: 104, name: 'David Lee' },
];

// Skills to be evaluated (1-5 rating scale)
const skills = ['Technical Skill', 'Fitness & Stamina', 'Teamwork', 'Attitude & Discipline'];

function PlayerEvaluation() {
  const [evaluation, setEvaluation] = useState({
    playerId: '',
    ratings: skills.reduce((acc, skill) => ({ ...acc, [skill]: 3 }), {}), // Default to 3/5
    comments: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (skills.includes(name)) {
      // Handle skill rating changes
      setEvaluation(prev => ({
        ...prev,
        ratings: {
          ...prev.ratings,
          [name]: parseInt(value)
        }
      }));
    } else {
      // Handle player selection or comments
      setEvaluation(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real application, you would send this structured evaluation 
    // to the backend, likely linking it to a specific trial or session.
    console.log('Player Evaluation Submitted:', evaluation);
    alert(`Evaluation for Player ID ${evaluation.playerId} submitted successfully!`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '20px auto' }}>
      <h2>⭐ Evaluate Players</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Player Selection */}
        <div style={formGroupStyle}>
          <label htmlFor="playerId" style={labelStyle}>Select Player:</label>
          <select 
            id="playerId" 
            name="playerId" 
            value={evaluation.playerId} 
            onChange={handleChange} 
            required
            style={inputStyle}
          >
            <option value="">-- Select a Player --</option>
            {mockPlayers.map(player => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </div>
        
        {/* Skill Ratings */}
        <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Skill Assessment (1=Poor, 5=Excellent)</h3>
        
        {skills.map(skill => (
          <div key={skill} style={formGroupStyle}>
            <label style={labelStyle}>{skill}:</label>
            <input
              type="range"
              min="1"
              max="5"
              name={skill}
              value={evaluation.ratings[skill]}
              onChange={handleChange}
              style={{ width: '80%', margin: '0 10px' }}
            />
            <span style={{ fontWeight: 'bold' }}>{evaluation.ratings[skill]}</span>
          </div>
        ))}

        {/* General Comments */}
        <div style={formGroupStyle}>
          <label htmlFor="comments" style={labelStyle}>General Comments:</label>
          <textarea
            id="comments"
            name="comments"
            value={evaluation.comments}
            onChange={handleChange}
            rows="4"
            style={{ ...inputStyle, resize: 'vertical' }}
          ></textarea>
        </div>
        
        <button 
          type="submit"
          disabled={!evaluation.playerId}
          style={{ 
            marginTop: '20px', 
            padding: '10px 20px', 
            backgroundColor: evaluation.playerId ? '#007bff' : '#ccc', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: evaluation.playerId ? 'pointer' : 'not-allowed',
            width: '100%'
          }}
        >
          Submit Evaluation
        </button>
      </form>
    </div>
  );
}

// Simple styling
const formGroupStyle = { marginBottom: '15px' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };

export default PlayerEvaluation;