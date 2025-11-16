// C:\sportify\src\components\MarkAttendance.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc } from '../firebase';
import { useNotification } from '../context/NotificationContext';

function MarkAttendance() {
  const { db, appId, userRole, isLoading, userId, userProfile } = useAuth();
  const { addNotification } = useNotification();

  const [roster, setRoster] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState({}); // { playerId: 'Present'/'Absent' }
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // --- Fetch Approved Roster for THIS coach's sport ---
  useEffect(() => {
    if (
      isLoading ||
      userRole !== 'coach' ||
      !db ||
      !appId ||
      !userProfile?.assignedSport
    ) {
      if (!isLoading) setIsDataLoading(false);
      return;
    }

    const rosterCollectionRef = collection(
      db,
      `artifacts/${appId}/public/data/roster`
    );

    // Only approved players in this coach's sport
    const q = query(
      rosterCollectionRef,
      where('status', '==', 'Approved'),
      where('sport', '==', userProfile.assignedSport)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const players = [];
        const initialAttendance = {};
        snapshot.forEach((docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data() };
          players.push(data);
          // Default to Absent (coach toggles to Present)
          initialAttendance[data.id] = 'Absent';
        });
        setRoster(players);
        setAttendanceRecords(initialAttendance);
        setIsDataLoading(false);
      },
      (error) => {
        console.error('Error fetching player roster:', error);
        const msg = 'Failed to load roster.';
        setStatusMessage(msg);
        addNotification(msg, 'error');
        setIsDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, userRole, isLoading, userProfile, addNotification]);

  // --- Toggle Attendance (Present/Absent) ---
  const toggleAttendance = (playerId) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [playerId]: prev[playerId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  // --- Submit Attendance Records ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('Submitting attendance...');

    if (!roster.length) {
      const msg = 'Error: Roster is empty. Cannot submit.';
      setStatusMessage(msg);
      addNotification(msg, 'error');
      return;
    }

    try {
      const recordsToSave = roster.map((player) => ({
        playerId: player.id,
        playerName: player.name,
        sport: player.sport || userProfile?.assignedSport || null,
        status: attendanceRecords[player.id],
        date: attendanceDate,
        coachId: userId,
        coachName: userProfile?.name || null,
        submittedAt: new Date(),
      }));

      const attendanceCollectionRef = collection(
        db,
        `artifacts/${appId}/public/data/attendance_records`
      );

      for (const record of recordsToSave) {
        await addDoc(attendanceCollectionRef, record);
      }

      const msg = `Attendance for ${attendanceDate} successfully recorded!`;
      setStatusMessage(msg);
      addNotification(msg, 'success');
    } catch (error) {
      console.error('Error submitting attendance:', error);
      const msg = 'Failed to record attendance.';
      setStatusMessage(msg);
      addNotification(msg, 'error');
    }
  };

  // --- Loading / Permission checks ---
  if (isLoading || isDataLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading attendance sheet...
      </div>
    );
  }

  if (userRole !== 'coach') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C', // sportify red
        }}
      >
        Permission Denied. Attendance is only available for Coaches.
      </div>
    );
  }

  if (!userProfile?.assignedSport) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        No sport is assigned to your profile. Please contact the admin.
      </div>
    );
  }

  // --- Render Content ---
  const isError =
    statusMessage.includes('Failed') || statusMessage.includes('Error');

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '650px',
        margin: '20px auto',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
        borderTop: '4px solid var(--sportify-yellow)',
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: '10px',
          color: 'var(--sportify-navy)',
        }}
      >
        ✅ Mark Attendance – {userProfile.assignedSport}
      </h2>

      {statusMessage && (
        <p
          style={{
            color: isError ? '#BC0E4C' : '#28a745',
            fontWeight: 600,
            marginBottom: '15px',
          }}
        >
          {statusMessage}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              marginBottom: '5px',
              fontWeight: 'bold',
              fontSize: '0.95rem',
            }}
          >
            Date of Session:
          </label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            required
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
            }}
          />
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {roster.map((player) => (
            <li
              key={player.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: '1px solid #eee',
              }}
            >
              <div>
                <span style={{ fontWeight: 500 }}>{player.name}</span>
                {player.email && (
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      marginTop: 2,
                    }}
                  >
                    {player.email}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleAttendance(player.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  backgroundColor:
                    attendanceRecords[player.id] === 'Present'
                      ? '#28a745'
                      : 'var(--sportify-red)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                {attendanceRecords[player.id] === 'Present'
                  ? 'Present'
                  : 'Absent'}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="submit"
          disabled={!roster.length}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: roster.length
              ? 'var(--sportify-red)'
              : '#cccccc',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: roster.length ? 'pointer' : 'not-allowed',
            width: '100%',
            fontWeight: 600,
          }}
        >
          Save Attendance Records
        </button>
      </form>
    </div>
  );
}

export default MarkAttendance;
