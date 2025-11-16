// C:\sportify\src\components\ApproveRegistrations.jsx

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  db as dbDirect, // in case you ever use it directly
} from '../firebase';

function ApproveRegistrations() {
  const { db, appId, userRole, userId, isLoading } = useAuth();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // ---- Load pending applications (status Pending or Pending Review) ----
  useEffect(() => {
    if (isLoading || !db || !appId) return;

    if (userRole !== 'admin') {
      setLoading(false);
      return;
    }

    const pendingRef = collection(
      db,
      `artifacts/${appId}/admin/data/pending_applications`
    );

    // treat both "Pending" and "Pending Review" as pending
    const q = query(pendingRef, where('status', 'in', ['Pending', 'Pending Review']));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        setApplications(list);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching pending applications:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, appId, userRole, isLoading]);

  // ---- Helpers to update status ----
  const updateStatus = async (app, newStatus) => {
    if (!db || !appId) return;
    setActionMessage('');

    try {
      const ref = doc(
        db,
        `artifacts/${appId}/admin/data/pending_applications`,
        app.id
      );

      await updateDoc(ref, {
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: userId || 'admin',
      });

      // Optional: add a notification for the player when status changes
      try {
        const notifRef = collection(
          db,
          `artifacts/${appId}/public/data/notifications`
        );

        let message = '';
        let type = 'info';

        if (newStatus === 'Approved') {
          message = `Your trial application for ${app.trialName || app.sport || 'the event'} has been approved.`;
          type = 'success';
        } else if (newStatus === 'Rejected') {
          message = `Your trial application for ${app.trialName || app.sport || 'the event'} has been rejected.`;
          type = 'error';
        } else if (newStatus === 'Pending') {
          message = `Your trial application for ${app.trialName || app.sport || 'the event'} is still under review.`;
          type = 'info';
        }

        await addDoc(notifRef, {
          message,
          type,
          targetRole: 'player',
          targetUserId: app.userId || null,
          createdAt: new Date(),
          related: 'Trial Application',
        });
      } catch (notifErr) {
        console.warn('Notification write failed (non-critical):', notifErr);
      }

      const text =
        newStatus === 'Approved'
          ? 'Application approved.'
          : newStatus === 'Rejected'
          ? 'Application rejected.'
          : 'Left as pending.';

      setActionMessage(text);
    } catch (err) {
      console.error('Error updating application status:', err);
      setActionMessage('Failed to update application status.');
    }
  };

  const handleApprove = (app) => updateStatus(app, 'Approved');
  const handleReject = (app) => updateStatus(app, 'Rejected');
  const handleKeepPending = (app) => updateStatus(app, 'Pending');

  // ---- Render states ----
  if (isLoading || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        Loading pending applications…
      </div>
    );
  }

  if (userRole !== 'admin') {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#BC0E4C',
        }}
      >
        Access Denied: Only administrators can approve registrations.
      </div>
    );
  }

  const pendingCount = applications.length;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2
        style={{
          color: 'var(--sportify-royal, var(--sportify-navy))',
          marginTop: 0,
          marginBottom: '16px',
        }}
      >
        ✅ Approve Player Registrations
      </h2>

      <div
        style={{
          marginBottom: '12px',
          fontSize: '0.95rem',
          color: '#4b5563',
        }}
      >
        Pending Applications ({pendingCount})
      </div>

      {actionMessage && (
        <div
          style={{
            marginBottom: '16px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf3',
            color: '#166534',
            fontSize: '0.9rem',
          }}
        >
          {actionMessage}
        </div>
      )}

      {pendingCount === 0 ? (
        <div
          style={{
            padding: '24px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 20px rgba(15,23,42,0.06)',
            fontSize: '0.95rem',
            color: '#16a34a',
          }}
        >
          No new applications pending approval.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {applications.map((app) => (
            <div
              key={app.id}
              style={{
                padding: '16px 18px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 18px rgba(15,23,42,0.06)',
                borderLeft: '4px solid var(--sportify-yellow, #FFC501)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '1rem',
                      color: '#111827',
                    }}
                  >
                    {app.fullName || app.name || 'Unnamed Player'}
                  </div>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      color: '#6b7280',
                      marginTop: '2px',
                    }}
                  >
                    {app.email} {app.sport ? `• ${app.sport}` : ''}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    textAlign: 'right',
                  }}
                >
                  Status:{' '}
                  <span style={{ fontWeight: 600, color: '#92400e' }}>
                    {app.status}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  marginTop: '8px',
                  fontSize: '0.85rem',
                  color: '#4b5563',
                }}
              >
                {app.phoneNumber && (
                  <span>Phone: {app.phoneNumber}</span>
                )}
                {app.dob && <span>DOB: {app.dob}</span>}
                {app.experience && (
                  <span>Experience: {app.experience} years</span>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleApprove(app)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(app)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleKeepPending(app)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '999px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#4b5563',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Keep Pending
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ApproveRegistrations;
