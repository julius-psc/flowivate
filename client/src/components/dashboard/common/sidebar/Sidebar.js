


import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";
import navLogo from "../../../../assets/images/navbar-temporary-logo.svg";
import icon1 from "../../../../assets/images/sidebar-icon1.svg";
import icon2 from "../../../../assets/images/sidebar-icon2.svg";
import icon3 from "../../../../assets/images/sidebar-icon3.svg";
import icon4 from "../../../../assets/images/sidebar-icon4.svg";
import icon5 from "../../../../assets/images/sidebar-icon5.svg";

const Sidebar = ({ handleLogout }) => {
    const sidebarItems = [
        { icon: icon4, label: "Home", path: "/dashboard", id: "home" },
        { icon: icon2, label: "Tasks", path: "/tasks", id: "tasks" },
        { icon: icon3, label: "Personal", path: "/personal", id: "personal" },
        { icon: icon1, label: "Journal", path: "/journal", id: "journal" },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <img id="navbar-logo" alt="Flowivate temporary logo" src={navLogo} />
                <h1>Flowivate</h1>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {sidebarItems.map((item) => (
                        <NavLink
                            exact
                            to={item.path}
                        >
                            <li key={item.id}>
                                <img alt={`Flowivate navbar icon`} src={item.icon} />
                                <p className={item.label === "Tasks" ? "tasks-p" : ""}>{item.label}</p>
                            </li>
                        </NavLink>
                    ))}
                </ul>
            </nav>

            <div onClick={handleLogout} className="sidebar-logout">
                <img alt="Flowivate logout icon" src={icon5} />
                <button>Logout</button>
            </div>
        </aside>
    );
};

export default Sidebar;
