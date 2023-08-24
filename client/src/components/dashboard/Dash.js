


import React, { useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './common/sidebar/Sidebar';


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
    <div className='dashboard'>
      <Sidebar  handleLogout={handleLogout} />
      <Outlet />
    </div>
  );
}

export default Dash;



