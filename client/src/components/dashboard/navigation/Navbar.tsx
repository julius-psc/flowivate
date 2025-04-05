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
  IconSettings,
  IconLogout,
  IconMessageCircle,
  IconBellRinging,
} from "@tabler/icons-react";

const Navbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "message", content: "New message from Alex", time: "5m ago", read: false },
    { id: 2, type: "system", content: "System update available", time: "1h ago", read: false },
    { id: 3, type: "message", content: "Sarah mentioned you in a comment", time: "3h ago", read: true }
  ]);
  
  const unreadCount = notifications.filter(n => !n.read).length;

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

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showNotifications || showProfile) {
        const target = event.target as HTMLElement;
        if (!target.closest('.notification-container') && !target.closest('.profile-container')) {
          setShowNotifications(false);
          setShowProfile(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications, showProfile]);

  return (
    <nav className="flex items-center justify-between px-6 py-3 mx-2 my-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-200">
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
            className="w-80 pl-9 pr-12 py-2 bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-blue-200 text-sm text-gray-600 dark:text-gray-300 placeholder-gray-400 transition-all duration-200"
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
        <div className="relative notification-container pr-8">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors relative"
            aria-label="Notifications"
          >
            <IconBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{unreadCount}</span>
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-3 z-10">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notifications
                </h3>
                <button className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400">
                  Mark all as read
                </button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    className={`flex items-start p-2 rounded-md ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''} hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={`p-1.5 rounded-md ${notification.type === 'message' ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-green-100 dark:bg-green-900/50'} mr-2`}>
                      {notification.type === 'message' ? (
                        <IconMessageCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <IconBellRinging className="w-4 h-4 text-green-500 dark:text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-xs ${!notification.read ? 'font-medium text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>
                ))}
              </div>
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800">
                <button className="w-full py-1 text-xs text-center text-blue-500 hover:text-blue-600 dark:text-blue-400">
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative profile-container">
          <button
            onClick={() => {
              setShowProfile(!showProfile);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
              J
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Julius
            </span>
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200/50 dark:border-gray-800/50 p-3 z-100">
              <div className="flex items-center space-x-3 pb-2 border-b border-gray-200 dark:border-gray-800">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  J
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Julius Reade
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    julius@example.com
                  </div>
                </div>
              </div>
              <div className="py-2 space-y-1">
                <button className="w-full flex items-center space-x-2 text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded">
                  <IconUser className="w-4 h-4" />
                  <span>Profile</span>
                </button>
                <button className="w-full flex items-center space-x-2 text-left text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded">
                  <IconSettings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
              <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-800">
                <button className="w-full flex items-center space-x-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded">
                  <IconLogout className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;