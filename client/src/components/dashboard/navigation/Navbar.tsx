"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  IconChevronDown,
  IconPencil,
  IconGift,
  IconShare,
} from "@tabler/icons-react";
import { toast } from "sonner";

import lumoLogo from "../../../assets/brand/lumo-logo.svg";
import gradientBg from "../../../../public/assets/illustrations/landing-gradient.png";

import ChatPanel from "../features/ai/ChatPanel";

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
      if (showProfileComponent && !target.closest(".profile-popup")) {
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

  const handleSetConversationId = useCallback((): void => {}, []);

  return (
    <>
      <nav className="flex items-center justify-between py-2 px-2 mx-2 mt-2 backdrop-blur-md dark:bg-zinc-900/80 bg-transparent rounded-2xl border border-slate-200/30 dark:border-zinc-800/30">
        <div className="flex items-center">
          <div className="relative">
            <button
              onClick={handleOpenChat}
              aria-label="Ask your AI assistant Lumo"
              className="flex items-center py-1 px-2 rounded-lg bg-primary-blue/10 dark:bg-[#3A6EC8]/10 border border-[#3A6EC8]/20 text-sm text-left text-gray-700 dark:text-gray-200 transition-all duration-200 hover:border-primary/80 dark:hover:border-primary/80 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <Image
                src={lumoLogo}
                alt="Logo de Lumo"
                width={26}
                height={26}
                priority
              />
              <span className="flex-grow mx-1 font-semibold bg-gradient-to-b from-[#3A6EC8] to-[#6DA1C4] bg-clip-text text-transparent">
                Ask Lumo
              </span>
            </button>
          </div>
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
                  <div className="absolute right-0 mt-1 w-36 bg-transparent dark:bg-zinc-900/80 backdrop-blur-xl rounded-xl border border-slate-200/30 dark:border-zinc-800/30 p-1.5 z-20">
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
                  <div className="profile-popup absolute right-0 mt-2 w-80 backdrop-blur-xl bg-transparent dark:bg-zinc-900/80 rounded-2xl border border-slate-200/30 dark:border-zinc-800/30 overflow-hidden z-20">
                    <div className="relative">
                      <div className="absolute inset-0 opacity-60">
                        <Image
                          src={gradientBg}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="relative p-6">
                        <button
                          onClick={() => {}}
                          className="absolute top-4 right-4 p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
                          aria-label="Edit profile"
                        >
                          <IconPencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>

                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl overflow-hidden">
                              {session.user.image ? (
                                <Image
                                  src={session.user.image}
                                  alt={session.user.username || "User Avatar"}
                                  width={80}
                                  height={80}
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex items-center justify-center w-full h-full bg-green-500">
                                  {userInitial}
                                </span>
                              )}
                            </div>
                            <div
                              className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ${currentStatus.bgColor} flex items-center justify-center border-2 border-transparent dark:border-zinc-900/80`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${currentStatus.color}`}
                              />
                            </div>
                          </div>

                          <div className="flex-1 pt-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {username}
                              </h3>
                              <span className="px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/30 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                                ELITE
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {session.user.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              Member since 03/06/2007
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-6">
                          <button
                            onClick={() => {}}
                            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100/60 dark:bg-gray-800/30 hover:bg-gray-200/60 dark:hover:bg-gray-700/30 rounded-lg transition-colors border border-slate-200/30 dark:border-zinc-800/30"
                          >
                            <IconGift className="w-4 h-4" />
                            <span>Referrals</span>
                          </button>
                          <button
                            onClick={() => {}}
                            className="flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100/60 dark:bg-gray-800/30 hover:bg-gray-200/60 dark:hover:bg-gray-700/30 rounded-lg transition-colors border border-slate-200/30 dark:border-zinc-800/30"
                          >
                            <IconShare className="w-4 h-4" />
                            <span>Share</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
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
    </>
  );
};

export default Navbar;
