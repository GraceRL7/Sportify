import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    auth, 
    db, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    doc, 
    getDoc,
    setDoc,
    appId,
    initialAuthToken,
    signInWithCustomToken,
    signInAnonymously
} from '../firebase'; // Assuming firebase.js is one level up

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// --- CONSTANTS ---
const USER_COLLECTION_PATH = `artifacts/${appId}/public/data/users`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // --- 1. Firestore Role Retrieval (CRITICAL) ---
    const fetchUserRole = async (uid) => {
        if (!uid) {
            setUserRole(null);
            return null;
        }

        // Note: The document ID in the logs was like ADMIN-admin or PLAYER-id. 
        // We need the Firebase UID to ensure security rule compliance (isOwner).
        // Since your current setup seems to rely on a different UID for the profile document,
        // we'll listen for a generic document based on the Firebase UID for role data.
        // Assuming your user profile document ID is actually the Firebase UID for now.
        try {
            const userDocRef = doc(db, USER_COLLECTION_PATH, uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const role = userDoc.data().role;
                setUserRole(role);
                return role;
            } else {
                console.warn(`[AuthContext] Firestore profile not found for UID: ${uid}`);
                setUserRole('unrecognized');
                return 'unrecognized';
            }
        } catch (error) {
            console.error("[AuthContext] Error fetching user role from Firestore:", error);
            // This is often the 'Missing or insufficient permissions' error.
            // We set a temporary role to allow the app to render.
            setUserRole('unrecognized');
            return 'unrecognized';
        }
    };


    // --- 2. Registration Logic (PLAYER ONLY) ---
    const register = async (email, password) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Immediately create the basic user profile in Firestore
            const docRef = doc(db, USER_COLLECTION_PATH, uid);
            await setDoc(docRef, {
                email: email,
                role: 'player', // Hardcode role for registration
                registeredAt: new Date().toISOString(),
                status: 'Active'
            });
            console.log(`[AuthContext] Player registered and profile created: ${uid}`);
            
            // Note: Firebase Custom Claims (admin.setCustomUserClaims) 
            // is usually done server-side (Cloud Function) after registration.
            // We skip that complexity here, relying only on the Firestore profile.
            
        } catch (error) {
            console.error("[AuthContext] Registration failed:", error);
            throw new Error(error.message || "Registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- 3. Login Logic (ALL ROLES) ---
    const login = async (email, password, expectedRole) => {
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const uid = userCredential.user.uid;

            // Fetch the role immediately after sign-in
            const actualRole = await fetchUserRole(uid);

            if (actualRole && actualRole !== expectedRole) {
                // If roles don't match, log the user out and throw an error.
                console.warn(`[AuthContext] Role mismatch: User is ${actualRole}, tried to log in as ${expectedRole}.`);
                await signOut(auth); 
                throw new Error("Invalid access role for this user.");
            }

            console.log(`[AuthContext] Login successful as ${actualRole || expectedRole}.`);

        } catch (error) {
            console.error(`[AuthContext] Login attempt failed: ${error.message}`);
            // Catch simulated credentials error or Firebase Auth error
            throw new Error("Login failed: Invalid credentials or network error.");
        } finally {
            // Note: setIsLoading(false) happens inside the useEffect listener 
            // once onAuthStateChanged confirms the final state.
        }
    };

    // --- 4. Logout Logic ---
    const logout = async () => {
        setIsLoading(true);
        setUserRole(null);
        setUser(null);
        await signOut(auth);
        setIsLoading(false);
        console.log("[AuthContext] User logged out.");
    };


    // --- 5. Firebase Auth State Listener (CRITICAL) ---
    useEffect(() => {
        // 1. Handle Canvas Custom Auth Token (Initial sign-in)
        const initializeAuth = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                    console.log("[AuthContext] Signed in with custom token.");
                } else {
                    await signInAnonymously(auth);
                    console.log("[AuthContext] Signed in anonymously.");
                }
            } catch (error) {
                console.error("[AuthContext] Initial custom auth failed:", error);
                // Fail gracefully to anonymous
                await signInAnonymously(auth);
            }
        };

        // 2. Set up State Listener
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                
                // Fetch the role when the auth state changes
                await fetchUserRole(currentUser.uid);
            } else {
                setUser(null);
                setUserRole(null);
            }
            setIsLoading(false);
        });

        // Initialize auth flow
        initializeAuth();
        
        // Cleanup listener
        return () => unsubscribe();
    }, []); 

    const value = {
        user,
        userRole,
        isLoading,
        login,
        register,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
