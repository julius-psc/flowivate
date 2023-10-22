


import React from 'react';
import './Home.css';

import Topbar from '../common/topbar/Topbar';
import Message from './message/Message';
import MiniTasks from './mini-tasks/MiniTasks';
import Pomodoro from './pomodoro/Pomodoro';
import Floaty from './floaty-balls/Floaty';
import Ambient from './ambient/Ambient';
import DailyMetrics from './daily-metrics/DailyMetrics';

function Home() {

    return (
        <div className='home'>
            <Topbar />
            <div className='parent'>
                <div className='div1'><Message /></div>
                <div className='div2'><DailyMetrics /></div>
                <div className='div3'><MiniTasks /></div>
                <div className='div4'><Pomodoro /></div>
                <div className='div5'><Floaty /></div>
                <div className='div6'><Ambient /></div>
            </div>
        </div>
    );
}

export default Home;
