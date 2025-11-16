// C:\sportify\src\components\AdminLogin.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Get global auth context setters
import { useAuth } from '../context/AuthContext';

// Firebase helpers from your central firebase file
import {
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  doc,
  getDoc,
  appId as FIREBASE_APP_ID,
} from '../firebase';

// --- Admin-specific config ---
const TARGET_ROLE = 'admin';
const USER_COLLECTION = `artifacts/${FIREBASE_APP_ID}/public/data/users`;

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setUserProfile, setUserRole } = useAuth();

  // Default admin credentials (you can change/remove)
  const [email, setEmail] = useState('admin@sportify.com');
  const [password, setPassword] = useState('admin12@');

  const [error, setError] = useState('');
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
      // 1) Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // 2) Read profile from Firestore to check role
      const userDocRef = doc(db, USER_COLLECTION, user.uid);
      const userDocSnap = await getDoc(userDocRef);

      let isAuthorized = false;
      let userData = null;

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
        isAuthorized = userData.role === TARGET_ROLE;

        if (isAuthorized) {
          // 3) Update global context + localStorage
          setUserProfile(userData);
          setUserRole(userData.role);
          localStorage.setItem('role', userData.role);
          localStorage.setItem('userId', user.uid);
        } else {
          console.log(
            `Authorization failed: role is '${userData.role}', expected '${TARGET_ROLE}'.`
          );
        }
      } else {
        console.error(
          'Authorization failed: user profile document not found for UID:',
          user.uid
        );
      }

      if (isAuthorized) {
        console.log('Admin login successful for UID:', user.uid);
        navigate('/admin/dashboard');
      } else {
        // Authenticated but not an admin – sign out again
        await signOut(auth);
        setError(
          'Access Denied: You do not have administrator privileges for this account.'
        );
      }
    } catch (firebaseError) {
      console.error('Firebase Login Error:', firebaseError);
      let errorMessage = 'Login failed.';

      switch (firebaseError.code) {
        case 'auth/invalid-email':
        case 'auth/user-disabled':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        case 'permission-denied':
          errorMessage =
            'Login failed: Insufficient permissions to check role.';
          break;
        case 'auth/configuration-not-found':
          errorMessage =
            'Configuration error: Firebase services failed to initialize.';
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
    <div className="admin-login-page">
      <style>
        {`
          :root {
            --admin-primary: #4c1d95;     /* Deep purple */
            --admin-primary-light: #7c3aed;
            --admin-bg-start: #eef2ff;
            --admin-bg-end: #ffe4e6;
            --admin-text-dark: #111827;
            --admin-text-muted: #6b7280;
            --admin-error: #dc2626;
            --admin-border: #e5e7eb;
            --clean-white: #ffffff;
          }

          .admin-login-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: radial-gradient(circle at top left, var(--admin-bg-start), var(--admin-bg-end));
            box-sizing: border-box;
          }

          .admin-login-card {
            width: 100%;
            max-width: 420px;
            background: var(--clean-white);
            border-radius: 18px;
            box-shadow: 0 20px 45px rgba(15, 23, 42, 0.18);
            padding: 32px 32px 28px;
            box-sizing: border-box;
          }

          .admin-login-title {
            font-size: 1.9rem;
            font-weight: 700;
            text-align: center;
            color: var(--admin-primary);
            margin-bottom: 4px;
          }

          .admin-login-subtitle {
            text-align: center;
            color: var(--admin-text-muted);
            font-size: 0.95rem;
            margin-bottom: 20px;
          }

          .admin-error-banner {
            background-color: #fee2e2;
            color: var(--admin-error);
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 0.85rem;
            margin-bottom: 14px;
            text-align: center;
          }

          .admin-input-group {
            margin-bottom: 14px;
          }

          .admin-label {
            display: block;
            font-size: 0.85rem;
            color: var(--admin-text-dark);
            margin-bottom: 4px;
            text-align: left;
          }

          .admin-input-wrapper {
            position: relative;
          }

          .admin-input {
            width: 100%;
            padding: 10px 12px;
            border-radius: 10px;
            border: 1px solid var(--admin-border);
            font-size: 0.95rem;
            box-sizing: border-box;
            background-color: #f9fafb;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
          }

          .admin-input:focus {
            outline: none;
            border-color: var(--admin-primary-light);
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.32);
          }

          .admin-show-toggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 0.8rem;
            color: var(--admin-primary-light);
            cursor: pointer;
            user-select: none;
          }

          .admin-login-button {
            margin-top: 10px;
            width: 100%;
            padding: 11px 14px;
            border-radius: 9999px;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            color: #f9fafb;
            cursor: pointer;
            background: linear-gradient(135deg, var(--admin-primary-light), var(--admin-primary));
            box-shadow: 0 10px 20px rgba(79, 70, 229, 0.35);
            transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
          }

          .admin-login-button:disabled {
            opacity: 0.7;
            cursor: default;
            box-shadow: none;
          }

          .admin-login-button:not(:disabled):hover {
            transform: translateY(-1px);
            box-shadow: 0 14px 28px rgba(79, 70, 229, 0.45);
          }

          .admin-back-link {
            margin-top: 16px;
            text-align: center;
            font-size: 0.9rem;
            color: var(--admin-primary);
            cursor: pointer;
          }

          .admin-back-link:hover {
            text-decoration: underline;
          }
        `}
      </style>

      <div className="admin-login-card">
        <div className="admin-login-title">Admin Login</div>
        <div className="admin-login-subtitle">
          Sign in with your Sportify admin credentials.
        </div>

        {error && <div className="admin-error-banner">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="admin-input-group">
            <label className="admin-label" htmlFor="admin-email">
              Email
            </label>
            <div className="admin-input-wrapper">
              <input
                id="admin-email"
                type="email"
                className="admin-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="admin-input-group">
            <label className="admin-label" htmlFor="admin-password">
              Password
            </label>
            <div className="admin-input-wrapper">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="admin-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                autoComplete="current-password"
                required
              />
              <span
                className="admin-show-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login-button"
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div
          className="admin-back-link"
          onClick={() => navigate('/')}
        >
          ← Back to Main Login Page
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
