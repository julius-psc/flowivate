


import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import Sidebar from './common/sidebar/Sidebar';
import Home from './home/Home';

import './Dash.css';

function Dash() {
  const username = Cookies.get('username');
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('username');
    navigate('/login');
  };

  useEffect(() => {
    if (!username) {
      navigate('/login');
    }
  }, [username, navigate]);

  return (
    <div className='dashboard'>
      <Sidebar  handleLogout={handleLogout} />
      <Home username={username} />
    </div>
  );
}

export default Dash;
