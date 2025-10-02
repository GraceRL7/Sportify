import React from 'react';
import { useNavigate } from 'react-router-dom';
// 🎯 FIX: Path corrected to assume AuthContext is located inside the 'context' folder 
// in the parent directory (e.g., src/context/AuthContext.jsx)
import { useAuth } from '../context/AuthContext'; 

/**
 * Reusable Logout Button component tailored for dashboard sidebars.
 * It uses the AuthContext to log the user out and navigates to the root path.
 * * @param {string} buttonColor - Custom color for the button (e.g., '#dc3545' for Admin).
 * @param {string} label - Text label for the button (e.g., 'Logout').
 */
const LogoutButton = ({ buttonColor, label = 'Logout' }) => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            // 1. Call the centralized logout function
            await logout(); 
            // 2. Redirect to the login selector
            navigate('/');
        } catch (error) {
            console.error("Logout failed during cleanup:", error);
            // Ensure redirection even if state cleanup fails
            navigate('/'); 
        }
    };

    return (
        <div style={{ padding: '10px 20px', borderTop: '1px solid #e0e0e0' }}>
            <button 
                onClick={handleLogout}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: buttonColor || '#dc3545', // Default red if no color is provided
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s'
                }}
            >
                🚪 {label}
            </button>
        </div>
    );
};

export default LogoutButton;
