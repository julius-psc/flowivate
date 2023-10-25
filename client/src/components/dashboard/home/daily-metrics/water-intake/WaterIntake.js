


import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

import './WaterIntake.css';
import waterIcon from '../../../../../assets/images/dashboard/home/metrics/icons/metric-drop.svg';
import up from '../../../../../assets/images/dashboard/home/metrics/icons/metrics-up-arrow.svg';
import down from '../../../../../assets/images/dashboard/home/metrics/icons/metrics-down-arrow.svg';
import glass from '../../../../../assets/images/dashboard/home/metrics/icons/metrics-glass-o-water.svg';

const WaterIntake = () => {
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        const username = Cookies.get('username');
        if (username) {
            axios.get('http://localhost:3001/getWaterIntake')
                .then(response => {
                    setCounter(response.data.count);
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }, []);

    const handleIncrement = () => {
        const newCounter = counter + 1;
        setCounter(newCounter);
    };

    const handleDecrement = () => {
        if (counter > 0) {
            setCounter(counter - 1);
        }
    };

    const handleSave = () => {
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
            <div id="water-head">
                <img id="metric-icon" src={waterIcon} alt="Water metric icon" />
                <button onClick={handleSave}>Save</button>
            </div>
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
            </div>
        </div>
    );
};

export default WaterIntake;
