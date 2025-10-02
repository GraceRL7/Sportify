import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// 🎯 CRITICAL FIX: Import centralized instances
import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  appId as FIREBASE_APP_ID // Import shared app ID
} from '../firebase'; // 🎯 ADJUSTED PATH: Trying '../../firebase' to resolve compiler error

// --- Configuration (Retained for constants only) ---
const firebaseConfig = {
    apiKey: "AIzaSyAzkQJo_aAcs1jvj4VOgzFksINuur9uvb8",
    authDomain: "sportify-df84b.firebaseapp.com",
    projectId: "sportify-df84b",
    storageBucket: "sportify-df84b.firebasestorage.app",
    messagingSenderId: "125792303495",
    appId: "1:125792303495:web:8944023fee1e655eee7b22",
    measurementId: "G-ZBMG376GBS"
};

// --- Component Configuration ---
const TARGET_ROLE = 'admin';

const USER_COLLECTION = `artifacts/${FIREBASE_APP_ID}/public/data/users`; 

const AdminLogin = () => {
  const navigate = useNavigate(); 
  
  const [email, setEmail] = useState('admin@sportify.com'); 
  const [password, setPassword] = useState('admin12@'); 
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }
    
    try {
      // 1. Authenticate user using Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Lookup role using the authenticated user's UID
      const userDocRef = doc(db, USER_COLLECTION, user.uid); 
      const userDocSnap = await getDoc(userDocRef);

      let isAuthorized = false;
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        
        // Authorization check: Must have the correct role stored in Firestore
        isAuthorized = userData.role === TARGET_ROLE;
        
        if (!isAuthorized) {
            console.log(`Authorization Failed: User role is '${userData.role}', expected '${TARGET_ROLE}'.`);
        }
      } else {
          console.error("Authorization Failed: User profile document not found for UID:", user.uid);
      }

      if (isAuthorized) {
        console.log('Admin login successful for UID:', user.uid);
        // Navigation path matches App.jsx route
        navigate('/admin/dashboard');
 
      } else {
        // If authenticated but not authorized as admin, sign out.
        await signOut(auth);
        setError('Access Denied: You do not have administrator privileges.');
      }

    } catch (firebaseError) {
      console.error("Firebase Login Error:", firebaseError);
      let errorMessage = 'Login failed.';
      switch (firebaseError.code) {
        case 'auth/configuration-not-found': 
          errorMessage = 'Configuration Error: Firebase services failed to initialize.';
          break;
        case 'auth/invalid-email':
        case 'auth/user-disabled':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'permission-denied':
          errorMessage = 'Login failed: Insufficient permissions to check role.';
          break;
        default:
          errorMessage = `Login failed: ${firebaseError.code}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <style>
        {`
          /* Embedded CSS (Matching Sportify design) */

          :root {
              --primary-color: #30D5C8; /* Teal */
              --secondary-color: #20143b; /* Dark Blue */
              --dark-text: #333333;
              --medium-text: #555555;
              --light-text: #777777;
              --border-light: #e0e0e0;
              --soft-light-grey: #f8f9fa;
              --clean-white: #ffffff;
              --error-red: #dc3545;
              --success-green: #28a745;
          }

          body {
              font-family: 'Inter', sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }

          .admin-login-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: var(--secondary-color);
              padding: 20px;
              box-sizing: border-box;
          }

          .login-card {
              background-color: var(--clean-white);
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
              text-align: center;
              width: 100%;
              max-width: 400px;
              box-sizing: border-box;
              border: 1px solid var(--border-light);
          }

          .login-card h2 {
              margin-bottom: 25px;
              color: var(--secondary-color); 
              font-size: 1.8em;
              font-weight: 700;
          }

          .input-group {
              margin-bottom: 15px;
              position: relative;
          }

          .login-card input[type="email"],
          .login-card input[type="password"],
          .login-card input[type="text"] {
              width: 100%;
              padding: 12px;
              border: 1px solid var(--border-light);
              border-radius: 8px;
              font-size: 1em;
              box-sizing: border-box;
              background-color: var(--soft-light-grey);
              color: var(--dark-text);
              transition: border-color 0.3s ease, box-shadow 0.3s ease;
          }

          .login-card input[type="email"]:focus,
          .login-card input[type="password"]:focus,
          .login-card input[type="text"]:focus {
              border-color: var(--primary-color);
              outline: none;
              box-shadow: 0 0 0 3px rgba(48, 213, 200, 0.25);
          }

          .password-input-group {
              position: relative;
              display: flex;
              align-items: center;
          }

          .password-input-group input {
              flex-grow: 1;
              padding-right: 60px;
          }

          .show-password-toggle {
              position: absolute;
              right: 12px;
              cursor: pointer;
              font-size: 0.9em;
              color: var(--secondary-color); 
              font-weight: 500;
              user-select: none;
              padding: 2px 5px;
              border-radius: 3px;
          }

          .show-password-toggle:hover {
              color: var(--primary-color);
              text-decoration: underline;
          }

          .login-button {
              width: 100%;
              padding: 14px;
              border: none;
              border-radius: 8px;
              font-size: 1.1em;
              cursor: pointer;
              transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
              margin-top: 20px;
              background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
              color: var(--clean-white);
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
          }

          .login-button:hover:not(:disabled) {
              background: linear-gradient(135deg, #27c2b6 0%, #170e28 100%);
              transform: translateY(-2px);
              box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
          }

          .login-button:disabled {
              background: var(--border-light);
              color: var(--light-text);
              cursor: not-allowed;
              transform: none;
              box-shadow: none;
          }

          .error-message {
              color: var(--error-red);
              margin-top: 5px;
              margin-bottom: 10px;
              font-size: 0.85em;
              text-align: center;
              padding-left: 5px;
          }
          
          .info-message {
              color: var(--success-green);
              margin-top: 15px;
              font-size: 0.9em;
              text-align: center;
          }

          .forgot-password,
          .toggle-link {
              margin-top: 20px;
              font-size: 0.9em;
              color: var(--secondary-color);
              cursor: pointer;
              transition: color 0.2s ease, text-decoration 0.2s ease;
          }

          .forgot-password:hover,
          .toggle-link:hover {
              text-decoration: underline;
              color: var(--primary-color);
          }

          .back-to-main-login {
              margin-top: 15px;
              font-size: 0.9em;
              color: var(--medium-text);
              cursor: pointer;
              transition: color 0.2s ease;
          }

          .back-to-main-login:hover {
              color: var(--dark-text);
              text-decoration: underline;
          }
        `}
      </style>
      <div className="login-card">
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
            />
          </div>
          <div className="input-group password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
            <span
              className="show-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Logging In...' : 'Login'}
          </button>
          
          <p
            className="back-to-main-login"
            onClick={() => navigate('/')} 
          >
            ← Back to Main Login Page
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
