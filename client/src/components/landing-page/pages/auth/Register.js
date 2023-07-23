import Axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import toast, { Toaster } from 'react-hot-toast';

import './Auth.css';

import Navbar from '../../../common/navbar/Navbar';

function Register({ onRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [inputError, setInputError] = useState(false);

  const register = () => { 

    if (username.trim() === '' || password.trim() === '') {
      setInputError(true);
      toast.error('Please fill in the inputs!')
      return;
    }

    if (username.length < 3) {
      setInputError(true);
      toast.error('Your username must be at least 4 characters!');
      return;
    }
    
    if (password.length < 7) {
      setInputError(true);
      toast.error('Your password must be at least 8 characters!');
      return;
    }
      
    Axios.post('http://localhost:3001/register', { username, password })
      .then((response) => {
        if (response.data.message === "Username already taken. Please choose a different username.") {
          toast.error(response.data.message);
        } else {
          // Registration successful, you can perform any additional actions here if needed
          // For example, you might want to redirect the user to the login page after successful registration
          // You can do that by using the 'onRegister' prop or any other method you have in your application
          // For now, let's just show a success message
          toast.success('Successfully logged in!');
        }
      })
      .catch((error) => {
        // Handle any other errors that might occur during the registration process
        toast.error('An error occurred. Please try again later.');
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
          <h1>Get started</h1>
          <span>Create your account now</span>
          <div className='input-section'>
              <label>Username</label>
              <input
                maxLength="20"
                id="username-input"
                type="text"
                className={
                  inputError && (username.trim() === '' || username.length < 3)
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
                inputError && (password.trim() === '' || password.length < 7)
                  ? 'input-error'
                  : ''
              }
              onChange={handleInputChange}
            />
          </div>
          <button className='confirmBtn' onClick={register}>Sign Up</button>
          <p>Have an account? <Link to="/login"><button>Login</button></Link></p>
        </div>
      </div>
    </>
  );
}

export default Register;
