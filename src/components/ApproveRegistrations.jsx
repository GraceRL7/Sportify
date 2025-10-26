import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
// 1. Import 'doc' and 'updateDoc' from the central firebase file
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

    // --- PATHS ---
    const collectionPath = `artifacts/${appId}/admin/data/pending_applications`;
    const usersCollectionPath = `artifacts/${appId}/public/data/users`; // Path to main user profiles

    useEffect(() => {
        // Initial Check
        if (isLoading || !db || !appId) {
            setIsDataLoading(true);
            return;
        }
        
        // Role Check
        if (userRole !== 'admin') {
            setIsDataLoading(false);
            return; 
        }

        const masterApplicationsCollectionRef = collection(db, collectionPath);
        const q = query(masterApplicationsCollectionRef, where("status", "==", "Pending Review"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = [];
            snapshot.forEach((doc) => {
                // Ensure the application has a userId before adding
                if (doc.data().userId) { 
                    applications.push({ id: doc.id, ...doc.data() });
                } else {
                    console.warn("Found pending application without a userId:", doc.id);
                }
            });
            setPendingApplications(applications);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching pending applications:", error);
            setIsDataLoading(false);
            setStatusMessage("Failed to load applications. Check Firestore rules/index.");
        });

        // Cleanup listener on component unmount
        return () => unsubscribe();
        
    }, [db, appId, userRole, isLoading, collectionPath]); 

    // --- UPDATED handleAction ---
    const handleAction = async (applicationId, status) => {
        if (!db || !appId) {
            setStatusMessage("Error: Database connection not ready.");
            return;
        }

        // Find the specific application data in the current state
        const application = pendingApplications.find(app => app.id === applicationId);
        if (!application || !application.userId) {
             setStatusMessage("Error: Could not find application data or user ID.");
             console.error("Missing application data for ID:", applicationId, application);
             return;
        }
        
        const applicationDocRef = doc(db, collectionPath, applicationId);
        const userDocRef = doc(db, usersCollectionPath, application.userId); // Reference to the main user profile

        try {
            // 1. Update the application document status
            await updateDoc(applicationDocRef, { 
                status: status, 
                reviewDate: new Date() 
            });
            setStatusMessage(`Application ${applicationId} status set to ${status}.`);

            // 2. --- NEW: If approved, update the main user profile ---
            if (status === 'Approved') {
                try {
                    await updateDoc(userDocRef, {
                        role: 'player', // Grant the player role
                        status: 'Approved', // Optional: add an approval status field
                        approvedDate: new Date()
                    });
                    setStatusMessage(`Application ${applicationId} Approved. Player role granted to user ${application.userId}.`);
                } catch (profileError) {
                    console.error(`Error updating user profile ${application.userId}:`, profileError);
                    // Rollback application status? Or just show error? For now, show error.
                    setStatusMessage(`Application ${applicationId} status updated, but FAILED to grant player role: ${profileError.message}`);
                }
            }
            
            // Optional: Consider deleting the application document after processing
            // await deleteDoc(applicationDocRef);

        } catch (error) {
            console.error(`Error updating status to ${status}:`, error);
            setStatusMessage(`Failed to set status to ${status}. Ensure your Admin role has UPDATE permission.`);
        }
    };

    // --- RENDER CHECKS ---
    if (isLoading || isDataLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Admin Panel...</div>;
    }
    
    if (userRole !== 'admin') {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Permission Denied. Must be an Admin. (Current Role: {userRole})</div>;
    }
    
    // --- Render Content ---
    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '20px auto', backgroundColor: 'white', borderRadius: '8px' }}>
            <h2>✔️ Approve Player Registrations</h2>
            
            {statusMessage && (
                <p style={{ 
                    padding: '10px', 
                    borderRadius: '5px', 
                    fontWeight: 'bold',
                    color: statusMessage.includes('Failed') || statusMessage.includes('Error') ? '#721c24' : '#155724',
                    backgroundColor: statusMessage.includes('Failed') || statusMessage.includes('Error') ? '#f8d7da' : '#d4edda',
                    border: `1px solid ${statusMessage.includes('Failed') || statusMessage.includes('Error') ? '#f5c6cb' : '#c3e6cb'}`
                 }}>
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
                            <th style={tableHeaderStyle}>Applicant Email</th> 
                            <th style={tableHeaderStyle}>Sport</th>
                            <th style={tableHeaderStyle}>DOB</th>
                            <th style={tableHeaderStyle}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingApplications.map((player) => (
                            <tr key={player.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={tableCellStyle}>{player.email || 'No Email Provided'}</td> 
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