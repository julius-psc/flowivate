"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  IconBrain,
  IconSun,
  IconMoon,
  IconBell,
  IconCommand,
  IconSunFilled,
  IconMoonFilled,
  IconSettings,
  IconLogout,
  IconUser,
  IconMessageCircle,
  IconBellRinging,
} from "@tabler/icons-react";

import ChatPanel from "../features/ai/ChatPanel";

const Navbar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const { data: session } = useSession();
  const username = session?.user?.username || "User";
  const email = session?.user?.email || "";
  const userInitial = username ? username.charAt(0).toUpperCase() : "U";

  const [notifications, setNotifications] = useState([
    { id: 1, type: "message", content: "New message from Alex", time: "5m ago", read: false },
    { id: 2, type: "system", content: "System update available", time: "1h ago", read: false },
    { id: 3, type: "message", content: "Sarah mentioned you in a comment", time: "3h ago", read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);

    // Init theme
    const userPref = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    if (userPref === "dark" || (!userPref && systemPrefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = (mode: "light" | "dark") => {
    setIsDarkMode(mode === "dark");
    localStorage.setItem("theme", mode);
    
    // Only apply dark mode to dashboard elements
    const dashboardElement = document.getElementById('dashboard-container');
    if (dashboardElement) {
      if (mode === "dark") {
        dashboardElement.classList.add("dark");
      } else {
        dashboardElement.classList.remove("dark");
      }
    } else {
      // Fallback to document-level if dashboard container not found
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (showProfile && !target.closest('.profile-container')) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showProfile]);

  const handleOpenChat = useCallback(() => {
    setIsChatPanelOpen(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        event.preventDefault();
        handleOpenChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenChat]);

  return (
    <>
      <nav className="flex items-center bg-transparent justify-between z-100 px-6 py-3 mx-2 my-2 rounded-lg border border-gray-200 dark:border-gray-800/50">
        <div className="flex items-center space-x-8">
          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm">
            {currentTime || "Loading..."}
          </span>

          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-blue dark:text-blue-400">
              <IconBrain className="w-5 h-5" />
            </div>
            <button
              onClick={handleOpenChat}
              aria-label="Ask your AI assistant"
              className="w-80 pl-10 pr-12 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-md focus:outline-none hover:border-blue-300 dark:hover:border-blue-700 focus:ring-2 focus:ring-blue-200 text-sm text-left text-gray-600 dark:text-gray-300 transition-all duration-200 flex items-center cursor-pointer"
            >
              Ask your AI assistant...
            </button>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center bg-blue-100 dark:bg-blue-800/50 px-1.5 py-0.5 rounded-sm pointer-events-none">
              <IconCommand className="text-blue-600 dark:text-blue-300 w-3.5 h-3.5" />
              <span className="text-blue-600 dark:text-blue-300 text-xs font-medium ml-0.5">F</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 rounded-lg p-1">
            <button
              onClick={() => toggleDarkMode("light")}
              className={`p-1.5 rounded-md ${!isDarkMode ? "bg-white dark:bg-gray-700 shadow-sm" : ""} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
              aria-label="Switch to Light Mode"
            >
              {isDarkMode ? (
                <IconSun className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <IconSunFilled className="w-4 h-4 text-amber-500" />
              )}
            </button>
            <button
              onClick={() => toggleDarkMode("dark")}
              className={`p-1.5 rounded-md ${isDarkMode ? "bg-gray-800 shadow-sm" : ""} hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors`}
              aria-label="Switch to Dark Mode"
            >
              {isDarkMode ? (
                <IconMoonFilled className="w-4 h-4 text-indigo-400" />
              ) : (
                <IconMoon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          <div className="relative notification-container">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors relative"
              aria-label={`Notifications (${unreadCount} unread)`}
            >
              <IconBell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center pointer-events-none">
                  <span className="text-white text-xs font-bold">{unreadCount}</span>
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-3 z-20 max-h-[70vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllAsRead} 
                      className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="space-y-1.5 overflow-y-auto flex-grow">
                  {notifications.length > 0 ? notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`flex items-start p-2.5 rounded-md ${!notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""} hover:bg-gray-50 dark:hover:bg-gray-800/80 cursor-pointer transition-colors duration-150`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={`p-1.5 rounded-md ${notification.type === "message" ? "bg-blue-100 dark:bg-blue-900/50" : "bg-green-100 dark:bg-green-900/50"} mr-3 mt-0.5`}>
                        {notification.type === "message" ? (
                          <IconMessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <IconBellRinging className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notification.read ? "font-medium text-gray-800 dark:text-gray-200" : "text-gray-700 dark:text-gray-400"}`}>
                          {notification.content}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-medium">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.read && <span className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-2 self-start"></span>}
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full mb-3">
                        <IconBell className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                    </div>
                  )}
                </div>
                {notifications.length > 3 && (
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                    <button className="w-full py-1.5 text-xs text-center text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative profile-container">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              aria-label="User Profile Menu"
            >
              <div className="w-7 h-7 rounded-full bg-primary-green flex items-center justify-center text-white font-medium text-sm">
                {userInitial}
              </div>
              <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                {username}
              </span>
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-3 z-20">
                <div className="flex items-center space-x-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                  <div className="w-10 h-10 rounded-full bg-primary-green flex items-center justify-center text-white font-medium text-lg">
                    {userInitial}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{email}</div>
                  </div>
                </div>
                <div className="py-2 space-y-1">
                  <button className="w-full flex items-center space-x-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
                    <IconUser className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                  <button className="w-full flex items-center space-x-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-md transition-colors">
                    <IconSettings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                </div>
                <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-800">
                  <button className="w-full flex items-center space-x-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-md transition-colors">
                    <IconLogout className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {isChatPanelOpen && (
        <ChatPanel isOpen={isChatPanelOpen} setIsOpen={setIsChatPanelOpen} initialQuery="" />
      )}
    </>
  );
};

export default Navbar;