// C:\sportify\src\components\AdminNotifications.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from '../firebase';

// helper for sorting by createdAt
const getTimeValue = (ts) => {
  if (!ts) return 0;
  try {
    if (typeof ts.toDate === 'function') return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
  } catch {
    return 0;
  }
  return 0;
};

const AdminNotifications = () => {
  const { db, appId, userId, userRole, isLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !db || !appId || !userId) return;

    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    const notifRef = collection(
      db,
      `artifacts/${appId}/public/data/notifications`
    );

    // notifications meant for admin or for all roles
    const q = query(
      notifRef,
      where('targetRole', 'in', ['admin', 'all'])
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // specific to this admin OR broadcast (no targetUserId)
          if (!data.targetUserId || data.targetUserId === userId) {
            list.push({ id: docSnap.id, ...data });
          }
        });
        list.sort((a, b) => getTimeValue(b.createdAt) - getTimeValue(a.createdAt));
        setNotifications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admin notifications:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, appId, userId, userRole, isLoading]);

  if (isLoading || loading) {
    return (
      <div style={{ padding: '30px', textAlign: 'center' }}>
        Loading notifications…
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div
        style={{
          padding: '30px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        Notifications here are only for administrators.
      </div>
    );
  }

  const formatCreatedAt = (value) => {
    if (!value) return '';
    try {
      if (typeof value.toDate === 'function') return value.toDate().toLocaleString();
      if (value instanceof Date) return value.toLocaleString();
    } catch {
      return '';
    }
    return '';
  };

  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '10px',
      }}
    >
      <h2
        style={{
          marginTop: 0,
          marginBottom: '16px',
          color: 'var(--sportify-royal, var(--sportify-navy))',
        }}
      >
        🔔 Admin Notifications
      </h2>

      {notifications.length === 0 ? (
        <div
          style={{
            padding: '18px 20px',
            borderRadius: '12px',
            backgroundColor: '#f3f4f6',
            color: '#4b5563',
            fontSize: '0.95rem',
          }}
        >
          No notifications yet. You’ll see updates here when players apply for
          trials, coaches upload results, or other system events are generated.
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
        >
          {notifications.map((n) => (
            <li
              key={n.id}
              style={{
                padding: '12px 14px',
                marginBottom: '10px',
                borderRadius: '10px',
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                borderLeft: `4px solid ${
                  n.type === 'error'
                    ? '#BC0E4C'
                    : n.type === 'success'
                    ? '#16a34a'
                    : n.type === 'warning'
                    ? '#eab308'
                    : 'var(--sportify-royal, #1E3A8A)'
                }`,
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#9ca3af',
                  marginBottom: 4,
                }}
              >
                {formatCreatedAt(n.createdAt)}
              </div>
              <div
                style={{
                  fontSize: '0.95rem',
                  color: '#111827',
                  fontWeight: 500,
                  marginBottom: n.details ? 4 : 0,
                }}
              >
                {n.message}
              </div>
              {n.details && (
                <div
                  style={{
                    fontSize: '0.9rem',
                    color: '#4b5563',
                  }}
                >
                  {n.details}
                </div>
              )}
              {n.related && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: '0.8rem',
                    color: '#6b7280',
                  }}
                >
                  {n.related}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminNotifications;
