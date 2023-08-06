


import React, { useState } from "react";
import Cookies from 'js-cookie';

import './Profile.css';

import icon from '../../../../../assets/images/topbar/topbar-profile.svg';
import iconFill from '../../../../../assets/images/topbar/topbar-profile-filled.svg';

const Profile = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const username = Cookies.get('username');

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);

    if (!isDropdownOpen) {
      setTimeout(() => {
        setIsDropdownOpen(false);
      }, 10000);
    }
  };

  return (
    <div className="profile">
      <div className="profile-icon" onClick={toggleDropdown}>
        {isDropdownOpen ? <img src={iconFill} alt="Profile clicked" /> : <img src={icon} alt="Profile" />}
      </div>
      {isDropdownOpen && (
        <div className="dropdown">
          <p><span>@</span>{username}</p>
        </div>
      )}
    </div>
  );
}

export default Profile;
