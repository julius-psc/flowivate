


import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie'; // Import js-cookie library to handle cookies

import './WaterIntake.css';
import waterIcon from '../../../../../assets/images/dashboard/home/metrics/icons/metric-drop.svg';
import up from '../../../../../assets/images/dashboard/home/metrics/icons/metrics-up-arrow.svg';
import down from '../../../../../assets/images/dashboard/home/metrics/icons/metrics-down-arrow.svg';
import glass from '../../../../../assets/images/dashboard/home/metrics/icons/metrics-glass-o-water.svg';

const WaterIntake = () => {
    const [counter, setCounter] = useState(0);

    const handleIncrement = () => {
        setCounter(counter + 1);
    };

    const handleDecrement = () => {
        if (counter > 0) {
            setCounter(counter - 1);
        }
    };

    const handleSave = () => {
        // Get the username from the cookie
        const username = Cookies.get('username');
        axios.post('http://localhost:3001/saveWaterIntake', {
            username: username,
            count: counter,
        })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });
    };

    return (
        <div className="water">
            <img id="metric-icon" src={waterIcon} alt="Water metric icon" />
            <div className="scale">
                <div className='water-wrapper'>
                    <div className='water-buttons'>
                        <button id="add-glass" onClick={handleIncrement}><img alt="Decrease glass count" src={up} /></button>
                        <button id="remove-glass" onClick={handleDecrement}><img alt="Increase glass count" src={down} /></button>
                    </div>
                    <span id="number-of-glasses">{counter}</span>
                    <img alt="Glass of water" src={glass} />
                    <p>glasses<br /> of water</p>
                </div>
                <div id="water-save"><button onClick={handleSave}>Save</button></div>
            </div>
        </div>
    );
};

export default WaterIntake;
