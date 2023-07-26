


import React, { useState } from 'react';
import Axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import Cookies from 'js-cookie';

import './Auth.css';
import Navbar from '../common/navbar/Navbar';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inputError, setInputError] = useState(false);

  const navigate = useNavigate();

  const login = () => {
    // Validation checks for the input fields
    if (username.trim() === '' || password.trim() === '') {
      setInputError(true);
      toast.error('Please fill in the inputs!');
      return;
    }

    if (username.trim() === '') {
      setInputError(true);
      toast.error('Please enter a username!');
      return;
    }

    if (password.trim() === '') {
      setInputError(true);
      toast.error('Please enter a password!');
      return;
    }

    if (username.length < 4) {
      setInputError(true);
      toast.error('Your username must be at least 4 characters!');
      return;
    }

    if (password.length < 8) {
      setInputError(true);
      toast.error('Your password must be at least 8 characters!');
      return;
    }

    // Perform login request
    Axios.post('http://localhost:3001/login', { username, password }, { withCredentials: true })
      .then((response) => {
        if (response.data.message) {
          toast.error(response.data.message);
        } else {
          const loggedInUsername = response.data[0].username;
          Cookies.set('username', loggedInUsername, { expires: 1 });
          setUsername(loggedInUsername);
          onLogin('success', loggedInUsername);
          navigate('/dashboard');
        }
      });
  };

  const handleInputChange = (e) => {
    setInputError(false);
    if (e.target.id === 'username-input') {
      setUsername(e.target.value);
    } else if (e.target.id === 'password-input') {
      setPassword(e.target.value);
    }
  };

  return (
    <>
      <Navbar />
      <Toaster />
      <div className='auth-container'>
        <div className="auth-page">
          <h1>Welcome back!</h1>
          <span>Login to ignite your productivity!</span>
          <div className='input-section'>
            <label>Username</label>
            <input
              maxLength="20"
              id="username-input"
              type="text"
              className={
                inputError && (username.trim() === '' || username.length < 4)
                  ? 'input-error'
                  : ''
              }
              onChange={handleInputChange}
            />
            <label>Password</label>
            <input
              id="password-input"
              type="password"
              className={
                inputError && (password.trim() === '' || password.length < 8)
                  ? 'input-error'
                  : ''
              }
              onChange={handleInputChange}
            />
          </div>
          <button className='confirmBtn' onClick={login}>
        Log In
        </button>
          <p>New to Flowivate? <Link to="/register"><button>Create an account</button></Link></p>
        </div>
      </div>
    </>
  );
}

export default Login;
