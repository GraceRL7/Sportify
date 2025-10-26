import React from 'react';
import { useNotification } from '../context/NotificationContext';
import styles from './NotificationDisplay.module.css'; // We'll create this CSS file next

// Icons for different notification types (optional, but nice)
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react'; 

const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
};

const NotificationDisplay = () => {
    const { notifications, removeNotification } = useNotification();

    if (!notifications.length) {
        return null; // Don't render anything if there are no notifications
    }

    return (
        <div className={styles.notificationContainer}>
            {notifications.map((notification) => (
                <div key={notification.id} className={`${styles.notification} ${styles[notification.type]}`}>
                    <div className={styles.icon}>{icons[notification.type] || icons.info}</div>
                    <div className={styles.message}>{notification.message}</div>
                    <button 
                        className={styles.closeButton} 
                        onClick={() => removeNotification(notification.id)}
                    >
                        <X size={18} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default NotificationDisplay;