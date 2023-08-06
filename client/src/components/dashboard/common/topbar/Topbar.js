


import React from 'react';

import Weather from './weather/Weather';
import Profile from './profile/Profile';
import Daytime from './daytime/Daytime';

import './Topbar.css';

const Topbar = () => {
    return (
        <div className='topbar'>
            <div className='topbar-left'>
                <Weather />
            </div>

            <div className='topbar-center'>
                <Daytime />
            </div>

            <div className='topbar-right'>
                <Profile />
            </div>
        </div>
    )
}

export default Topbar;