


import React, { useState, useEffect } from "react";
import './Daytime.css';
import icon from '../../../../../assets/images/topbar/topbar-clock.svg';

const Daytime = () => {
    const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime);

    function getCurrentDateTime() {
        const date = new Date();
        return date;
    }

    useEffect(() => {
        // Update the current date and time every second (1000 milliseconds)
        const intervalId = setInterval(() => {
            setCurrentDateTime(getCurrentDateTime());
        }, 1000);

        // Clean up the interval when the component unmounts
        return () => clearInterval(intervalId);
    }, []);

    const formattedTime = currentDateTime.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });

    const formattedMonth = currentDateTime.toLocaleString("en-US", { month: "short" });
    const formattedDate = currentDateTime.getDate();
    const formattedYear = currentDateTime.getFullYear();

    return (
        <div className='daytime'>
            <div className='daytime-left'>
                <img src={icon} alt="Date icon" />
                <p>{formattedTime}</p>
            </div>

            <div className='daytime-right'>
                <p>{formattedMonth}</p>
                <p>{formattedDate}</p>
                <p>{formattedYear}</p>
            </div>
        </div>
    )
}

export default Daytime;
