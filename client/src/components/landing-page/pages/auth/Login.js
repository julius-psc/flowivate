


import {React, useState} from 'react';
import Axios from 'axios';

function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
  
    const login = () => {
      Axios.post('http://localhost:3001/login', { username, password })
        .then((response) => {
          if (response.data.message) {
            onLogin(response.data.message); // Trigger the parent component callback with the login status message
          } else {
            onLogin(response.data[0].username); // Trigger the parent component callback with the logged-in username
          }
        });
    };
  
    return (
      <div className="login">
        <h1>Welcome back!</h1>
        <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
        <button onClick={login}>Log In</button>
      </div>
    );
}

export default Login;