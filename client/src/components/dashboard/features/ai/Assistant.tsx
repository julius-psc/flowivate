"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import {
  IconMessage,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
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

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return `Yesterday`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const assistantOptions = [
    {
      text: "Plan my day",
      starter: "I would like to plan my day effectively...",
    },
    {
      text: "Identify blockers",
      starter: "What might be preventing me from achieving...",
    },
    { text: "Give me ideas", starter: "I would like ideas for..." },
    {
      text: "Make action plan",
      starter: "I need an action plan for...",
    },
  ];

  const handleNewChat = (starter?: string) => {
    setCurrentChatId(null);
    setInitialMessages([]);
    setInitialQuery(starter || "");
    setIsChatOpen(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(recentChats.length / CHATS_PER_PAGE);
  const paginatedChats = recentChats.slice(
    currentPage * CHATS_PER_PAGE,
    (currentPage + 1) * CHATS_PER_PAGE
  );

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
    if (view === "history") {
      fetchRecentChats();
    }
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
          {/* Header */}
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              {view === "history" && (
                <button
                  onClick={() => setView("home")}
                  className={`p-1 rounded-md transition-colors ${isSpecialTheme
                    ? "hover:bg-white/10 text-white/60 hover:text-white"
                    : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
                    }`}
                >
                  <IconChevronLeft className="w-4 h-4" />
                </button>
              )}
              <h1 className={`text-sm opacity-40 ${isSpecialTheme ? 'text-white/70' : 'text-secondary-black dark:text-secondary-white'}`}>
                LUMO
              </h1>
            </div>
            {/* View recent chats - top right */}
            {view === "home" && (
              <button
                onClick={() => setView("history")}
                className={`text-xs transition-colors ${isSpecialTheme
                  ? "text-white/40 hover:text-white/60"
                  : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  }`}
              >
                Recent chats →
              </button>
            )}
          </div>

          {view === "home" ? (
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="w-full flex flex-col items-center mb-6 mt-4">
                <Image
                  className="w-16 h-auto opacity-80"
                  src={logo}
                  alt="Lumo logo"
                  priority
                />
              </div>

              {/* Quick Actions - 2 column grid, no borders */}
              <div className="mx-2 grid grid-cols-2 gap-2 mb-4">
                {assistantOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleNewChat(option.starter)}
                    className={`text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${isSpecialTheme
                      ? 'bg-white/5 hover:bg-white/10 text-white/80'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {option.text}
                  </button>
                ))}
              </div>

              {/* New Chat with keyboard shortcut at bottom */}
              <div className="mx-2 mt-auto mb-2 flex justify-end">
                <button
                  onClick={() => handleNewChat()}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${isSpecialTheme
                    ? 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                    }`}
                >
                  <span className="font-medium">New Chat</span>
                  <span className={`flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] ${isSpecialTheme
                    ? 'bg-white/10 text-white/50'
                    : 'bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'
                    }`}>
                    <IconCommand className="w-2.5 h-2.5" />
                    <span>F</span>
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Recent Chats Section - Clean list with pagination */
            <div className="flex-grow overflow-hidden flex flex-col animate-fade-in">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className={`text-xs font-medium ${isSpecialTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500'}`}>
                  Recent
                </span>
                {totalPages > 1 && (
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
                    <span className={`text-xs ${isSpecialTheme ? 'text-white/40' : 'text-gray-400'}`}>
                      {currentPage + 1}/{totalPages}
                    </span>
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
                )}
              </div>

              <div className="flex-grow overflow-y-auto">
                {isLoadingRecents ? (
                  <div className="space-y-2 px-1">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                  </div>
                ) : paginatedChats.length > 0 ? (
                  <div className="space-y-1 px-1">
                    {paginatedChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleRecentChatClick(chat.id)}
                        onMouseEnter={() => setHoveredChatId(chat.id)}
                        onMouseLeave={() => setHoveredChatId(null)}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${isSpecialTheme
                          ? 'hover:bg-white/5'
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                          }`}
                      >
                        <div className={`mr-2.5 flex-shrink-0 transition-colors ${hoveredChatId === chat.id
                          ? (isSpecialTheme ? 'text-white' : 'text-primary')
                          : (isSpecialTheme ? 'text-white/40' : 'text-gray-400 dark:text-gray-500')
                          }`}>
                          <IconMessage size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm truncate ${isSpecialTheme
                            ? 'text-white/80'
                            : 'text-gray-700 dark:text-gray-300'
                            }`}>
                            {chat.title}
                          </h4>
                        </div>
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