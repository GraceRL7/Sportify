import React, { createContext, useState, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // Install uuid: npm install uuid

const NotificationContext = createContext();

export const useNotification = () => {
    return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]); // Array of { id, message, type }

    // Function to add a notification
    const addNotification = useCallback((message, type = 'info', duration = 4000) => {
        const id = uuidv4(); // Generate unique ID
        setNotifications(prev => [...prev, { id, message, type }]);

        // Automatically remove the notification after the duration
        setTimeout(() => {
            removeNotification(id);
        }, duration);
    }, []);

    // Function to remove a notification
    const removeNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const value = {
        notifications,
        addNotification,
        removeNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};