


import React, { useState, useEffect } from 'react';
import axios from 'axios';

import './Weather.css';

import sun from '../../../../../assets/images/topbar/topbar-sun.svg';
import cloud from '../../../../../assets/images/topbar/topbar-cloud.svg';

const Weather = () => {
    const [temperature, setTemperature] = useState(null);

    useEffect(() => {
        // Get user's location using geolocation API
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // Send location data to the backend to fetch weather data
                    axios.get(`http://localhost:3001/weather?lat=${latitude}&lon=${longitude}`)
                        .then((response) => {
                            setTemperature(Math.round(response.data.temperature));
                        })
                        .catch((error) => {
                            console.error('Error fetching weather data:', error);
                        });
                },
                (error) => {
                    console.error('Error getting user location:', error);
                }
            );
        }
    }, []);

    return (
        <div className="weather">
            {temperature > 20 ? <img alt="Sun icon" src={sun}/> : <img alt="Cloud icon" src={cloud}/>}
            <p>{temperature}°C</p>
        </div>
    );
};

export default Weather;
