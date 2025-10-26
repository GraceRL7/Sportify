import React, { useState, useEffect } from 'react';
// 1. Import useAuth to get the *correct* context values
import { useAuth } from '../context/AuthContext';
// 2. Import functions from the central firebase file
import { doc, updateDoc } from 'firebase/firestore';

// 3. --- REMOVED separate Firebase initialization ---
// We will get 'db' and 'appId' from the useAuth() hook.


const PlayerProfile = () => {
    // 4. Get the CORRECT values from context (user is lowercase)
    const { user, userProfile, isLoading, db, appId } = useAuth();
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        sport: ''
    });
    const [achievements, setAchievements] = useState([]);
    const [newAchievement, setNewAchievement] = useState({ title: '', year: '' });
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    // Populate form fields and achievements when userProfile loads
    useEffect(() => {
        // 5. Check for 'user' (lowercase)
        if (userProfile && user) {
            setFormData({
                name: userProfile.name || '',
                email: user.email || '', // Use Auth email as primary email
                phoneNumber: userProfile.phoneNumber || '',
                sport: userProfile.sport || 'N/A'
            });
            setAchievements(userProfile.achievements || []);
        }
    }, [userProfile, user]);

    // 6. Construct the path using context values
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
            // 7. Use the 'db' instance from the context
            const docRef = doc(db, userDocPath);
            await updateDoc(docRef, {
                name: formData.name,
                phoneNumber: formData.phoneNumber,
            });
            setMessage({ type: 'success', text: 'Personal details updated successfully!' });
        } catch (error) {
            console.error("Error updating personal details:", error);
            setMessage({ type: 'error', text: `Failed to update details: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };
    
    const handleAddAchievement = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!newAchievement.title || !newAchievement.year) {
            setMessage({ type: 'error', text: 'Achievement title and year are required.' });
            return;
        }
        if (!user || !user.uid || !db) {
            setMessage({ type: 'error', text: 'Error: User not authenticated.' });
            return;
        }

        const updatedAchievements = [...achievements, newAchievement];

        try {
            // 8. Use the 'db' instance from the context
            const docRef = doc(db, userDocPath);
            await updateDoc(docRef, {
                achievements: updatedAchievements,
            });
            
            setAchievements(updatedAchievements);
            setNewAchievement({ title: '', year: '' });
            setMessage({ type: 'success', text: 'Achievement added successfully!' });
        } catch (error) {
            console.error("Error adding achievement:", error);
            setMessage({ type: 'error', text: `Failed to add achievement: ${error.message}` });
        }
    };
    
    // RENDER LOGIC
    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Loading profile data...</div>;
    }

    // 9. This check is now against 'user' (lowercase)
    if (!user) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#dc3545' }}>Please log in to view your profile.</div>;
    }


    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
            <h2>👤 My Profile Management</h2>
            
            {/* Status Message */}
            {message && (
                <div style={alertStyle(message.type)}>
                    {message.text}
                </div>
            )}
            
            {/* --- SECTION 1: PERSONAL DETAILS --- */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>1. Personal & Contact Details</h3>
                <form onSubmit={handleUpdateDetails} style={formGridStyle}>
                    
                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Full Name:</label>
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
                        <label style={labelStyle}>Email (Read Only):</label>
                        <input 
                            type="email" 
                            name="email"
                            value={formData.email}
                            readOnly
                            style={{...inputStyle, backgroundColor: '#f0f0f0'}}
                        />
                    </div>

                    <div style={formGroupStyle}>
                        <label style={labelStyle}>Phone Number:</label>
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
                        <label style={labelStyle}>Primary Sport:</label>
                        <input 
                            type="text" 
                            name="sport"
                            value={formData.sport}
                            readOnly
                            style={{...inputStyle, backgroundColor: '#f0f0f0'}}
                        />
                    </div>

                    <button type="submit" disabled={loading} style={buttonStyle}>
                        {loading ? 'Saving...' : 'Update Details'}
                    </button>
                </form>
            </div>

            {/* --- SECTION 2: SPORTING ACHIEVEMENTS --- */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>2. Sporting Achievements</h3>
                
                {/* List of Current Achievements */}
                <div style={achievementsListStyle}>
                    {achievements.length === 0 ? (
                        <p style={{ fontStyle: 'italic', color: '#6c757d' }}>No achievements added yet.</p>
                    ) : (
                        achievements.map((item, index) => (
                            <div key={index} style={achievementItemStyle}>
                                <strong>{item.title}</strong> ({item.year})
                            </div>
                        ))
                    )}
                </div>

                {/* Form to Add New Achievement */}
                <h4 style={{ borderBottom: '1px dashed #eee', paddingBottom: '5px', marginTop: '20px' }}>Add New Achievement</h4>
                <form onSubmit={handleAddAchievement} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Title (e.g., Regional Cup Winner)"
                        value={newAchievement.title}
                        onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                        required
                        style={inputStyle}
                    />
                    <input 
                        type="number" 
                        placeholder="Year"
                        value={newAchievement.year}
                        onChange={(e) => setNewAchievement({...newAchievement, year: e.target.value})}
                        required
                        style={{...inputStyle, maxWidth: '100px'}}
                    />
                    <button type="submit" style={{...buttonStyle, backgroundColor: '#28a745', flexShrink: 0, marginTop: 0}}>
                        Add
                    </button>
                </form>

            </div>
        </div>
    );
};

// --- STYLING ---
const sectionStyle = {
    padding: '20px',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    marginBottom: '25px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

const sectionTitleStyle = {
    color: '#007bff',
    borderBottom: '2px solid #007bff',
    paddingBottom: '5px',
    marginBottom: '20px',
    fontSize: '1.4em'
};

const formGridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px 30px',
};

const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
};

const labelStyle = { 
    marginBottom: '5px', 
    fontWeight: 'bold', 
    fontSize: '0.9em',
    color: '#343a40'
};

const inputStyle = { 
    padding: '10px', 
    borderRadius: '4px', 
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    width: '100%',
};

const buttonStyle = { 
    gridColumn: 'span 2',
    padding: '10px 15px', 
    backgroundColor: '#007bff', 
    color: 'white', 
    border: 'none', 
    borderRadius: '4px', 
    cursor: 'pointer',
    marginTop: '10px',
    fontWeight: '600'
};

const achievementsListStyle = {
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#f8f9fa',
    minHeight: '50px'
};

const achievementItemStyle = {
    padding: '5px 0',
    borderBottom: '1px dotted #e0e0e0'
};

const alertStyle = (type) => ({
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '20px',
    fontWeight: 'bold',
    backgroundColor: type === 'error' ? '#f8d7da' : '#d4edda',
    color: type === 'error' ? '#721c24' : '#155724',
    border: `1px solid ${type === 'error' ? '#f5c6cb' : '#c3e6cb'}`
});

export default PlayerProfile;