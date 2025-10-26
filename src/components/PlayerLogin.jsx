import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';

// 1. Import useAuth
import { useAuth } from '../context/AuthContext';
import { auth, db, appId } from '../firebase';


// IMPORTANT: Firebase configuration for your project (Homifi)
const firebaseConfig = {
    apiKey: "AIzaSyAzkQJo_aAcs1jvj4VOgzFksINuur9uvb8",
    authDomain: "sportify-df84b.firebaseapp.com",
    projectId: "sportify-df84b",
    storageBucket: "sportify-df84b.firebasestorage.app",
    messagingSenderId: "125792303495",
    appId: "1:125792303495:web:8944023fee1e655eee7b22", // The correct Sportify App ID
    measurementId: "G-ZBMG376GBS"
};

const FIREBASE_APP_ID = appId; // Use the imported appId
// STANDARD PROFILE PATH: Use the path your app is built around
const USER_PROFILE_COLLECTION = `artifacts/${FIREBASE_APP_ID}/public/data/users`; 


const PlayerLogin = () => {
  const navigate = useNavigate();
  // 2. Get setters from useAuth
  const { setUserProfile, setUserRole } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [forgotPassword, setForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [passwordRules, setPasswordRules] = useState({
    minLength: false, maxLength: false, hasUpperCase: false, hasLowerCase: false,
    hasNumber: false, hasSpecialChar: false,
  });
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  
  const validatePassword = (pwd) => {
    const minLength = 5; 
    const maxLength = 10; 
    const rules = {
      minLength: pwd.length >= minLength,
      maxLength: pwd.length <= maxLength,
      hasUpperCase: /[A-Z]/.test(pwd),
      hasLowerCase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecialChar: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
    setPasswordRules(rules);
    return Object.values(rules).every(Boolean);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check the complex, nested path
      const userDocRef = doc(db, USER_PROFILE_COLLECTION, user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const userRole = userDocSnap.data()?.role;
      const userData = userDocSnap.data();

      // Accept either 'player' or the original 'user' role
      if (userDocSnap.exists() && (userRole === 'player' || userRole === 'user')) { 
        // 3. SET GLOBAL STATE on success
        setUserProfile(userData);
        setUserRole(userRole);
        
        setSuccessMessage('Login successful!');
        // Navigation path matches App.jsx route
        navigate('/player-dashboard'); 
      } else {
        setError('Invalid credentials or unauthorized role. Please check your email and password.');
        await auth.signOut();
      }

    } catch (error) {
      let errorMessage = 'Login failed.';
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Invalid email or password.';
          break;
        default:
          errorMessage = `Login failed: ${error.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email || !password || !confirmPassword) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (!validatePassword(password)) {
      setError('Password does not meet all requirements.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // --- 4. CREATE FULL PROFILE ON SIGNUP ---
      // Create the profile in the complex, nested path
      await setDoc(doc(db, USER_PROFILE_COLLECTION, user.uid), {
        email: user.email,
        role: 'player', // Assign 'player' role
        createdAt: new Date(),
        name: '', // Initialize new fields as empty
        phoneNumber: '',
        sport: '',
        dob: '',
        achievements: [] // Initialize achievements array
      });

      setSuccessMessage('Account created successfully! Please log in.');
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setShowPasswordRules(false);
      setPasswordRules({ minLength: false, maxLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false, });

    } catch (error) {
      let errorMessage = 'Sign up failed.';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        default:
          errorMessage = `Sign up failed: ${error.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset link sent to: ' + email);
      setForgotPassword(false);
      setEmail('');
    } catch (error) {
      let errorMessage = 'Failed to send reset email.';
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No user found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address format.';
          break;
        default:
          errorMessage = `Failed to send reset email: ${error.message}`;
          break;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <style>
        {`
          /* UserLogin.css - Embedded for Canvas compatibility */

          /* HomiFi Color Palette */
          :root {
              --homifi-teal: #30D5C8;
              --homifi-dark-blue: #20143b;
              --homifi-darker-blue: #000069;
              --homifi-deepest-blue: #000040;

              --dark-text: #333333;
              --medium-text: #555555;
              --light-text: #777777;
              --border-light: #e0e0e0;
              --border-subtle: #eeeeee;

              --clean-white: #ffffff;
              --soft-light-grey: #f8f9fa;
              --very-light-blue-teal: #e0f7fa;

              --success-green: #28a745;
              --error-red: #dc3545;
              --warning-orange: #ffc107;
          }

          body {
              font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }

          .login-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background-color: var(--homifi-dark-blue);
              padding: 20px;
              box-sizing: border-box;
          }

          .login-box {
              background-color: var(--clean-white);
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(32, 20, 59, 0.1);
              text-align: center;
              width: 100%;
              max-width: 400px;
              box-sizing: border-box;
              border: 1px solid var(--border-light);
          }

          .login-box h2 {
              margin-bottom: 25px;
              color: var(--homifi-dark-blue);
              font-size: 1.8em;
              font-weight: 700;
          }

          .input-group {
              margin-bottom: 15px;
              position: relative;
          }

          .login-box input[type="email"],
          .login-box input[type="password"],
          .login-box input[type="text"] {
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

          .login-box input[type="email"]::placeholder,
          .login-box input[type="password"]::placeholder,
          .login-box input[type="text"]::placeholder {
              color: var(--medium-text);
          }

          .login-box input[type="email"]:focus,
          .login-box input[type="password"]:focus,
          .login-box input[type="text"]:focus {
              border-color: var(--homifi-teal);
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
              padding-right: 40px;
          }

          .show-password-toggle {
              position: absolute;
              right: 12px;
              cursor: pointer;
              font-size: 0.9em;
              color: var(--homifi-dark-blue);
              font-weight: 500;
              user-select: none;
              padding: 2px 5px;
              border-radius: 3px;
              transition: color 0.2s ease;
          }

          .show-password-toggle:hover {
              color: var(--homifi-darker-blue);
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
              background: linear-gradient(135deg, var(--homifi-teal) 0%, var(--homifi-dark-blue) 100%);
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
              background-color: var(--border-light);
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
              text-align: left;
              padding-left: 5px;
          }

          .success-message {
              color: var(--success-green);
              margin-top: 10px;
              margin-bottom: 15px;
              font-size: 0.95em;
          }

          .password-rules {
              list-style: none;
              padding: 0;
              margin: 5px 0 15px 0;
              text-align: left;
              font-size: 0.8em;
              color: var(--dark-text);
              background-color: var(--soft-light-grey);
              border-radius: 8px;
              padding: 10px 15px;
              border: 1px solid var(--border-subtle);
          }

          .password-rules li {
              margin-bottom: 3px;
              display: flex;
              align-items: center;
          }

          .password-rules li::before {
              content: '✖';
              color: var(--error-red);
              margin-right: 8px;
              font-weight: bold;
              font-size: 1.1em;
          }

          .password-rules li.valid::before {
              content: '✔';
              color: var(--success-green);
          }

          .forgot-password,
          .toggle-link {
              margin-top: 20px;
              font-size: 0.9em;
              color: var(--homifi-dark-blue);
              cursor: pointer;
              transition: color 0.2s ease, text-decoration 0.2s ease;
          }

          .forgot-password:hover,
          .toggle-link:hover {
              text-decoration: underline;
              color: var(--homifi-teal);
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

          /* Responsive Design */
          @media (max-width: 600px) {
              .login-box {
                  padding: 30px 25px;
                  margin: 20px;
              }
              .login-box h2 {
                  font-size: 1.6em;
                  margin-bottom: 20px;
              }
              .login-box input, .login-button {
                  padding: 10px;
                  font-size: 0.9em;
              }
              .password-rules {
                  padding: 8px 10px;
                  font-size: 0.75em;
              }
          }
        `}
      </style>
      <div className="login-box">
        <h2>
          {isSignUp ? 'Player Sign Up' : forgotPassword ? 'Reset Password' : 'Player Login'}
        </h2>

        {successMessage && <p className="success-message">{successMessage}</p>}

        {forgotPassword ? (
          <form onSubmit={handleForgotPassword}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
              {error && <p className="error-message">{error}</p>}
            </div>
            <button
              type="submit"
              className="login-button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="toggle-link" onClick={() => { setForgotPassword(false); setError(''); setSuccessMessage(''); setEmail(''); }}>
              ← Back to Login
            </p>
          </form>
        ) : (
          <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
              />
              {error && email && !email.includes('@') && <p className="error-message">Invalid email format.</p>}
            </div>
            {/* Password input with show/hide toggle */}
            <div className="input-group password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (isSignUp) { validatePassword(e.target.value); }
                  setError('');
                }}
                onFocus={() => { if (isSignUp) setShowPasswordRules(true); }}
                onBlur={() => {
                  if (isSignUp && password === '') { setShowPasswordRules(false); }
                }}
                required
              />
              <span
                className="show-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </span>
            </div>
            {isSignUp && showPasswordRules && (
              <ul className="password-rules">
                <li className={passwordRules.minLength ? 'valid' : ''}>Min 5 characters</li>
                <li className={passwordRules.maxLength ? 'valid' : ''}>Max 10 characters</li>
                <li className={passwordRules.hasUpperCase ? 'valid' : ''}>At least one uppercase letter (A-Z)</li>
                <li className={passwordRules.hasLowerCase ? 'valid' : ''}>At least one lowercase letter (a-z)</li>
                <li className={passwordRules.hasNumber ? 'valid' : ''}>At least one number (0-9)</li>
                <li className={passwordRules.hasSpecialChar ? 'valid' : ''}>At least one special character (!@#$%^&*)</li>
              </ul>
            )}
            {isSignUp && (
              <div className="input-group password-input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                />
                <span
                  className="show-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </span>
              </div>
            )}

            {error && !successMessage && <p className="error-message">{error}</p>}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Login'}
            </button>

            {!isSignUp && (
              <p className="forgot-password" onClick={() => { setForgotPassword(true); setError(''); setSuccessMessage(''); }}>
                Forgot Password?
              </p>
            )}

            <p
              className="toggle-link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setForgotPassword(false);
                setError('');
                setSuccessMessage('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
                setShowPasswordRules(false);
                setPasswordRules({ minLength: false, maxLength: false, hasUpperCase: false, hasLowerCase: false, hasNumber: false, hasSpecialChar: false, });
              }}
            >
              {isSignUp ? 'Already have an account? Login here →' : "Don't have an account? Sign up here →"}
            </p>

            <p
              className="back-to-main-login"
              onClick={() => navigate('/')} 
            >
              ← Back to Main Login Page
            </p>

          </form>
        )}
      </div>
    </div>
  );
};

export default PlayerLogin;