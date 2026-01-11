"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconCommand,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/Skeleton";
import logo from "../../../../assets/brand/lumo-logo.svg";
import Image from "next/image";
import ChatPanel from "./ChatPanel";
import { toast } from "sonner";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { motion } from "motion/react";

interface RecentChatSummary {
  id: string;
  title: string;
  timestamp: string;
}

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

const CHATS_PER_PAGE = 5;
const HOME_CHATS_DISPLAY = 4;

const Assistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(
    undefined
  );
  const [recentChats, setRecentChats] = useState<RecentChatSummary[]>([]);
  const [isLoadingRecents, setIsLoadingRecents] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

  const [view, setView] = useState<"home" | "history">("home");

  const { theme } = useTheme();
  const isSpecialTheme =
    theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const fetchRecentChats = useCallback(async () => {
    setIsLoadingRecents(true);
    try {
      const response = await fetch("/api/chats");
      if (!response.ok) {
        throw new Error(`Failed to fetch recent chats: ${response.statusText}`);
      }
      const data: Array<{ id: string; title: string; timestamp: string }> =
        await response.json();
      const formattedData = data.map((chat) => ({
        ...chat,
        timestamp: formatRelativeTime(chat.timestamp),
      }));
      setRecentChats(formattedData);
    } catch (error) {
      console.error("Error fetching recent chats:", error);
      toast.error("Could not load recent chats.");
      setRecentChats([]);
    } finally {
      setIsLoadingRecents(false);
    }
  }, []);

  useEffect(() => {
    // Fetch recent chats on mount for home view display
    fetchRecentChats();
  }, [fetchRecentChats]);

  useEffect(() => {
    if (view === "history") {
      fetchRecentChats();
    }
  }, [view, fetchRecentChats]);

  const formatRelativeTime = (isoTimestamp: string): string => {
    const date = new Date(isoTimestamp);
    const now = new Date();
    const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return `1d`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const quickActions = [
    { text: "Plan my day", starter: "Help me plan my day effectively..." },
    { text: "Set goals", starter: "Help me define clear goals for..." },
    { text: "Focus tips", starter: "Give me focus and productivity tips for..." },
  ];

  const handleNewChat = (starter?: string) => {
    setCurrentChatId(null);
    setInitialMessages([]);
    setInitialQuery(starter || "");
    setIsChatOpen(true);
  };

  // Pagination logic for history view
  const totalPages = Math.ceil(recentChats.length / CHATS_PER_PAGE);
  const paginatedChats = recentChats.slice(
    currentPage * CHATS_PER_PAGE,
    (currentPage + 1) * CHATS_PER_PAGE
  );

  // Home view shows only first 4 chats
  const homeChats = recentChats.slice(0, HOME_CHATS_DISPLAY);

  const handleRecentChatClick = async (chatId: string) => {
    setIsLoadingRecents(true);
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch chat ${chatId}: ${response.statusText}`
        );
      }
      const chatData = await response.json();

      const messagesWithDates = chatData.messages.map(
        (msg: {
          id?: string;
          text: string;
          sender: "user" | "assistant";
          timestamp: string;
        }) => ({
          ...msg,
          id: msg.id || Math.random().toString(36).substring(2),
          timestamp: new Date(msg.timestamp),
        })
      );

      setCurrentChatId(chatId);
      setInitialMessages(messagesWithDates);
      setInitialQuery("");
      setIsChatOpen(true);
    } catch (error) {
      console.error("Error loading chat history:", error);
      toast.error("Could not load the selected chat.");
      setIsChatOpen(false);
      setIsLoadingRecents(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();

    const originalChats = recentChats;
    setRecentChats((prev) => prev.filter((chat) => chat.id !== chatId));

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setRecentChats(originalChats);
        throw new Error(`Failed to delete chat: ${response.statusText}`);
      }
      console.log(`Chat ${chatId} deleted`);
      if (currentChatId === chatId) {
        setIsChatOpen(false);
        setCurrentChatId(null);
        setInitialMessages([]);
        setInitialQuery(undefined);
      }
      // Adjust page if current page becomes empty
      const newTotalChats = recentChats.length - 1;
      const newTotalPages = Math.ceil(newTotalChats / CHATS_PER_PAGE);
      if (currentPage >= newTotalPages && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Could not delete the chat.");
      setRecentChats(originalChats);
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    fetchRecentChats();
  };

  return (
    <>
      <div className="relative h-full">
        {/* Animated glow behind the card */}
        <motion.div
          className="absolute -inset-1 bg-primary-blue/20 rounded-2xl blur-xl"
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div
          className={`relative p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${isSpecialTheme
            ? "dark bg-zinc-900/50 border border-zinc-800/50"
            : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
            }`}
        >
          {view === "home" ? (
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="w-full flex flex-col items-center mb-4 mt-2">
                <Image
                  className="w-14 h-auto opacity-80"
                  src={logo}
                  alt="Lumo logo"
                  priority
                />
              </div>

              {/* Input Field with keyboard shortcut */}
              <button
                onClick={() => handleNewChat()}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg mb-4 transition-all ${isSpecialTheme
                  ? 'bg-white/5 hover:bg-white/10 border border-white/10'
                  : 'bg-gray-100/80 dark:bg-zinc-800/80 hover:bg-gray-200/80 dark:hover:bg-zinc-700/80 border border-gray-200/50 dark:border-zinc-700/50'
                  }`}
              >
                {/* Keyboard shortcut indicator */}
                <span className={`flex items-center justify-center gap-0.5 px-1.5 h-5 rounded text-[10px] font-medium ${isSpecialTheme
                  ? 'bg-white/10 text-white/50'
                  : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'
                  }`}>
                  <IconCommand className="w-3 h-3" />
                  <span>F</span>
                </span>
                <span className={`text-sm ${isSpecialTheme
                  ? 'text-white/40'
                  : 'text-gray-400 dark:text-gray-500'
                  }`}>
                  Ask Lumo anything...
                </span>
              </button>

              {/* Quick Actions - Inline compact labels */}
              <div className="mb-4">
                <span className={`text-[10px] uppercase tracking-wider font-medium mb-2 block ${isSpecialTheme ? 'text-white/30' : 'text-gray-400 dark:text-gray-500'}`}>
                  Quick Actions
                </span>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleNewChat(action.starter)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-md transition-all ${isSpecialTheme
                        ? 'hover:bg-white/10 text-white/60 hover:text-white/80'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                      {action.text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Chats Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] uppercase tracking-wider font-medium ${isSpecialTheme ? 'text-white/30' : 'text-gray-400 dark:text-gray-500'}`}>
                    Recent Chats
                  </span>
                  {recentChats.length > HOME_CHATS_DISPLAY && (
                    <button
                      onClick={() => setView("history")}
                      className={`text-[10px] font-medium transition-colors ${isSpecialTheme
                        ? 'text-white/40 hover:text-white/60'
                        : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                    >
                      View all
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {isLoadingRecents ? (
                    <div className="space-y-1">
                      <Skeleton className="h-8 w-full rounded-md" />
                      <Skeleton className="h-8 w-full rounded-md" />
                      <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                  ) : homeChats.length > 0 ? (
                    <div className="space-y-0.5">
                      {homeChats.map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => handleRecentChatClick(chat.id)}
                          onMouseEnter={() => setHoveredChatId(chat.id)}
                          onMouseLeave={() => setHoveredChatId(null)}
                          className={`flex items-center justify-between py-2 px-1 rounded-md cursor-pointer transition-colors ${isSpecialTheme
                            ? 'hover:bg-white/5'
                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                            }`}
                        >
                          <span className={`text-sm truncate flex-1 ${isSpecialTheme
                            ? 'text-white/70'
                            : 'text-gray-700 dark:text-gray-300'
                            }`}>
                            {chat.title}
                          </span>
                          <span className={`text-[10px] ml-2 shrink-0 ${isSpecialTheme
                            ? 'text-white/30'
                            : 'text-gray-400 dark:text-gray-500'
                            }`}>
                            {chat.timestamp}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-4 text-xs ${isSpecialTheme ? 'text-white/30' : 'text-gray-400 dark:text-gray-500'}`}>
                      No chats yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Recent Chats Full History View */
            <div className="flex-grow overflow-hidden flex flex-col animate-fade-in">
              {/* Header with back button */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setView("home")}
                  className={`p-1 rounded-md transition-colors ${isSpecialTheme
                    ? "hover:bg-white/10 text-white/60 hover:text-white"
                    : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
                    }`}
                >
                  <IconChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-sm font-medium ${isSpecialTheme ? 'text-white/70' : 'text-gray-700 dark:text-gray-300'}`}>
                  All Chats
                </span>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className={`text-[10px] ${isSpecialTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`}>
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                      disabled={currentPage === 0}
                      className={`p-1 rounded transition-colors disabled:opacity-30 ${isSpecialTheme
                        ? 'hover:bg-white/10 text-white/60'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500'
                        }`}
                    >
                      <IconChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className={`p-1 rounded transition-colors disabled:opacity-30 ${isSpecialTheme
                        ? 'hover:bg-white/10 text-white/60'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500'
                        }`}
                    >
                      <IconChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-grow overflow-y-auto">
                {isLoadingRecents ? (
                  <div className="space-y-2 px-1">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ) : paginatedChats.length > 0 ? (
                  <div className="space-y-0.5">
                    {paginatedChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleRecentChatClick(chat.id)}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                        className={`flex items-center justify-between py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${isSpecialTheme
                          ? 'hover:bg-white/5'
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                          }`}
                      >
                        <span className={`text-sm truncate flex-1 ${isSpecialTheme
                          ? 'text-white/70'
                          : 'text-gray-700 dark:text-gray-300'
                          }`}>
                          {chat.title}
                        </span>
                        <span className={`text-[10px] ml-2 shrink-0 ${isSpecialTheme
                          ? 'text-white/30'
                          : 'text-gray-400 dark:text-gray-500'
                          }`}>
                          {chat.timestamp}
                        </span>
                        <button
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className={`ml-2 p-1 rounded opacity-0 transition-opacity ${hoveredChatId === chat.id ? 'opacity-100' : ''
                            } ${isSpecialTheme
                              ? 'hover:bg-white/10 text-white/40 hover:text-red-400'
                              : 'hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400 hover:text-red-500'
                            }`}
                          title="Delete chat"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-6 text-sm ${isSpecialTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`}>
                    No conversations yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ChatPanel
        isOpen={isChatOpen}
        setIsOpen={handleChatClose}
        initialQuery={initialQuery || ""}
        initialMessages={initialMessages}
        conversationId={currentChatId}
        setConversationId={setCurrentChatId}
      />
    </>
  );
};

export default Assistant;