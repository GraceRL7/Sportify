import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged, 
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { 
    getFirestore, 
    setLogLevel, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    setDoc,
    getDoc // <-- CRITICAL: ENSURE THIS IS EXPORTED
} from "firebase/firestore";

// --- CONFIRMED HARDCODED CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyAzkQJo_aAcs1jvj4VOgzFksINuur9uvb8",
    authDomain: "sportify-df84b.firebaseapp.com",
    projectId: "sportify-df84b",
    storageBucket: "sportify-df84b.firebasestorage.app",
    messagingSenderId: "125792303495",
    appId: "1:125792303495:web:8944023fee1e655eee7b22",
    measurementId: "G-ZBMG376GBS"
};
// ------------------------------------------

// Define placeholders for environment variables 
let __app_id, __initial_auth_token;

// Safely assign appId and initialAuthToken 
const appId = typeof __app_id !== 'undefined' ? __app_id : firebaseConfig.appId;
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // auth is created here
const db = getFirestore(app); // db is created here


// Set Firestore log level for debugging
setLogLevel('debug');

export { 
    app, 
    auth, 
    db, 
    appId,
    initialAuthToken, 

    // --- Authentication Functions ---
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    signOut,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,

    // --- Firestore Functions ---
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    setDoc,
    getDoc // <-- EXPORTED
};