import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// Assuming '../firebase' correctly exports all necessary Firestore functions
import { collection, query, where, onSnapshot, updateDoc, doc } from '../firebase'; 

// Simple styling (kept local)
const buttonStyle = { padding: '8px 12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const tableHeaderStyle = { padding: '12px', border: 'none' };
const tableCellStyle = { padding: '12px', border: 'none' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '30px' };


function ApproveRegistrations() {
    // Destructure properties from the Auth Context
    const { db, appId, userRole, isLoading } = useAuth();
    
    const [pendingApplications, setPendingApplications] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState('');

    useEffect(() => {
        // 1. Initial Check: Return if context data is still loading or missing
        // This prevents running Firestore logic before everything is ready.
        if (isLoading || !db || !appId) {
            setIsDataLoading(true);
            return;
        }
        
        // 2. Role Check: Stop the listener setup if the user isn't an admin
        // We still need the check later, but here we prevent unnecessary database calls.
        if (userRole !== 'admin') {
            setIsDataLoading(false);
            return; 
        }

        // Collection Path: Centralized collection for pending applications
        const masterApplicationsCollectionRef = collection(db, `artifacts/${appId}/admin/pending_applications`);

        // Query: Filter applications where status is 'Pending Review'
        const q = query(masterApplicationsCollectionRef, where("status", "==", "Pending Review"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                applications.push({ id: doc.id, ...doc.data() });
            });
            setPendingApplications(applications);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching pending applications:", error);
            setIsDataLoading(false);
            // This message covers both Index errors and Rule errors
            setStatusMessage("Failed to load applications. Check Firestore rules/index.");
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
        
    }, [db, appId, userRole, isLoading]); // Dependency array: Re-run when these change

    const handleAction = async (docId, status) => {
        if (!db || !appId) {
            setStatusMessage("Error: Database connection not ready.");
            return;
        }
        
        // Doc Path: Update the document in the centralized admin collection
        const docRef = doc(db, `artifacts/${appId}/admin/pending_applications`, docId);

        try {
            await updateDoc(docRef, { status: status, reviewDate: new Date() });
            setStatusMessage(`Application ${docId} set to ${status}.`);
            
            // NOTE: If status is 'Approved', you would typically trigger another action here
            // like creating a final user profile/roster entry and removing the pending application.

        } catch (error) {
            console.error(`Error updating status to ${status}:`, error);
            setStatusMessage(`Failed to set status to ${status}. Ensure your Admin role has UPDATE permission.`);
        }
    };

    // --- RENDER CHECKS ---
    
    // Show a loading state until context is resolved
    if (isLoading || isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Panel...</div>;
    }
    
    // Show permission denied ONLY after loading is complete and role is confirmed not 'admin'
    if (userRole !== 'admin') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied. Must be an Admin. (Current Role: {userRole})</div>;
    }
    
    // --- Render Content ---
    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px' }}>
            <h2>✔️ Approve Player Registrations</h2>
            
            {statusMessage && (
                <p style={{ color: statusMessage.includes('Failed') ? 'red' : 'green', fontWeight: 'bold' }}>
                    {statusMessage}
                </p>
            )}

            <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                Pending Applications ({pendingApplications.length})
            </h3>
            
            {pendingApplications.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: 'green' }}>No new applications pending approval.</p>
            ) : (
                <table style={tableStyle}>
                    <thead>
                        <tr style={{ backgroundColor: '#fffbe6' }}>
                            <th style={tableHeaderStyle}>User ID</th>
                            <th style={tableHeaderStyle}>Sport</th>
                            <th style={tableHeaderStyle}>DOB</th>
                            <th style={tableHeaderStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingApplications.map((player) => (
                            <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tableCellStyle}>{player.userId?.substring(0, 8)}...</td>
                                <td style={tableCellStyle}>{player.sport}</td>
                                <td style={tableCellStyle}>{player.dob}</td>
                                <td style={tableCellStyle}>
                                    <button 
                                        onClick={() => handleAction(player.id, 'Approved')} 
                                        style={{ ...buttonStyle, backgroundColor: '#28a745', marginRight: '10px' }}
                                    >
                                        Approve
                                    </button>
                                    <button 
                                        onClick={() => handleAction(player.id, 'Rejected')} 
                                        style={{ ...buttonStyle, backgroundColor: '#dc3545' }}
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default ApproveRegistrations;