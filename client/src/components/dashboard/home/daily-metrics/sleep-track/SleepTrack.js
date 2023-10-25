import React, { useState, useEffect } from 'react';
import axios from 'axios';
import sleepIcon from '../../../../../assets/images/dashboard/home/metrics/icons/metric-sleep.svg';
import './SleepTrack.css';
import Cookies from 'js-cookie';

const SleepTrack = () => {
    const [sleep, setSleep] = useState(8);
    const [sleepData, setSleepData] = useState([]);
    const [loading, setLoading] = useState(true); // Add a loading state

    useEffect(() => {
        const username = Cookies.get('username');
        if (username) {
            console.log("Fetching sleep data...");
            axios.get(`http://localhost:3001/getSleepData`)
                .then((response) => {
                    const sleepDataFromBackend = response.data;
                    console.log("Sleep data received from the backend:", sleepDataFromBackend);

                    // Update the state with the adjusted sleep data
                    setSleepData(sleepDataFromBackend);
                    console.log("Updated sleepData state:", sleepDataFromBackend);

                    // Update the sleep value for the current day if it's available
                    const currentDaySleep = sleepDataFromBackend[0];
                    if (currentDaySleep !== undefined) {
                        setSleep(currentDaySleep);
                        console.log("Updated sleep state for the current day:", currentDaySleep);
                    }

                    setLoading(false); // Set loading to false when data is fetched
                })
                .catch((error) => {
                    console.error('Error fetching sleep data:', error);
                    setLoading(false); // Set loading to false even on error
                });
        }
    }, []);

    const handleIncrement = () => {
        if (sleep < 12) {
            setSleep(sleep + 1);
        }
    };

    const handleDecrement = () => {
        if (sleep > 0) {
            setSleep(sleep - 1);
        }
    };

    const saveSleepData = () => {// Create an object with the sleep data to save
        const sleepEntry = {
            hours: sleep,
            date: new Date().toISOString().split('T')[0], // Get the current date in 'YYYY-MM-DD' format
        };

        // Send a POST request to save the sleep data to the backend
        axios.post('http://localhost:3001/saveSleepData', sleepEntry)
            .then(() => {
                console.log('Sleep data saved successfully');
                // Update the last element of the array
                setSleepData((prevData) => {
                    const newData = [...prevData];
                    newData[newData.length - 1] = sleep;
                    return newData;
                });
            })
            .catch((error) => {
                console.error('Error saving sleep data:', error);
                // Handle the error and display an error message if necessary.
            });
    };

    const getSleepBarClass = (value) => {
        if (value >= 1 && value <= 3) return 'little-sleep';
        if (value >= 4 && value <= 7) return 'decent-sleep';
        if (value >= 8 && value <= 12) return 'optimal-sleep';
        return 'no-sleep';
    };

    return (
        <div className="sleep">
            <div id="sleep-head">
                <img id="metric-icon" src={sleepIcon} alt="Sleep metric icon" />
                <div className='sleep-buttons'>
                    <button id="add-sleep" onClick={handleIncrement}>+</button>
                    <p>{sleep}</p>
                    <button id="remove-sleep" onClick={handleDecrement}>-</button>
                </div>
                <button id="save-btn" onClick={saveSleepData}>Save</button>

            </div>
            <div className="sleep-graph">
                {loading ? (
                    <p>Loading sleep data...</p>
                ) : (
                    sleepData.map((value, index) => (
                        <div
                            key={index}
                            className={`sleep-bar ${getSleepBarClass(value)}`}
                        ></div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SleepTrack;
