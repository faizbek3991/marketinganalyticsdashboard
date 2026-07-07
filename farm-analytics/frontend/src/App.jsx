import React, { useState } from 'react';
import LoginPage from './LoginPage';
import Dashboard from './farm_analytics_frontend';

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'));

  const handleLogin = (newToken) => {
    localStorage.setItem('auth_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setToken(null);
  };

  if (!token) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard token={token} onLogout={handleLogout} />;
};

export default App;
