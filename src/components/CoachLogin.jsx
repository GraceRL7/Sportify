import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  doc, 
  getDoc 
} from "../firebase";  // ✅ use centralized firebase.jsxx

const TARGET_ROLE = "coach";
const COACH_COLLECTION = "coaches";

const CoachLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        navigate("/coach-dashboard");
      } else {
        setError("Access denied: You do not have coach privileges.");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit" disabled={loading}>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default CoachLogin;
