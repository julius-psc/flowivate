


import React, { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, Outlet } from 'react-router-dom';
import MiniPomo from './common/mini-pomo/MiniPomo';
import Sidebar from './common/sidebar/Sidebar';
import { PomodoroProvider } from './home/pomodoro/PomodoroContext';


import './Dash.css';

function Dash() {
  const navigate = useNavigate();
  const username = Cookies.get('username');
  const [isLoading, setIsLoading] = useState(true); // Add this line

  const handleLogout = () => {
    Cookies.remove('username');
    navigate('/login');
  };

  useEffect(() => {
    if (!username) {
      navigate('/login');
    }

    // Simulate loading delay for demonstration purposes
    setTimeout(() => {
      setIsLoading(false); // Set isLoading to false after the content has loaded
    }, 2000); // Adjust the time as needed
  }, [username, navigate]);

  return (
    <PomodoroProvider>
      <div className='dashboard'>
        <Sidebar handleLogout={handleLogout} />
        <MiniPomo />

        {isLoading ? ( // Conditionally render the spinner while isLoading is true
          <div className='loader-container'>
            <div className='loader'></div>
          </div>
        ) : (
          <Outlet /> // Render the Outlet with your dashboard content when isLoading is false
        )}
      </div>
    </PomodoroProvider>
  );
}

export default Dash;
