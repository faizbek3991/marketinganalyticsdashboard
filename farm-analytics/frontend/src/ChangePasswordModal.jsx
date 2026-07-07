import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000';

const ChangePasswordModal = ({ token, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Failed to change password');
      }

      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <form style={styles.card} onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 style={styles.title}>Change Password</h2>

        {success ? (
          <>
            <p style={styles.success}>Password updated successfully.</p>
            <button type="button" style={styles.button} onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <label style={styles.label}>Current Password</label>
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoFocus
              required
            />

            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />

            <label style={styles.label}>Confirm New Password</label>
            <input
              style={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button type="button" style={styles.cancelButton} onClick={onClose}>Cancel</button>
              <button type="submit" style={styles.button} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '30px',
    borderRadius: '8px',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    color: '#e2e8f0',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  title: {
    margin: '0 0 20px 0',
    fontSize: '18px',
  },
  label: {
    fontSize: '13px',
    color: '#94a3b8',
    marginBottom: '6px',
  },
  input: {
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '10px',
    color: '#e2e8f0',
    fontSize: '14px',
    marginBottom: '16px',
    outline: 'none',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '10px',
  },
  success: {
    color: '#10b981',
    fontSize: '14px',
    marginBottom: '20px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  button: {
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 16px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '10px 16px',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
  },
};

export default ChangePasswordModal;
