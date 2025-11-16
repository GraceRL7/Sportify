// C:\sportify\src\components\DashboardLayout.jsx

import React from 'react';
import styles from './DashboardLayout.module.css';
import { useAuth } from '../context/AuthContext';

function DashboardLayout({
  title,
  navItems,
  activeFeature,
  setActiveFeature,
  onLogout,
  children,
}) {
  const { user, userProfile, logout } = useAuth();

  const handleNavClick = (key) => {
    if (setActiveFeature) setActiveFeature(key);
  };

  const handleLogoutClick = async () => {
    try {
      if (onLogout) {
        // page-specific handler (e.g. navigate('/'))
        await onLogout();
      } else if (logout) {
        // fallback: use global logout from context
        await logout();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const displayName =
    userProfile?.name || user?.email || user?.uid || 'User';

  return (
    <div className={styles.layoutRoot}>
      {/* SIDEBAR */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>Sportify</div>

        <ul className={styles.navList}>
          {navItems?.map((item) => (
            <li
              key={item.key}
              className={
                item.key === activeFeature
                  ? `${styles.navItem} ${styles.activeNavItem}`
                  : styles.navItem
              }
              onClick={() => handleNavClick(item.key)}
            >
              {/* Optional icon support */}
              {item.icon && <span>{item.icon}</span>}
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* MAIN AREA */}
      <div className={styles.mainContentWrapper}>
        {/* TOPBAR */}
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{title}</h1>

          <div className={styles.userActions}>
            <div className={styles.profileButton}>
              <span>👤</span>
              <span>{displayName}</span>
            </div>

            <button
              type="button"
              className={styles.logoutButton}
              onClick={handleLogoutClick}
            >
              <span>⏻</span>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
