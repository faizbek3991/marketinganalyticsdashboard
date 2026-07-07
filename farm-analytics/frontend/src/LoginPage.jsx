import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        throw new Error('Invalid username or password');
      }
      const data = await res.json();
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <form style={styles.card} onSubmit={handleSubmit}>
        <h1 style={styles.title}>📊 Marketing Analytics</h1>
        <p style={styles.subtitle}>Sign in to view your dashboard</p>

        <label style={styles.label}>Username</label>
        <input
          style={styles.input}
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
          required
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <div style={styles.error}>{error}</div>}

        <button style={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '40px',
    borderRadius: '8px',
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: '13px',
    marginTop: '5px',
    marginBottom: '25px',
    textAlign: 'center',
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
    marginBottom: '18px',
    outline: 'none',
  },
  error: {
    color: '#ef4444',
    fontSize: '13px',
    marginBottom: '15px',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#8b5cf6',
    border: 'none',
    borderRadius: '4px',
    padding: '12px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default LoginPage;
