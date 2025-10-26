// C:\sportify\src\components\DashboardLayout.jsx (Updated)

import React from 'react';
import { useAuth } from '../context/AuthContext'; // 1. Import useAuth
import { LogOut, User } from 'lucide-react'; // 2. Import icons
import styles from './DashboardLayout.module.css'; 

// 3. Props are changed: Added 'onLogout'
const DashboardLayout = ({ title, navItems, activeFeature, setActiveFeature, onLogout, children }) => {
    
    // 4. Get user data from context
    const { user, userProfile } = useAuth();
    
    // Use the profile name if it exists, otherwise fall back to the auth email
    const displayName = userProfile?.name || user?.email || 'User';

    return (
        <div className={styles.layoutRoot}>
            {/* --- SIDEBAR --- */}
            <div className={styles.sidebar}>
                {/* Header updated to be more generic, or you can customize it */}
                <div className={styles.sidebarHeader}>Sportify</div> 
                <ul className={styles.navList}>
                    {navItems.map((item) => (
                        <li
                            key={item.key}
                            className={`${styles.navItem} ${activeFeature === item.key ? styles.activeNavItem : ''}`}
                            onClick={() => setActiveFeature(item.key)}
                        >
                            {item.icon} {item.label}
                        </li>
                    ))}
                </ul>
            </div>

            {/* --- MAIN CONTENT WRAPPER --- */}
            <div className={styles.mainContentWrapper}>
                
                {/* --- 5. NEW TOPBAR (Contains Profile & Logout) --- */}
                <div className={styles.topbar}>
                    <h1 className={styles.pageTitle}>{title}</h1>
                    <div className={styles.userActions}>
                        <div className={styles.profileButton}>
                            <User size={16} />
                            <span>{displayName}</span>
                        </div>
                        <button className={styles.logoutButton} onClick={onLogout}>
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
                
                {/* --- CONTENT AREA --- */}
                <div className={styles.contentArea}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;