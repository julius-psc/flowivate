


import Axios from 'axios';
import React, { useState } from 'react';

function Register({ onRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
  
    const register = () => {
      Axios.post('http://localhost:3001/register', { username, password })
        .then((response) => {
          console.log(response);
          onRegister(); // Trigger the parent component callback
        });
    };
  
    return (
      <div className="registration">
        <h1>Registration</h1>
        <label>Username</label>
        <input type="text" onChange={(e) => setUsername(e.target.value)} />
        <label>Password</label>
        <input type="password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={register}>Sign Up</button>
      </div>
    );
}

export default Register;