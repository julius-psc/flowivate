


import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import Home from '../../dashboard/Dash';

function AuthPage() {
  const [loginStatus, setLoginStatus] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  const handleRegister = () => {
    setShowRegister(true);
    setLoginStatus('');
  };

  const handleLogin = (status) => {
    setLoginStatus(status);
  };

  return (
    <div>
      {loginStatus === 'success' ? (
        <Home /> // Render Home component when logged in
      ) : showRegister ? (
        <Register onRegister={handleRegister} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default AuthPage;
