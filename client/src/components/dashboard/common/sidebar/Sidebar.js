


import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

import logo from "../../../../assets/images/temporary-logo.svg";

import home from '../../../../assets/images/sidebar/sidebar-home.svg';
import journal from '../../../../assets/images/sidebar/sidebar-journal.svg';
import personal from '../../../../assets/images/sidebar/sidebar-personal.svg';
import tasks from '../../../../assets/images/sidebar/sidebar-tasks.svg';
import logout from "../../../../assets/images/sidebar/sidebar-logout.svg";


const Sidebar = ({ handleLogout }) => {
    const sidebarItems = [
        { icon: home, path: "/dashboard", id: "Home" },
        { icon: tasks, path: "/tasks", id: "Tasks" },
        { icon: personal, path: "/personal", id: "Personal" },
        { icon: journal, path: "/journal", id: "Journal" },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img id="navbar-logo" alt="Flowivate temporary logo" src={logo} />
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {sidebarItems.map((item) => (
                        <NavLink
                            to={item.path}
                            key={item.id}
                        >
                            <li className="sidebar-item" data-tooltip={item.id}>
                                <img alt={`Flowivate navbar icon`} src={item.icon} className={item.id} />

                            </li>
                        </NavLink>
                    ))}
                </ul>
            </nav>

            <div onClick={handleLogout} className="sidebar-logout">
                <button><img alt="Flowivate logout icon" src={logout} /></button>
            </div>
        </aside>
    );
};

export default Sidebar;
