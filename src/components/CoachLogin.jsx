import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  doc, 
  getDoc,
  signOut 
} from "../firebase"; // 🎯 Original path, confirmed to be the required relative path if CoachLogin is in src/components/

const TARGET_ROLE = "coach";
const COACH_COLLECTION = "coaches";

const CoachLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("coach@sportify.com"); // Added default email
  const [password, setPassword] = useState("coach12@"); // Added default password
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const coachDocRef = doc(db, COACH_COLLECTION, user.uid);
      const coachDocSnap = await getDoc(coachDocRef);

      if (coachDocSnap.exists() && coachDocSnap.data().role === TARGET_ROLE) {
        // 🎯 Navigation path matches App.jsx route
        navigate("/coach-dashboard");
      } else {
        setError("Access denied: You do not have coach privileges.");
        await signOut(auth); // Ensure unauthorized user is logged out
      }
    } catch (err) {
      let errorMessage = "Login failed: Invalid credentials or network error.";
      if (err.code) {
         switch(err.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
              errorMessage = "Invalid email or password.";
              break;
            default:
              errorMessage = `Login failed: ${err.message}`;
         }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#20143b' }}>
        <form onSubmit={handleLogin} style={{ padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Coach Login</h2>
            <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email" 
                style={{ display: 'block', marginBottom: '10px', padding: '10px', width: '250px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                style={{ display: 'block', marginBottom: '20px', padding: '10px', width: '250px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button 
                type="submit" 
                disabled={loading}
                style={{ padding: '10px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
            >
                {loading ? 'Logging In...' : 'Login'}
            </button>
            {error && <p style={{ color: "red", marginTop: '10px', textAlign: 'center' }}>{error}</p>}
            <p 
                style={{ marginTop: '15px', textAlign: 'center', color: '#20143b', cursor: 'pointer' }}
                onClick={() => navigate('/')}
            >
                ← Back to Main Login Page
            </p>
        </form>
    </div>
  );
};

export default CoachLogin;
