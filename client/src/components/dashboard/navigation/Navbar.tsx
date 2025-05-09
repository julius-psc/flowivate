"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image"; // Import next/image
import { IconCommand, IconBrain, IconChevronDown } from "@tabler/icons-react";
import { toast } from "sonner";

import ChatPanel from "../features/ai/ChatPanel";
import Profile from "../privacy/Profile";

interface StatusOption {
  name: string;
  color: string;
  bgColor: string;
}

const Navbar: React.FC = () => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [showProfileComponent, setShowProfileComponent] = useState(false);

  const { data: session, status: sessionStatus } = useSession();

  const username = session?.user?.username || "User";
  const userId = session?.user?.id;
  const userInitial = username.charAt(0).toUpperCase();

  const statusOptions: StatusOption[] = useMemo(
    () => [
      // ... (status options remain the same)
      { name: "Active", color: "bg-third-green", bgColor: "bg-third-green/10" },
      { name: "Focusing", color: "bg-third-blue", bgColor: "bg-third-blue/10" },
      { name: "Idle", color: "bg-third-yellow", bgColor: "bg-third-yellow/10" },
      { name: "DND", color: "bg-third-red", bgColor: "bg-third-red/10" },
    ],
    []
  );

  const [currentStatus, setCurrentStatus] = useState<StatusOption>(
    statusOptions[0]
  );
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  // --- Effects and Callbacks (remain largely the same) ---

  // Fetch Initial User Status Effect
  useEffect(() => {
    if (sessionStatus === "authenticated" && userId) {
      setIsStatusLoading(true);
      fetch("/api/features/status")
        .then((res) => {
          if (!res.ok) {
            // Handle specific error codes
            if (res.status === 404) {
              console.warn("User status not found, using default");
              // Create a synthetic response since we can't return an object directly
              return {
                json: () => Promise.resolve({ status: statusOptions[0].name }),
              };
            }
            throw new Error(
              `Failed to fetch status: ${res.status} ${res.statusText}`
            );
          }
          return res.json();
        })
        .then((data) => {
          const fetchedStatusName = data.status;
          const foundStatus = statusOptions.find(
            (option) => option.name === fetchedStatusName
          );
          if (foundStatus) {
            setCurrentStatus(foundStatus);
          } else {
            console.warn(
              `Received unknown status: ${fetchedStatusName}, using default`
            );
            setCurrentStatus(statusOptions[0]);
          }
        })
        .catch((error) => {
          console.error("Error fetching initial status:", error);
          toast.error("Could not load user status", {
            description: "Using default status instead.",
          });
          setCurrentStatus(statusOptions[0]);
        })
        .finally(() => setIsStatusLoading(false));
    } else if (sessionStatus !== "loading") {
      setIsStatusLoading(false);
      setCurrentStatus(statusOptions[0]);
    }
  }, [sessionStatus, userId, statusOptions]);

  // Handle Clicks Outside Dropdowns Effect
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showStatusMenu && !target.closest(".status-container")) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusMenu]);

  // Open Chat Panel Callback
  const handleOpenChat = useCallback(() => {
    setIsChatPanelOpen(true);
  }, []);

  // Keyboard Shortcut Effect
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

  // Change User Status Callback
  const changeStatus = useCallback(
    async (status: StatusOption) => {
      setCurrentStatus(status);
      setShowStatusMenu(false);

      if (sessionStatus !== "authenticated") {
        toast.error("You must be logged in to change status.");
        return;
      }
      try {
        const response = await fetch("/api/features/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: status.name }),
        });
        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({
              message: `Request failed: ${response.statusText}`,
            }));
          throw new Error(
            errorData.message || `Failed to update status (${response.status})`
          );
        }
        console.log("Status updated successfully on backend.");
      } catch (error) {
        console.error("Error updating status:", error);
        const message =
          error instanceof Error ? error.message : "An unknown error occurred.";
        toast.error(`Failed to update status: ${message}`);
      }
    },
    [sessionStatus] // Removed statusOptions from dependencies as it's stable due to useMemo
  );

  // Status Indicator Component
  const StatusIndicator = React.memo(() => {
    if (isStatusLoading) {
      return (
        <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
      );
    }
    return (
      <div className={`w-2.5 h-2.5 rounded-full ${currentStatus.color}`} />
    );
  });
  StatusIndicator.displayName = "StatusIndicator";

  const handleSetConversationId = useCallback((): void => {}, []);

  // --- Render Logic ---
  return (
    <>
      <nav className="flex items-center justify-between z-40 px-4 py-2 mx-2 mt-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50">
        {/* Left Section */}
        {/* ... (AI Button remains the same) ... */}
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={handleOpenChat}
              aria-label="Ask your AI assistant"
              className="flex items-center px-2 py-2 rounded-lg bg-primary/10 dark:bg-primary/10 border border-primary/80 dark:border-primary/80 text-sm text-left text-gray-700 dark:text-gray-200 transition-all duration-200 hover:border-primary/80 dark:hover:border-primary/80 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <IconBrain height={20} className="text-primary" />
              <span className="flex-grow mr-3 text-primary font-semibold">
                My AI
              </span>
              <div className="flex items-center px-1.5 py-0.5 ml-2 rounded bg-primary/20 dark:bg-primary/20">
                <IconCommand className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium ml-0.5 text-primary">
                  F
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-1">
          {/* Status Dropdown Area */}
          {/* ... (Status dropdown remains the same) ... */}
          <div className="relative status-container">
            {sessionStatus === "authenticated" && (
              <>
                <button
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu);
                  }}
                  className="flex items-center space-x-1.5 p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
                  aria-label="Change your status"
                  disabled={isStatusLoading}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${currentStatus.bgColor} flex items-center justify-center`}
                  >
                    <StatusIndicator />
                  </div>
                  <IconChevronDown className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </button>

                {showStatusMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 p-1.5 z-20">
                    {statusOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => changeStatus(option)}
                        className="w-full flex items-center space-x-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 px-2 py-1.5 rounded-md transition-colors"
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${option.bgColor} flex items-center justify-center flex-shrink-0`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${option.color}`}
                          />
                        </div>
                        <span className="text-xs font-medium">
                          {option.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {sessionStatus === "loading" && (
              <div className="p-2">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
              </div>
            )}
          </div>

          {/* Profile Area */}
          <div className="relative profile-container">
            {sessionStatus === "authenticated" &&
              session.user && ( // Ensure session.user exists
                <>
                  <button
                    onClick={() => {
                      setShowProfileComponent(true);
                      setShowStatusMenu(false);
                    }}
                    className="flex items-center space-x-2 p-1 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors" // Reduced padding slightly for image fit
                    aria-label="Open User Profile"
                  >
                    {/* Use next/image */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                      {session.user.image ? (
                        <Image
                          src={session.user.image}
                          alt={session.user.username || "User Avatar"} // Add alt text
                          width={28} // w-7 = 28px
                          height={28} // h-7 = 28px
                          className="object-cover" // Removed w-full h-full as width/height handle size
                          priority // Prioritize loading avatar in navbar
                        />
                      ) : (
                        <span className="flex items-center justify-center w-full h-full bg-green-500">
                          {userInitial}
                        </span>
                      )}
                    </div>
                  </button>
                </>
              )}
            {sessionStatus === "loading" && (
              <div className="p-2">
                <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" />
              </div>
            )}
            {sessionStatus === "unauthenticated" && (
              <button className="px-3 py-1.5 text-sm font-medium text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800/50 transition-colors">
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Render Chat Panel */}
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

      {/* Render Profile Component */}
      {showProfileComponent && (
        <Profile onClose={() => setShowProfileComponent(false)} />
      )}
    </>
  );
};

export default Navbar;
