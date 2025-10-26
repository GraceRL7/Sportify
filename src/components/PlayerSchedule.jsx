import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// 1. Import 'query' which might have been implicitly used before
import { collection, query, where, onSnapshot } from '../firebase'; 

function PlayerSchedule() {
    // 2. Get userRole from context
    const { db, userId, appId, isLoading, userRole } = useAuth(); 
    const [schedule, setSchedule] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        // 3. Add userRole to the initial check
        if (isLoading || !db || !userId || !userRole) {
            setIsDataLoading(false); // Stop loading if context isn't ready
            return;
        }

        const scheduleCollectionRef = collection(db, `artifacts/${appId}/public/data/schedules`);
        
        // --- 4. CONDITIONAL QUERY based on Role ---
        let q;
        if (userRole === 'player') {
            // Player Query: Only schedules targeting this specific player
            q = query(scheduleCollectionRef, where("targetUserIds", "array-contains", userId));
        } else if (userRole === 'coach') {
            // Coach Query: Fetch ALL schedules (Coaches see everything)
            q = query(scheduleCollectionRef); 
        } else {
            // If role is unrecognized or admin, don't fetch anything for now
            setIsDataLoading(false);
            return;
        }
        // --- End Conditional Query ---

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events = [];
            snapshot.forEach((doc) => {
                events.push({ id: doc.id, ...doc.data() });
            });
            // Sort events by date (newest first)
            events.sort((a, b) => new Date(b.date) - new Date(a.date)); 
            setSchedule(events);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching schedule:", error);
            setIsDataLoading(false);
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
        
    // 5. Add userRole to the dependency array
    }, [db, userId, appId, isLoading, userRole]); 


    if (isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading schedule...</div>;
    }
    
    // 6. Add a check for roles that shouldn't see this component (optional but good practice)
    if (userRole !== 'player' && userRole !== 'coach') {
         return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Schedule view not available for your role.</div>;
    }

    if (schedule.length === 0) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>No upcoming events currently scheduled {userRole === 'player' ? 'for you' : 'in the system'}.</div>;
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
                            // Using sport name for color coding if available, otherwise default blue
                            borderLeft: `5px solid ${event.sport === 'Football' ? '#dc3545' : event.sport === 'Basketball' ? '#ffc107' : '#007bff'}`,
                            borderRadius: '5px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            backgroundColor: 'white'
                        }}
                    >
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2em', color: '#333' }}>
                            {/* Display sport if available */}
                            {event.sport ? `${event.sport} Trial` : 'Scheduled Event'} 
                        </h3>
                        <p style={{ margin: '0', color: '#555' }}>
                            <strong>Date:</strong> {event.date} {event.time ? `at ${event.time}` : ''}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                            <strong>Location:</strong> {event.location || 'N/A'}
                        </p>
                        <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>
                            <strong>Coach:</strong> {event.coachName || 'N/A'}
                        </p>
                        {/* Optionally display details if they exist */}
                        {event.details && (
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', fontStyle: 'italic' }}>
                                {event.details}
                            </p>
                        )}
                    </div>
                ))}
            </div>
            {/* Displaying user ID might be confusing for coach, removed */}
            {/* <p style={{ marginTop: '20px', fontSize: '0.8em', color: '#666', textAlign: 'center' }}>
                Fetching data for User ID: {userId}
            </p> */}
        </div>
    );
}

export default PlayerSchedule;