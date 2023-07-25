
import React, {useEffect} from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

function Home() {
  const username = Cookies.get('username');
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove('username');
    navigate('/login')
  }

  useEffect(() => {
    if (!username) {
      navigate('/login');
    }
  }, [username, navigate]);

  if (!username) {
    navigate('/login');
    return;
  }

  return (
    <div className='auth-container'>
      <div className="auth-page">
        <h1>Welcome back, {username}!</h1>
        <p>Embrace discomfort</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default Home;