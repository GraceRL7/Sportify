import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from '../firebase'; 

function PlayerSchedule() {
    const { db, userId, appId, isLoading } = useAuth();
    const [schedule, setSchedule] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (isLoading || !db || !userId) return;

        // Collection path: /artifacts/{appId}/public/data/schedules
        const scheduleCollectionRef = collection(db, `artifacts/${appId}/public/data/schedules`);
        
        // Query to filter events relevant to the current user
        const q = query(scheduleCollectionRef, where("targetUserIds", "array-contains", userId));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = [];
            snapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() });
            });
            setSchedule(events);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching schedule:", error);
            setIsDataLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
    }, [db, userId, appId, isLoading]);


    if (isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading schedule...</div>;
    }
    if (schedule.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No upcoming events currently scheduled for you.</div>;
    }

    return (
        <div style={{ padding: '20px', maxWidth: '700px', margin: '20px auto' }}>
            <h2>📅 Upcoming Schedule</h2>
            
            <div style={{ display: 'grid', gap: '20px' }}>
                {schedule.map(event => (
                    <div 
                        key={event.id} 
                        style={{ 
                            padding: '15px', 
                            borderLeft: `5px solid ${event.type === 'Game Day' ? '#dc3545' : event.type === 'Trial Review' ? '#ffc107' : '#007bff'}`,
                            borderRadius: '5px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: 'white'
                        }}
                    >
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2em', color: '#333' }}>
                            {event.type}
                        </h3>
                        <p style={{ margin: '0', color: '#555' }}>
                            **{event.date}** at **{event.time}**
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                            **Location:** {event.location}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', fontStyle: 'italic' }}>
                            {event.details || "No details provided."}
                        </p>
                    </div>
                ))}
            </div>
            <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#666', textAlign: 'center' }}>
                Fetching data for User ID: {userId}
            </p>
        </div>
    );
}

export default PlayerSchedule;