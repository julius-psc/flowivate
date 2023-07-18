


import React from 'react';

import './Navbar.css';

import navLogo from '../../../assets/images/navbar-temporary-logo.svg';

const Navbar = () => {
    return (
        <div className='navbar-container'>
            <div className='navbar-left'>
                <img id="navbar-logo" alt="Flowivate temporary logo" src={navLogo} />
                <h1>Flowivate</h1>
            </div>


            <div className='navbar-right'>
                <ul>
                    <li>Login</li>
                    <li>Releases</li>
                </ul>
            </div>
        </div>
    )
}

export default Navbar;