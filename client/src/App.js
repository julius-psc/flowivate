


import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Axios from 'axios';

import './assets/styles/general.css';

import LandingPage from './components/landing-page/welcome/LandingPage';
import Register from './components/landing-page/auth/Register';
import AuthPage from './components/landing-page/auth/AuthPage';
import Dash from './components/dashboard/Dash';

Axios.defaults.withCredentials = true;

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dash />} />
    </Routes>
  );
}

export default App;
