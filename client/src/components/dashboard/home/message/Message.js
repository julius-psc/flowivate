


import React from "react";

import './Message.css';

import Cookies from 'js-cookie';

const Message = () => {
    const username = Cookies.get('username');
    return (
        <div className="message">
                <h1>Hey, {username}!</h1>
                <p>"Embrace discomfort"</p>
        </div>
    )
}

export default Message;