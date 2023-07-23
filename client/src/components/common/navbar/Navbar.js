


import React from 'react';
import { Link } from 'react-router-dom';

import './Navbar.css';

import navLogo from '../../../assets/images/navbar-temporary-logo.svg';

const Navbar = () => {
    return (
        <div className='navbar-container'>
            <div className='navbar-left'>
                <img id="navbar-logo" alt="Flowivate temporary logo" src={navLogo} />
                <Link to="/">
                    <h1>Flowivate</h1>
                </Link>
            </div>


            <div className='navbar-right'>
                <ul>
                    <li>
                        <Link to="/login">Login</Link>
                    </li>
                    <li>
                        <Link to="/releases">Releases</Link>
                    </li>
                </ul>
            </div>
        </div>
    )
}

export default Navbar;