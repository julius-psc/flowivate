


import Axios from 'axios';
import React, { useState } from 'react';

import Login from './Login';
import Register from './Register';

function LoginPage() {
  const [loginStatus, setLoginStatus] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  Axios.defaults.withCredentials = true;

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleLogin = (status) => {
    setLoginStatus(status);
  };

  return (
    <div>
      {!showRegister ? (
        <>
          <Login onLogin={handleLogin} />
          <p>Don't have an account? <button onClick={handleRegister}>Register</button></p>
        </>
      ) : (
        <Register onRegister={handleRegister} />
      )}
      <h1>{loginStatus}</h1>
    </div>
  );
}

export default LoginPage;
