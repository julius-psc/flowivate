


import React from "react";
import Cookies from 'js-cookie';

import './Message.css';

import streaks from '../../../../assets/images/dashboard/home/home-streaks.svg';

const Message = () => {
    const username = Cookies.get('username');
    return (
        <div className="message">
                <div>
                    <h1>Hello, {username}</h1>
                    <p>"Embrace discomfort"</p>
                </div>
                <div className="daily-streaks">
                    <img id="streaks-icon"  src={streaks} alt='Daily streak login icon'/>
                    <p>1</p>
                </div>
        </div>
    )
}

export default Message;