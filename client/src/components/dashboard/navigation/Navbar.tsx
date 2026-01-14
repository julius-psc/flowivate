"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { IconChevronDown } from "@tabler/icons-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";

import ChatPanel from "../features/ai/ChatPanel";
import ProfilePopup from "./ProfilePopup";
import ShareModal from "./ShareModal";

interface StatusOption {
  name: string;
  color: string;
  bgColor: string;
}

interface NavbarProps {
  openSettings: (tab?: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ openSettings }) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [showProfileComponent, setShowProfileComponent] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const { data: session, status: sessionStatus } = useSession();
  const { theme } = useTheme();

  // Effect runs only on the client after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate isSpecialTheme *after* mount
  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const username = session?.user?.username || "User";
  const userId = session?.user?.id;
  const userInitial = username.charAt(0).toUpperCase();

  const statusOptions: StatusOption[] = useMemo(
    () => [
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

  useEffect(() => {
    if (sessionStatus === "authenticated" && userId) {
      setIsStatusLoading(true);
      fetch("/api/features/status")
        .then((res) => {
          if (!res.ok) {
            if (res.status === 404) {
              console.warn("User status not found, using default");
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showStatusMenu && !target.closest(".status-container")) {
        setShowStatusMenu(false);
      }
      if (
        showProfileComponent &&
        !target.closest(".profile-popup-container")
      ) {
        setShowProfileComponent(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusMenu, showProfileComponent]);

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

  const changeStatus = useCallback(
    async (statusOption: StatusOption) => {
      setCurrentStatus(statusOption);
      setShowStatusMenu(false);

      if (sessionStatus !== "authenticated") {
        toast.error("You must be logged in to change status.");
        return;
      }
      try {
        const response = await fetch("/api/features/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusOption.name }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
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
    [sessionStatus]
  );

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

  const handleSetConversationId = useCallback((): void => { }, []);

  // Define base classes that are always present
  const navBaseClasses =
    "flex items-center justify-between z-30 py-2 px-2 mx-2 mt-2 backdrop-blur-md rounded-2xl transition-opacity duration-300";
  // Define pre-mount classes (solid, maybe invisible to prevent flicker)
  const navPreMountClasses =
    "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  // Define post-mount classes based on theme
  const navPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100" // Frosted glass for special themes
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100"; // Standard light/dark with transparency

  const handleEditProfile = useCallback(() => {
    setShowProfileComponent(false);
    openSettings("account");
  }, [openSettings]);

  const handleShare = useCallback(() => {
    setShowProfileComponent(false);
    setIsShareModalOpen(true);
  }, []);

  return (
    <>
      <nav
        className={`${navBaseClasses} ${isMounted ? navPostMountClasses : navPreMountClasses // <--- Apply conditional classes
          }`}
      >
        {/* ... rest of Navbar content (Ask Lumo button, Status, Profile Icon) ... */}
        {/* ... rest of Navbar content (Status, Profile Icon) ... */}
        <div className="flex items-center">

        </div>

        <div className="flex items-center space-x-1">
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
                  <div
                    className={`absolute right-0 mt-4 w-36 rounded-xl p-1.5 z-50 border transition-all duration-200 ${isMounted
                        ? isSpecialTheme
                          ? "bg-zinc-900/90 border-zinc-800 backdrop-blur-xl"
                          : "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800"
                        : "opacity-0"
                      }`}
                  >
                    {statusOptions.map((option) => (
                      <button
                        key={option.name}
                        onClick={() => changeStatus(option)}
                        className="w-full flex items-center space-x-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-900 px-2 py-1.5 rounded-lg transition-colors"
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${option.bgColor} flex items-center justify-center shrink-0 border border-transparent dark:border-zinc-800`}
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

          <div className="relative profile-container">
            {sessionStatus === "authenticated" && session.user && (
              <>
                <button
                  onClick={() => {
                    setShowProfileComponent(!showProfileComponent);
                    setShowStatusMenu(false);
                  }}
                  className="flex items-center space-x-2 p-1 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
                  aria-label="Open User Profile"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white font-medium text-sm overflow-hidden">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.username || "User Avatar"}
                        width={28}
                        height={28}
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <span className="flex items-center justify-center w-full h-full bg-green-500">
                        {userInitial}
                      </span>
                    )}
                  </div>
                </button>

                {showProfileComponent && (
                  <ProfilePopup
                    session={session}
                    currentStatus={currentStatus}
                    isSpecialTheme={isSpecialTheme}
                    isMounted={isMounted}
                    onEditProfile={handleEditProfile}
                    onShare={handleShare}
                  />
                )}
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </>
  );
};

export default Navbar;