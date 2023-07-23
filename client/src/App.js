


import { React} from 'react';
import { Routes, Route } from 'react-router-dom';

import './assets/styles/general.css';

import LandingPage from './components/landing-page/pages/LandingPage';
import Register from './components/landing-page/pages/auth/Register'
import AuthPage from './components/landing-page/pages/auth/AuthPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<AuthPage />}/>
      <Route path="/register" element={<Register/>}/>
    </Routes>
  );
}

export default App;