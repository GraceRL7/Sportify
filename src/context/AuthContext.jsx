import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
    auth, 
    db, 
    appId,
    onAuthStateChanged, 
    signOut, 
    doc, 
    getDoc,
} from '../firebase'; // Assuming firebase.js is one level up

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

// --- CONSTANTS ---
const USER_COLLECTION_PATH = `artifacts/${appId}/public/data/users`;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Firebase Auth object
    const [userProfile, setUserProfile] = useState(null); // Firestore document data
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid) => {
        if (!uid) {
            setUserProfile(null);
            setUserRole(null);
            return;
        }

        try {
            const userDocRef = doc(db, USER_COLLECTION_PATH, uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const profileData = userDoc.data();
                setUserProfile(profileData); 
                setUserRole(profileData.role); 
            } else {
                console.warn(`[AuthContext] Firestore profile not found for UID: ${uid}`);
                setUserProfile(null);
                setUserRole('unrecognized');
            }
        } catch (error) {
            console.error("[AuthContext] Error fetching user profile:", error);
            setUserProfile(null);
            setUserRole('unrecognized');
        }
    };

    // --- Logout Logic ---
    const logout = async () => {
        console.log("[AuthContext] Attempting logout..."); // Add log
        setIsLoading(true);
        try {
            await signOut(auth);
            // Clear state immediately AFTER successful sign out
            setUserProfile(null);
            setUserRole(null);
            setUser(null); 
            console.log("[AuthContext] Firebase signOut successful.");
        } catch (error) {
            console.error("[AuthContext] Logout failed:", error);
            // Still attempt to clear local state even if Firebase fails
            setUserProfile(null);
            setUserRole(null);
            setUser(null);
            setIsLoading(false); // Ensure loading stops on error
        }
        // Let onAuthStateChanged handle setIsLoading(false) on success
    };


    // --- Firebase Auth State Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            console.log("[AuthContext] Auth state changed. User:", currentUser ? currentUser.uid : 'null'); // Add log
            if (currentUser) {
                // Only set user if it's different to avoid loops? Might not be needed.
                 if (!user || user.uid !== currentUser.uid) { 
                    setUser(currentUser);
                    await fetchUserProfile(currentUser.uid); // Fetch profile on auth change
                 }
            } else {
                // Clear everything if user signs out
                setUser(null);
                setUserProfile(null);
                setUserRole(null);
            }
            setIsLoading(false);
            console.log("[AuthContext] Finished processing auth state change."); // Add log
        });

        // Cleanup listener
        return () => {
            console.log("[AuthContext] Unsubscribing auth listener."); // Add log
            unsubscribe();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

    const value = {
        user,
        userId: user?.uid || null,
        userProfile,
        userRole,
        isLoading,
        logout, // Ensure logout is provided
        db, 
        appId,
        setUserProfile, 
        setUserRole
    };

    // Render children only once auth state is initially resolved
    return <AuthContext.Provider value={value}>{!isLoading && children}</AuthContext.Provider>;
};