"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  IconCommand,
  IconBrain,
  IconBell,
  IconMessageCircle,
  IconBellRinging,
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
} from "@tabler/icons-react";

import ChatPanel from "../features/ai/ChatPanel";

interface StatusOption {
  name: string;
  color: string;
  bgColor: string;
}

interface Notification {
  id: number;
  type: "message" | "system";
  content: string;
  time: string;
  read: boolean;
}

const Navbar: React.FC = () => {
  // State for UI elements visibility
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // Session data and status
  const { data: session, status: sessionStatus } = useSession();
  
  // User details from session
  const username = session?.user?.username || "User";
  const email = session?.user?.email || "";
  const userId = session?.user?.id;
  const userInitial = username.charAt(0).toUpperCase();

  // Available status options (memoized for stability)
  const statusOptions: StatusOption[] = useMemo(() => [
    { name: "Active", color: "bg-third-green", bgColor: "bg-third-green/10" },
    { name: "Focusing", color: "bg-third-blue", bgColor: "bg-third-blue/10" },
    { name: "Idle", color: "bg-third-yellow", bgColor: "bg-third-yellow/10" },
    { name: "DND", color: "bg-third-red", bgColor: "bg-third-red/10" },
  ], []);

  // State for current user status
  const [currentStatus, setCurrentStatus] = useState<StatusOption>(statusOptions[0]);
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);

  // State for notifications
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: "message", content: "New message from Alex", time: "5m ago", read: false },
    { id: 2, type: "system", content: "System update available", time: "1h ago", read: false },
    { id: 3, type: "message", content: "Sarah mentioned you in a comment", time: "3h ago", read: true }
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // --- Effect: Fetch Initial User Status ---
  useEffect(() => {
    if (sessionStatus === "authenticated" && userId) {
      setIsStatusLoading(true);
      setStatusUpdateError(null);
      fetch('/api/features/status')
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch status: ${res.status} ${res.statusText}`);
          return res.json();
        })
        .then(data => {
          const fetchedStatusName = data.status;
          const foundStatus = statusOptions.find(option => option.name === fetchedStatusName);
          setCurrentStatus(foundStatus || statusOptions[0]);
          if (!foundStatus) console.warn(`Workspaceed status "${fetchedStatusName}" not found, defaulting.`);
        })
        .catch(error => {
          console.error("Error fetching initial status:", error);
          setStatusUpdateError("Could not load status.");
          setCurrentStatus(statusOptions[0]);
        })
        .finally(() => setIsStatusLoading(false));
    } else if (sessionStatus !== "loading") {
      setIsStatusLoading(false);
      setCurrentStatus(statusOptions[0]);
    }
  }, [sessionStatus, userId, statusOptions]);

  // --- Effect: Handle Clicks Outside Dropdowns ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-container')) setShowNotifications(false);
      if (showProfile && !target.closest('.profile-container')) setShowProfile(false);
      if (showStatusMenu && !target.closest('.status-container')) setShowStatusMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showProfile, showStatusMenu]);

  // --- Function: Open Chat Panel (Memoized) ---
  const handleOpenChat = useCallback(() => {
    setIsChatPanelOpen(true);
  }, []);

  // --- Effect: Handle Keyboard Shortcut for Chat ---
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

  // --- Notification Handlers ---
  const markAsRead = (id: number) => {
    setNotifications(currentNotifications =>
      currentNotifications.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(currentNotifications =>
      currentNotifications.map(n => ({ ...n, read: true }))
    );
  };

  // --- Function: Change User Status ---
  const changeStatus = useCallback(async (status: StatusOption) => {
    setCurrentStatus(status);
    setShowStatusMenu(false);
    setStatusUpdateError(null);

    try {
      const response = await fetch('/api/features/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: status.name }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to update status (${response.status})`);
      }
      console.log("Status updated successfully on backend.");
    } catch (error) {
      console.error("Error updating status:", error);
      setStatusUpdateError(error instanceof Error ? error.message : "An unknown error occurred.");
    }
  }, []);

  // --- Helper Component: Status Indicator ---
  const StatusIndicator = () => {
    if (isStatusLoading) {
      return <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />;
    }
    return (
      <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`} />
    );
  };

  const handleSetConversationId = useCallback((): void => {
    // No operation needed
  }, []);

  // --- Render Logic ---
  return (
    <>
      <nav className="flex items-center justify-between z-40 px-4 py-2 mx-2 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
        {/* Left Section: AI Assistant Button */}
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={handleOpenChat}
              aria-label="Ask your AI assistant"
              className="flex items-center px-2 py-2 rounded-lg bg-blue-50/80 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 text-sm text-left text-gray-700 dark:text-gray-200 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-300"
            >
              <IconBrain height={20} className="text-primary-blue"/>
              <span className="flex-grow mr-3 text-primary-blue font-semibold">My AI</span>
              <div className="flex items-center px-1.5 py-0.5 ml-2 rounded bg-blue-100/80 dark:bg-blue-800/30">
                <IconCommand className="w-3 h-3 text-primary-blue" />
                <span className="text-xs font-medium ml-0.5 text-primary-blue ">F</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Section: Status, Notifications, Profile */}
        <div className="flex items-center space-x-1">
          {/* Status Dropdown Area */}
          <div className="relative status-container">
            {sessionStatus === "authenticated" && (
              <>
                <button
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu);
                    setShowNotifications(false);
                    setShowProfile(false);
                  }}
                  className="flex items-center space-x-1.5 p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
                  aria-label="Change your status"
                  disabled={isStatusLoading}
                >
                  <div className={`w-4 h-4 rounded-full ${currentStatus.bgColor} flex items-center justify-center`}>
                    <StatusIndicator />
                  </div>
                  <IconChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </button>

                {statusUpdateError && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-max max-w-xs px-2 py-1 bg-red-500/80 text-white text-xs rounded shadow-lg z-30">
                    {statusUpdateError}
                  </div>
                )}

                {showStatusMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-1.5 z-20">
                    {statusOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => changeStatus(option)}
                        className="w-full flex items-center space-x-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 px-2 py-1.5 rounded-md transition-colors"
                      >
                        <div className={`w-3 h-3 rounded-full ${option.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${option.color}`} />
                        </div>
                        <span className="text-xs font-medium">{option.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {sessionStatus === "loading" && (
              <div className="p-2"><div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" /></div>
            )}
          </div>

          {/* Notifications Dropdown Area */}
          <div className="relative notification-container">
            {sessionStatus === "authenticated" && (
              <>
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowProfile(false);
                    setShowStatusMenu(false);
                  }}
                  className="p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors relative"
                  aria-label={`Notifications (${unreadCount} unread)`}
                >
                  <IconBell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold">{unreadCount}</span>
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-2 z-20 max-h-[70vh] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 font-medium">Mark all as read</button>
                      )}
                    </div>
                    <div className="space-y-1 overflow-y-auto flex-grow">
                      {notifications.length > 0 ? notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`flex items-start p-2 rounded-md ${!notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""} hover:bg-gray-100/60 dark:hover:bg-gray-800/30 cursor-pointer transition-colors duration-150`}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className={`p-1.5 rounded-md ${notification.type === "message" ? "bg-blue-100 dark:bg-blue-800/30" : "bg-green-100 dark:bg-green-800/30"} mr-3 mt-0.5 flex-shrink-0`}>
                            {notification.type === "message" ? <IconMessageCircle className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" /> : <IconBellRinging className="w-3.5 h-3.5 text-green-500 dark:text-green-400" />}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.read ? "font-medium text-gray-800 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>{notification.content}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                          </div>
                          {!notification.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 ml-2 mt-2 self-start flex-shrink-0"></span>}
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <div className="bg-gray-100 dark:bg-gray-800 p-2.5 rounded-full mb-3">
                            <IconBell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
            {sessionStatus === "loading" && (
              <div className="p-2"><div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" /></div>
            )}
          </div>

          {/* Profile Dropdown Area */}
          <div className="relative profile-container">
            {sessionStatus === "authenticated" && (
              <>
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    setShowNotifications(false);
                    setShowStatusMenu(false);
                  }}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
                  aria-label="User Profile Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white font-medium text-sm">{userInitial}</div>
                </button>
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-2 z-20">
                    <div className="flex items-center space-x-3 p-2">
                      <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">{userInitial}</div>
                      <div>
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{email}</div>
                      </div>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-2"></div>
                    <div className="py-1">
                      <button className="w-full flex items-center space-x-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 px-2 py-1.5 rounded-md transition-colors">
                        <IconUser className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span>Profile</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 px-2 py-1.5 rounded-md transition-colors">
                        <IconSettings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span>Settings</span>
                      </button>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                    <button className="w-full flex items-center space-x-3 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 px-2 py-1.5 rounded-md transition-colors">
                      <IconLogout className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </>
            )}
            {sessionStatus === "loading" && (
              <div className="p-2"><div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" /></div>
            )}
            {sessionStatus === "unauthenticated" && (
              <button className="px-3 py-1.5 text-sm font-medium text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50 transition-colors">Login</button>
            )}
          </div>
        </div>
      </nav>

      {/* Render Chat Panel if open */}
      {isChatPanelOpen && (
        <ChatPanel
          isOpen={isChatPanelOpen}
          setIsOpen={setIsChatPanelOpen}
          initialQuery=""
          initialMessages={[]}
          conversationId={null}
          setConversationId={handleSetConversationId}
        />
      )}
    </>
  );
};

export default Navbar;