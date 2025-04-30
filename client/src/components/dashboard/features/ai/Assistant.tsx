"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  IconCircleDashedPlus,
  IconChevronRight,
  IconMessage,
  IconTrash,
  IconLock,
  IconLoader2,
} from "@tabler/icons-react";
import logo from "../../../../assets/brand/logo-v1.5.svg";
import Image from "next/image";
import ChatPanel from "./ChatPanel";
import { toast } from "sonner"; // Import Sonner toast

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

const Assistant: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [initialQuery, setInitialQuery] = useState<string | undefined>(
    undefined
  );
  const [showRecentChats, setShowRecentChats] = useState(false);
  const [recentChats, setRecentChats] = useState<RecentChatSummary[]>([]);
  const [isLoadingRecents, setIsLoadingRecents] = useState(false);
  // const [errorRecents, setErrorRecents] = useState<string | null>(null); // REMOVE error state

  const fetchRecentChats = useCallback(async () => {
    setIsLoadingRecents(true);
    // setErrorRecents(null); // REMOVE
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
      // setErrorRecents("Could not load recent chats."); // REMOVE
      toast.error("Could not load recent chats."); // Use toast
      setRecentChats([]);
    } finally {
      setIsLoadingRecents(false);
    }
  }, []);

  useEffect(() => {
    if (showRecentChats) {
      fetchRecentChats();
    }
  }, [showRecentChats, fetchRecentChats]);

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
      text: "Organize my dashboard",
      starter: "I want to better organize my productivity dashboard...",
    },
    { text: "Give me ideas", starter: "I would like ideas for..." },
    {
      text: "Create me an action plan",
      starter: "I need an action plan for...",
    },
  ];

  const handleNewChat = (starter?: string) => {
    setCurrentChatId(null);
    setInitialMessages([]);
    setInitialQuery(starter || "");
    setIsChatOpen(true);
    setShowRecentChats(false);
  };

  const handleRecentChatClick = async (chatId: string) => {
    setIsLoadingRecents(true);
    // setErrorRecents(null); // REMOVE
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
      setShowRecentChats(false);
    } catch (error) {
      console.error("Error loading chat history:", error);
      // setErrorRecents("Could not load the selected chat."); // REMOVE
      toast.error("Could not load the selected chat."); // Use toast
      setIsChatOpen(false); // Keep panel closed on error
      setIsLoadingRecents(false); // Stop loading indicator if staying in Assistant view
    }
    // No finally needed here if ChatPanel handles its own loading
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
    } catch (error) {
      console.error("Error deleting chat:", error);
      // setErrorRecents("Could not delete the chat."); // REMOVE
      toast.error("Could not delete the chat."); // Use toast
      setRecentChats(originalChats); // Ensure revert on catch
    }
  };

  const handleChatClose = () => {
    setIsChatOpen(false);
    if (showRecentChats) {
      fetchRecentChats();
    }
  };

  return (
    <>
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
            MY ASSISTANT
          </h1>
        </div>
        <div className="w-full flex justify-center items-center mb-4">
          <Image
            className="w-24 h-auto"
            src={logo}
            alt="Flowivate's logo"
            priority
          />
        </div>

        <div className="flex-grow overflow-y-auto mb-4">
          {!showRecentChats ? (
            <div className="mx-4">
              <div className="mb-4">
                <p className="text-primary-black dark:text-gray-200 font-medium">
                  How can I help make your day more{" "}
                  <span className="text-primary-blue dark:text-blue-400">
                    productive
                  </span>
                  ?
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <IconLock className="w-3 h-3 mr-1" />
                  <span>Privacy is our priority</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mb-4">
                {assistantOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleNewChat(option.starter)}
                    className="flex items-center justify-between bg-primary-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-blue/30 dark:focus:ring-blue-400/30 group"
                    title={option.text}
                  >
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 dark:text-gray-300 ml-2 my-1 font-medium">
                        {option.text}
                      </span>
                    </div>
                    <IconChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recent Conversations
                </h3>
                <button
                  onClick={() => setShowRecentChats(false)}
                  className="text-xs text-primary-blue dark:text-blue-400 hover:underline"
                >
                  Back to suggestions
                </button>
              </div>
              {isLoadingRecents ? (
                <div className="flex justify-center items-center py-4">
                  <IconLoader2 className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" />
                </div> /* REMOVE error display div */
              ) : (
                // {errorRecents ? (
                //   <div className="text-center py-4 text-red-600 dark:text-red-400 text-sm">
                //     {errorRecents}
                //   </div>
                // ) : ( // )}
                <div className="space-y-2">
                  {recentChats.length > 0 ? (
                    recentChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => handleRecentChatClick(chat.id)}
                        className="flex items-start p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors duration-150 group"
                      >
                        <div className="mr-3 mt-1 flex-shrink-0">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <IconMessage className="w-4 h-4 text-primary-blue dark:text-blue-400" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {chat.title}
                            </h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                              {chat.timestamp}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="ml-2 p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete chat"
                        >
                          <IconTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                      No recent conversations found.
                    </div>
                  )}
                </div>
              )}{" "}
              {/* End of removed error display logic */}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center flex-shrink-0">
          <button
            onClick={() => {
              setShowRecentChats(!showRecentChats);
              if (!showRecentChats) {
                fetchRecentChats();
              }
            }}
            className="flex bg-primary-white dark:bg-gray-700/70 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 dark:focus:ring-blue-400/30"
          >
            <IconMessage className="w-5 h-5 mr-1 text-primary-black/60 dark:text-gray-300/60" />
            <span className="text-sm text-primary-black/60 dark:text-gray-300/60">
              {showRecentChats ? "New chat" : "Recent chats"}
            </span>
          </button>

          <button
            onClick={() => handleNewChat()}
            className="flex bg-primary-blue/10 dark:bg-blue-900/30 px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-primary-blue/20 dark:hover:bg-blue-800/40 focus:outline-none focus:ring-2 focus:ring-primary-blue/30 dark:focus:ring-blue-400/30"
          >
            <IconCircleDashedPlus className="w-5 h-5 mr-1 text-primary-blue dark:text-blue-400" />
            <span className="text-sm text-primary-blue dark:text-blue-400 font-medium">
              New chat
            </span>
          </button>
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