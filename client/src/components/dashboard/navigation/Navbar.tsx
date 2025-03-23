"use client";

import React, { useState, useEffect } from "react";
import {
  IconSearch,
  IconSun,
  IconMoon,
  IconBell,
  IconUser,
  IconCommand,
  IconSunFilled,
  IconMoonFilled,
} from "@tabler/icons-react";

const Navbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Set initial time and update every minute
    setCurrentTime(
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    }, 60000);

    // Check user's preferred color scheme
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setIsDarkMode(true);
    }

    return () => clearInterval(interval);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = (mode: "light" | "dark") => {
    setIsDarkMode(mode === "dark");
    document.documentElement.classList.toggle("dark", mode === "dark");
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 mx-2 my-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-200">
      {/* Left side - Time and Search */}
      <div className="flex items-center space-x-8">
        <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
          {currentTime || "Loading..."}
        </span>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search..."
            className="w-80 pl-9 pr-12 py-2 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 transition-all duration-200"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center bg-gray-200/50 dark:bg-gray-700/50 px-1.5 py-0.5 rounded-sm">
            <IconCommand className="text-gray-500 w-4 h-4" />
            <span className="text-gray-500 text-xs font-medium">F</span>
          </div>
        </div>
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <div className="flex items-center bg-gray-100/50 dark:bg-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => toggleDarkMode("light")}
            className={`p-1.5 rounded-md ${
              !isDarkMode ? "bg-white dark:bg-gray-700 " : ""
            } hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          >
            {isDarkMode ? (
              <IconSun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <IconSunFilled className="w-4 h-4 text-amber-500" />
            )}
          </button>
          <button
            onClick={() => toggleDarkMode("dark")}
            className={`p-1.5 rounded-md ${
              isDarkMode ? "bg-white dark:bg-gray-700" : ""
            } hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
          >
            {isDarkMode ? (
              <IconMoonFilled className="w-4 h-4 text-indigo-500" />
            ) : (
              <IconMoon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Notifications */}
        <div className="relative pr-8">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors relative"
          >
            <IconBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-4 z-10">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notifications
              </h3>
              <div className="space-y-2">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  New message from Alex
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  System update available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <IconUser className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Julius
            </span>
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-4 z-10">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Julius
              </div>
              <button className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded">
                Profile
              </button>
              <button className="w-full text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded">
                Settings
              </button>
              <button className="w-full text-left text-xs text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;