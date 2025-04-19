"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  IconBrain,
  IconCommand,
  IconBell,
  IconMessageCircle,
  IconBellRinging,
  IconUser,
  IconSettings,
  IconLogout,
  IconChevronDown,
} from "@tabler/icons-react";

import ChatPanel from "../features/ai/ChatPanel"; // Assuming ChatPanel path is correct

// Define the structure for a status option
interface StatusOption {
  name: string;
  color: string;
  bgColor: string;
}

const Navbar: React.FC = () => {
  // State for UI elements visibility
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);

  // Session data and status
  const { data: session, status: sessionStatus } = useSession(); // 'loading', 'authenticated', 'unauthenticated'

  // User details from session
  const username = session?.user?.username || "User";
  const email = session?.user?.email || ""; // Keep for profile display
  const userId = session?.user?.id; // User ID for potential future use (though not sent in API calls)
  const userInitial = username.charAt(0).toUpperCase();

  // Available status options
  const statusOptions: StatusOption[] = useMemo(() => [
    { name: "Active", color: "bg-third-green", bgColor: "bg-third-green/20" },
    { name: "Focusing", color: "bg-third-blue", bgColor: "bg-third-blue/20" },
    { name: "Idle", color: "bg-third-yellow", bgColor: "bg-third-yellow/20" },
    { name: "DND", color: "bg-third-red", bgColor: "bg-third-red/20" },
  ], []);

  // State for current user status
  const [currentStatus, setCurrentStatus] = useState<StatusOption>(statusOptions[0]); // Default to 'Active'
  const [isStatusLoading, setIsStatusLoading] = useState(true); // Loading state for initial status fetch
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null); // Error state for status updates

  // State for notifications (replace with actual notification fetching logic if needed)
  const [notifications, setNotifications] = useState([
    { id: 1, type: "message", content: "New message from Alex", time: "5m ago", read: false },
    { id: 2, type: "system", content: "System update available", time: "1h ago", read: false },
    { id: 3, type: "message", content: "Sarah mentioned you in a comment", time: "3h ago", read: true }
  ]);
  const unreadCount = notifications.filter(n => !n.read).length;

  // --- Effect: Fetch Initial User Status ---
  useEffect(() => {
    // Only fetch if the session is loaded and the user is authenticated
    if (sessionStatus === "authenticated" && userId) {
      setIsStatusLoading(true); // Start loading
      setStatusUpdateError(null); // Clear any previous errors
      fetch('/api/features/status') // Send GET request to the backend
        .then(res => {
          if (!res.ok) {
            // Throw error if response is not OK (e.g., 4xx, 5xx)
            throw new Error(`Failed to fetch status: ${res.status} ${res.statusText}`);
          }
          return res.json(); // Parse JSON body
        })
        .then(data => {
          // Find the status option matching the fetched name
          const fetchedStatusName = data.status;
          const foundStatus = statusOptions.find(option => option.name === fetchedStatusName);
          if (foundStatus) {
            setCurrentStatus(foundStatus); // Update state with fetched status
          } else {
            console.warn(`Workspaceed status "${fetchedStatusName}" not found in options, defaulting to Active.`);
            setCurrentStatus(statusOptions[0]); // Default if status from DB isn't recognized
          }
        })
        .catch(error => {
          console.error("Error fetching initial status:", error);
          setStatusUpdateError("Could not load status."); // Set error message
          setCurrentStatus(statusOptions[0]); // Default to 'Active' on error
        })
        .finally(() => {
          setIsStatusLoading(false); // Stop loading regardless of success or failure
        });
    } else if (sessionStatus !== "loading") {
        // If session is loaded but not authenticated, or if no userId (shouldn't happen if authenticated)
        setIsStatusLoading(false); // Stop loading
        setCurrentStatus(statusOptions[0]); // Reset to default or show an 'offline' status
    }
    // Dependency array: Run effect when session status or user ID changes
  }, [sessionStatus, userId, statusOptions]);


  // --- Effect: Handle Clicks Outside Dropdowns ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close dropdown if click is outside its container
      if (showNotifications && !target.closest('.notification-container')) {
        setShowNotifications(false);
      }
      if (showProfile && !target.closest('.profile-container')) {
        setShowProfile(false);
      }
      if (showStatusMenu && !target.closest('.status-container')) {
        setShowStatusMenu(false);
      }
    };
    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);
    // Remove event listener when component unmounts
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications, showProfile, showStatusMenu]); // Re-run if visibility state changes

  // --- Function: Open Chat Panel ---
  const handleOpenChat = useCallback(() => {
    setIsChatPanelOpen(true);
  }, []);

  // --- Effect: Handle Keyboard Shortcut for Chat ---
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Open chat on Cmd+F or Ctrl+F
      if ((event.metaKey || event.ctrlKey) && event.key === "f") {
        event.preventDefault(); // Prevent browser's find functionality
        handleOpenChat();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleOpenChat]); // Re-run if handleOpenChat changes (due to useCallback)

  // --- Notification Handlers ---
  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  // --- Function: Change User Status ---
  const changeStatus = async (status: StatusOption) => {
    // 1. Optimistically update the UI
    setCurrentStatus(status);
    setShowStatusMenu(false);
    setStatusUpdateError(null); // Clear previous errors immediately

    // 2. Send the update to the backend
    try {
      const response = await fetch('/api/features/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Send only the status name, backend identifies user via session
        body: JSON.stringify({ status: status.name }),
      });

      // 3. Handle response from backend
      if (!response.ok) {
        // Try to get error message from response body, fallback to status text
        const errorData = await response.json().catch(() => ({ message: `Request failed: ${response.statusText}` }));
        throw new Error(errorData.message || `Failed to update status (${response.status})`);
      }

      // Optional: Log success or show a temporary success indicator
      console.log("Status updated successfully on backend.");

    } catch (error) {
      // 4. Handle errors during the fetch operation
      console.error("Error updating status:", error);
      // Set error message for the user
      setStatusUpdateError(error instanceof Error ? error.message : "An unknown error occurred.");

      // **Optional: Revert UI change on failure**
      // To revert, you might need to store the previous status or refetch
      // Example: fetchInitialStatus(); // Or call the effect's fetching logic again
      // For now, we just show the error and leave the optimistic update.
    }
  };

  // --- Helper Component: Status Indicator (Handles Loading State) ---
  const StatusIndicator = () => {
    if (isStatusLoading) {
      // Show a pulsing placeholder while loading
      return <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />;
    }
    // Show the actual status indicator once loaded
    return (
      <div className={`w-5 h-5 rounded-full ${currentStatus.bgColor} flex items-center justify-center flex-shrink-0`}>
        <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`} />
      </div>
    );
  };

  // --- Render Logic ---
  return (
    <>
      <nav className="flex items-center justify-between z-50 px-6 py-3 mx-2 my-2 rounded-lg border border-bdr-light dark:border-bdr-dark bg-transparent backdrop-blur-sm">
        {/* Left Section: AI Assistant Button */}
        <div className="flex items-center space-x-8">
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-third-blue">
              <IconBrain className="w-5 h-5" />
            </div>
            <button
              onClick={handleOpenChat}
              aria-label="Ask your AI assistant"
              className="w-80 pl-10 pr-12 py-2.5 bg-primary-bluelight/30 dark:bg-third-blue/10 border border-primary-bluelight dark:border-third-blue/30 rounded-md focus:outline-none hover:border-primary-blue dark:hover:border-third-blue focus:ring-2 focus:ring-primary-bluelight text-sm text-left text-secondary-black dark:text-secondary-white transition-all duration-200 flex items-center cursor-pointer"
            >
              Ask your AI assistant...
            </button>
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center bg-primary-bluelight dark:bg-third-blue/20 px-1.5 py-0.5 rounded-sm pointer-events-none">
              <IconCommand className="text-primary-blue dark:text-third-blue w-3.5 h-3.5" />
              <span className="text-primary-blue dark:text-third-blue text-xs font-medium ml-0.5">F</span>
            </div>
          </div>
        </div>

        {/* Right Section: Status, Notifications, Profile */}
        <div className="flex items-center space-x-4">

          {/* Status Dropdown Area */}
          <div className="relative status-container">
            {/* Show status only when authenticated */}
            {sessionStatus === "authenticated" && (
              <>
                <button
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu);
                    // Close other dropdowns when opening this one
                    setShowNotifications(false);
                    setShowProfile(false);
                  }}
                  className="flex items-center space-x-1.5 p-2 hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 rounded-md transition-colors"
                  aria-label="Change your status"
                  disabled={isStatusLoading} // Disable button while status is initially loading
                >
                  <StatusIndicator /> {/* Render the status dot (or loading pulse) */}
                  <IconChevronDown className="w-3.5 h-3.5 text-accent-grey-hover dark:text-accent-lightgrey" />
                </button>

                {/* Status Update Error Message */}
                {statusUpdateError && (
                    <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-max max-w-xs px-2 py-1 bg-third-red/80 text-secondary-white text-xs rounded shadow-lg z-30">
                        {statusUpdateError}
                    </div>
                )}

                {/* Status Options Dropdown */}
                {showStatusMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-secondary-white dark:bg-secondary-black rounded-lg shadow-lg border border-bdr-light dark:border-bdr-dark p-2 z-20">
                    {statusOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => changeStatus(option)} // Call the async update function
                        className="w-full flex items-center space-x-2.5 text-left text-sm text-secondary-black dark:text-secondary-white hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 px-2 py-1.5 rounded-md transition-colors"
                      >
                        {/* Status dot in menu */}
                        <div className={`w-4 h-4 rounded-full ${option.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        </div>
                        <span className="text-xs font-medium">{option.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {/* Show loading pulse if session is loading */}
            {sessionStatus === "loading" && (
                 <div className="p-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                 </div>
             )}
            {/* Optionally, show nothing or a different indicator if unauthenticated */}
          </div>

          {/* Notifications Dropdown Area */}
          <div className="relative notification-container">
             {/* Only show notifications if logged in */}
             {sessionStatus === "authenticated" && (
                 <>
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        // Close other dropdowns
                        setShowProfile(false);
                        setShowStatusMenu(false);
                      }}
                      className="p-2 hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 rounded-md transition-colors relative"
                      aria-label={`Notifications (${unreadCount} unread)`}
                    >
                      <IconBell className="w-5 h-5 text-secondary-black dark:text-accent-lightgrey" />
                      {/* Unread count badge */}
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-4 h-4 bg-third-red rounded-full flex items-center justify-center pointer-events-none">
                          <span className="text-secondary-white text-xs font-bold">{unreadCount}</span>
                        </span>
                      )}
                    </button>
                    {/* Notifications Panel */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-secondary-white dark:bg-secondary-black rounded-lg shadow-lg border border-bdr-light dark:border-bdr-dark p-3 z-20 max-h-[70vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-bdr-light dark:border-bdr-dark">
                          <h3 className="text-sm font-semibold text-secondary-black dark:text-secondary-white">Notifications</h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-primary-blue hover:text-primary-blue-hover dark:text-third-blue font-medium"
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        {/* List */}
                        <div className="space-y-1.5 overflow-y-auto flex-grow">
                          {notifications.length > 0 ? notifications.map(notification => (
                            <div
                              key={notification.id}
                              className={`flex items-start p-2.5 rounded-md ${!notification.read ? "bg-primary-bluelight/20 dark:bg-third-blue/10" : ""} hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 cursor-pointer transition-colors duration-150`}
                              onClick={() => markAsRead(notification.id)}
                            >
                              {/* Icon */}
                              <div className={`p-1.5 rounded-md ${notification.type === "message" ? "bg-primary-bluelight/50 dark:bg-third-blue/20" : "bg-third-green/20 dark:bg-third-green/20"} mr-3 mt-0.5`}>
                                {notification.type === "message" ? (
                                  <IconMessageCircle className="w-4 h-4 text-primary-blue dark:text-third-blue" />
                                ) : (
                                  <IconBellRinging className="w-4 h-4 text-third-green dark:text-third-green" />
                                )}
                              </div>
                              {/* Content */}
                              <div className="flex-1">
                                <p className={`text-sm ${!notification.read ? "font-medium text-secondary-black dark:text-secondary-white" : "text-secondary-black dark:text-accent-lightgrey"}`}>
                                  {notification.content}
                                </p>
                                <p className="text-xs text-accent-grey-hover dark:text-accent-grey mt-1 font-medium">
                                  {notification.time}
                                </p>
                              </div>
                              {/* Unread indicator dot */}
                              {!notification.read && <span className="w-2 h-2 rounded-full bg-primary-blue dark:bg-third-blue ml-2 mt-2 self-start flex-shrink-0"></span>}
                            </div>
                          )) : (
                            // Empty state
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                              <div className="bg-accent-lightgrey/30 dark:bg-bdr-dark p-3 rounded-full mb-3">
                                <IconBell className="w-5 h-5 text-accent-grey dark:text-accent-grey-hover" />
                              </div>
                              <p className="text-sm text-accent-grey-hover dark:text-accent-grey">No new notifications</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                 </>
             )}
             {/* Show loading pulse if session is loading */}
             {sessionStatus === "loading" && (
                 <div className="p-2">
                    <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                 </div>
             )}
          </div>

          {/* Profile Dropdown Area */}
          <div className="relative profile-container">
            {/* Show profile button only when authenticated */}
            {sessionStatus === "authenticated" && (
              <>
                <button
                  onClick={() => {
                    setShowProfile(!showProfile);
                    // Close other dropdowns
                    setShowNotifications(false);
                    setShowStatusMenu(false);
                  }}
                  className="flex items-center space-x-2 p-2 hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 rounded-md transition-colors"
                  aria-label="User Profile Menu"
                >
                  {/* User Initial Avatar */}
                  <div className="w-7 h-7 rounded-full bg-third-green flex items-center justify-center text-secondary-white font-medium text-sm flex-shrink-0">
                    {userInitial}
                  </div>
                  {/* Username */}
                  <span className="text-sm text-secondary-black dark:text-secondary-white font-medium hidden sm:inline"> {/* Hide on very small screens */}
                    {username}
                  </span>
                </button>
                {/* Profile Dropdown Panel */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-60 bg-secondary-white dark:bg-secondary-black rounded-lg shadow-lg border border-bdr-light dark:border-bdr-dark p-3 z-20">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-3 pb-3 border-b border-bdr-light dark:border-bdr-dark">
                      <div className="w-10 h-10 rounded-full bg-third-green flex items-center justify-center text-secondary-white font-medium text-lg flex-shrink-0">
                        {userInitial}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-secondary-black dark:text-secondary-white truncate">{username}</div>
                        <div className="text-xs text-accent-grey-hover dark:text-accent-grey truncate">{email}</div>
                      </div>
                    </div>
                    {/* Menu Options */}
                    <div className="py-2 space-y-1">
                      <button className="w-full flex items-center space-x-3 text-left text-sm text-secondary-black dark:text-accent-lightgrey hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 px-3 py-2 rounded-md transition-colors">
                        <IconUser className="w-4 h-4 flex-shrink-0" />
                        <span>Profile</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 text-left text-sm text-secondary-black dark:text-accent-lightgrey hover:bg-accent-lightgrey/30 dark:hover:bg-bdr-dark/50 px-3 py-2 rounded-md transition-colors">
                        <IconSettings className="w-4 h-4 flex-shrink-0" />
                        <span>Settings</span>
                      </button>
                    </div>
                    {/* Logout */}
                    <div className="pt-2 mt-1 border-t border-bdr-light dark:border-bdr-dark">
                      {/* Add onClick={() => signOut()} here eventually */}
                      <button className="w-full flex items-center space-x-3 text-left text-sm text-third-red dark:text-third-red hover:bg-third-red/10 dark:hover:bg-third-red/10 px-3 py-2 rounded-md transition-colors">
                        <IconLogout className="w-4 h-4 flex-shrink-0" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
             {/* Show loading pulse if session is loading */}
             {sessionStatus === "loading" && (
                 <div className="p-2">
                    <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
                 </div>
             )}
             {/* Optionally, show a Login button if unauthenticated */}
             {sessionStatus === "unauthenticated" && (
                 <button
                    // Add onClick={() => signIn()} here eventually
                    className="px-3 py-1.5 text-sm font-medium text-primary-blue dark:text-third-blue hover:bg-primary-bluelight/30 dark:hover:bg-third-blue/10 rounded-md border border-primary-blue/50 dark:border-third-blue/50 transition-colors"
                 >
                     Login
                 </button>
             )}
          </div>

        </div>
      </nav>

      {/* Render Chat Panel if open */}
      {isChatPanelOpen && (
        <ChatPanel isOpen={isChatPanelOpen} setIsOpen={setIsChatPanelOpen} initialQuery="" />
      )}
    </>
  );
};

export default Navbar;