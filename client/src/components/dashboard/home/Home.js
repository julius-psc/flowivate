


import React from 'react';
import './Home.css';
import Topbar from '../common/topbar/Topbar';
import Message from './message/Message';

function Home() {
    return (
        <div className='home'>
            <Topbar />
            <div className='parent'>
                <div className='div1'><Message /></div>
                <div className='div2'></div>
                <div className='div3'></div>
                <div className='div4'></div>
                <div className='div5'></div>
                <div className='div6'></div>
            </div>
        </div>
    );
}

export default Home;
