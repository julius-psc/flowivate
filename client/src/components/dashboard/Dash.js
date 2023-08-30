


import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, Outlet } from 'react-router-dom';
import MiniPomo from './common/mini-pomo/MiniPomo';
import Sidebar from './common/sidebar/Sidebar';
import { PomodoroProvider } from './home/pomodoro/PomodoroContext';

import './Dash.css';

function Dash() {
  const navigate = useNavigate();
  const username = Cookies.get('username');

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
    <PomodoroProvider>
      <div className='dashboard'>
        <Sidebar handleLogout={handleLogout} />
        <MiniPomo />
        <Outlet />
      </div>
    </PomodoroProvider>
  );
}

export default Dash;
