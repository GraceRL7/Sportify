// C:\sportify\src\components\DashboardLayout.js

import React from 'react';
import styles from './DashboardLayout.module.css'; // Assuming this CSS file exists

const DashboardLayout = ({ title, navItems, activeFeature, setActiveFeature, children }) => {
    return (
        <div className={styles.dashboardContainer}>
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>{title}</div>
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
            <div className={styles.contentArea}>
                <h1 className={styles.pageTitle}>{title}</h1>
                <div className={styles.dashboardContent}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;