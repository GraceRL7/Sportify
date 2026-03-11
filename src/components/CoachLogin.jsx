import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// 1. Import useAuth
import { useAuth } from '../context/AuthContext';
import { auth, db, appId } from '../firebase'; 


// --- COACH-SPECIFIC CONSTANTS ---
const TARGET_ROLE = 'coach';
const FIREBASE_APP_ID = appId; 
const USER_PROFILE_COLLECTION = `artifacts/${FIREBASE_APP_ID}/public/data/users`; 
// --------------------------------


const CoachLogin = () => {
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

      const userDocRef = doc(db, USER_PROFILE_COLLECTION, user.uid);
      const userDocSnap = await getDoc(userDocRef);

      const userRole = userDocSnap.data()?.role;
      const userData = userDocSnap.data();

      // Check only for the 'coach' role
      if (userDocSnap.exists() && userRole === TARGET_ROLE) { 
        // 3. SET GLOBAL STATE on success
        setUserProfile(userData);
        setUserRole(userRole);
        
        setSuccessMessage('Login successful!');
        navigate('/coach-dashboard'); 
      } else {
        setError('Invalid credentials or unauthorized role. Please check your email and password.');
        await signOut(auth); // Use imported signOut
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

      // Create the profile with 'coach' role
      await setDoc(doc(db, USER_PROFILE_COLLECTION, user.uid), {
        email: user.email,
        role: TARGET_ROLE, // Assign 'coach' role
        createdAt: new Date(),
      });

      setSuccessMessage('Coach account created successfully! Please log in.');
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
          :root {
            --sportify-navy:   #002c47;
            --sportify-red:    #BC0E4C;
            --sportify-yellow: #FFC501;

            --coach-green:      #16a34a;
            --coach-green-dark: #166534;

            --error-red:   #DC2626;
            --border-light:#e5e7eb;
            --border-subtle:#e5e7eb;
            --clean-white:#ffffff;
            --soft-light-grey:#f3f4f6;

            --dark-text:#111827;
            --medium-text:#4b5563;
            --light-text:#9ca3af;
            --secondary-color:#002c47;
          }

          body {
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            background-color: var(--sportify-navy);
          }

          .login-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background-color: var(--sportify-navy);
            padding: 20px;
            box-sizing: border-box;
          }

          .login-box {
            background-color: var(--clean-white);
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 18px 45px rgba(15, 23, 42, 0.18);
            text-align: center;
            width: 100%;
            max-width: 420px;
            box-sizing: border-box;
            border: 1px solid var(--border-light);
          }

          .login-box h2 {
            margin-bottom: 25px;
            color: var(--dark-text);
            font-size: 1.9em;
            font-weight: 800;
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
            border-radius: 12px;
            font-size: 1em;
            box-sizing: border-box;
            background-color: #eef2ff;
            color: var(--dark-text);
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
          }

          .login-box input::placeholder {
            color: var(--light-text);
          }

          .login-box input:focus {
            border-color: var(--coach-green);
            outline: none;
            box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.25);
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
            right: 14px;
            cursor: pointer;
            font-size: 0.9em;
            color: var(--secondary-color);
            font-weight: 500;
            user-select: none;
            padding: 3px 6px;
            border-radius: 4px;
            transition: color 0.2s ease, background-color 0.2s ease;
          }

          .show-password-toggle:hover {
            color: var(--coach-green);
            background-color: rgba(148, 163, 184, 0.12);
          }

          .login-button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 999px;
            font-size: 1.05em;
            cursor: pointer;
            transition: background-color 0.3s ease, transform 0.2s ease, box-shadow 0.2s ease;
            margin-top: 20px;
            background-color: var(--coach-green);
            color: var(--clean-white);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 9px 20px rgba(22, 163, 74, 0.35);
          }

          .login-button:hover:not(:disabled) {
            background-color: var(--coach-green-dark);
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(22, 163, 74, 0.45);
          }

          .login-button:disabled {
            background-color: #d1d5db;
            color: var(--light-text);
            cursor: not-allowed;
            box-shadow: none;
            transform: none;
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
            color: var(--coach-green);
            margin-top: 10px;
            margin-bottom: 15px;
            font-size: 0.95em;
          }

          .password-rules {
            list-style: none;
            padding: 10px 15px;
            margin: 5px 0 15px 0;
            text-align: left;
            font-size: 0.8em;
            color: var(--dark-text);
            background-color: var(--soft-light-grey);
            border-radius: 8px;
            border: 1px solid var(--border-subtle);
          }

          .password-rules li {
            margin-bottom: 4px;
            display: flex;
            align-items: center;
          }

          .password-rules li.valid::before {
            content: '✔';
            color: var(--coach-green);
            margin-right: 8px;
            font-weight: bold;
            font-size: 1.1em;
          }

          .password-rules li:not(.valid)::before {
            content: '✖';
            color: var(--error-red);
            margin-right: 8px;
            font-weight: bold;
            font-size: 1.1em;
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
            color: var(--coach-green);
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

          @media (max-width: 600px) {
            .login-box {
              padding: 30px 24px;
            }
            .login-box h2 {
              font-size: 1.6em;
            }
          }
        `}
      </style>

      <div className="login-box">
        <h2>
          {isSignUp ? 'Coach Sign Up' : forgotPassword ? 'Reset Password' : 'Coach Login'}
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

export default CoachLogin;