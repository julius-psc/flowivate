"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSearch,
  IconX,
  IconLoader2,
  IconArrowRight,
  IconHourglass,
  IconHistory,
  IconUser,
  IconVolume,
  IconCopy,
  IconCheck,
  IconMaximize,
  IconMinimize,
  IconMoodSmile,
  IconSparkles,
} from "@tabler/icons-react";
import { useDebouncedCallback } from "use-debounce";

// --- Interfaces ---

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface CommandBarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  initialQuery?: string;
  initialMessages?: Message[];
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
}

// --- Helper ---

const generateMessageId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- ChatPanel Component ---

const ChatPanel: React.FC<CommandBarProps> = ({
  isOpen,
  setIsOpen,
  initialQuery,
  initialMessages = [],
  conversationId,
  setConversationId,
}) => {
  // --- State ---
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [suggestions] = useState([
    "How can i be more focused?",
    "I feel overwhelmed by work, what do I do?",
    "Give me motivation to do my workout",
    "What is a dopamine detox?",
  ]);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiCallInProgressRef = useRef<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // --- Database Saving Logic ---
  const saveChat = useCallback(
    async (
      currentMessages: Message[],
      currentConversationId: string | null
    ) => {
      if (currentMessages.length === 0) return;
      const messagesToSave = currentMessages.filter((msg) => !msg.isTyping);
      if (messagesToSave.length === 0) return;
      try {
        const response = await fetch("/api/chats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: messagesToSave.map((m) => ({
              sender: m.sender,
              text: m.text,
              timestamp: m.timestamp.toISOString(),
            })),
            conversationId: currentConversationId,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Failed to save chat: ${response.statusText}`
          );
        }
        const result = await response.json();
        if (!currentConversationId && result.conversationId) {
          setConversationId(result.conversationId);
        }
        setError(null);
      } catch (err: unknown) {
        let errorText = "An unknown error occurred while saving the chat.";
        if (err instanceof Error) {
          errorText = `Error saving chat: ${err.message}`;
        }
        console.error(errorText);
      }
    },
    [setConversationId]
  );

  const debouncedSaveChat = useDebouncedCallback(saveChat, 1500);

  // --- Claude API Logic ---
  const fetchAndSetClaudeResponse = useCallback(
    async (userMessageText: string, currentHistory: Message[]) => {
      if (apiCallInProgressRef.current) {
        console.warn(
          "API call already in progress, skipping duplicate request"
        );
        return;
      }
      apiCallInProgressRef.current = true;
      setIsLoading(true);
      setError(null);
      try {
        const conversationHistory = currentHistory
          .filter((msg) => !msg.isTyping)
          .map((msg) => ({ sender: msg.sender, text: msg.text }));
        const response = await fetch("/api/claude", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMessageText,
            conversationHistory,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `Claude API Error: ${response.status}`
          );
        }
        const data = await response.json();
        const aiMessage: Message = {
          id: generateMessageId(),
          sender: "assistant",
          text: data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const updatedMessages = [...prev, aiMessage];
          debouncedSaveChat(updatedMessages, conversationId);
          return updatedMessages;
        });
        // Auto-expand when first response arrives
        if (currentHistory.length === 1 && currentHistory[0].sender === "user") {
          setExpanded(true);
        }
      } catch (err: unknown) {
        let errorText = "Sorry, an unknown error occurred. Please try again.";
        if (err instanceof Error) {
          errorText = `Sorry, error: ${err.message}. Try again?`;
        }
        const errorMessage: Message = {
          id: generateMessageId(),
          sender: "assistant",
          text: errorText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setError(errorText);
      } finally {
        setIsLoading(false);
        apiCallInProgressRef.current = false;
      }
    },
    [conversationId, debouncedSaveChat]
  );

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      setInputText("");
      setError(null);
      setIsLoading(false);
      apiCallInProgressRef.current = false;
      if (initialMessages && initialMessages.length > 0) {
        setMessages(
          initialMessages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
        setExpanded(true);
      } else if (initialQuery) {
        const userMessage: Message = {
          id: generateMessageId(),
          sender: "user",
          text: initialQuery,
          timestamp: new Date(),
        };
        setMessages([userMessage]);
        fetchAndSetClaudeResponse(initialQuery, [userMessage]);
      } else {
        setMessages([]);
        setExpanded(false);
      }
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery, initialMessages, fetchAndSetClaudeResponse]);

  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, expanded]);

  useEffect(() => {
    if (copiedMessageId) {
      const timer = setTimeout(() => setCopiedMessageId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, setIsOpen]);

  // --- Handlers ---
  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const trimmedInput = inputText.trim();
      if (!trimmedInput || isLoading || apiCallInProgressRef.current) return;
      const userMessage: Message = {
        id: generateMessageId(),
        sender: "user",
        text: trimmedInput,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputText("");
      setError(null);
      setMessages((currentMessages) => {
        fetchAndSetClaudeResponse(trimmedInput, currentMessages);
        return currentMessages;
      });
    },
    [inputText, isLoading, fetchAndSetClaudeResponse]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return "--:--";
    }
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const copyMessageToClipboard = (text: string, messageId: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => setCopiedMessageId(messageId))
      .catch((err) => console.error("Failed to copy text: ", err));
  };

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
    }
  };

  // --- Animation Variants ---
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const barVariants = {
    hidden: { opacity: 0, y: -50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
    },
    exit: {
      opacity: 0,
      y: -30,
      scale: 0.95,
      transition: { duration: 0.2, ease: [0.5, 0, 0.75, 0] },
    },
  };

  const expandedVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: "auto", 
      opacity: 1,
      transition: { 
        height: { duration: 0.3, ease: "easeOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    },
    exit: { 
      height: 0, 
      opacity: 0,
      transition: { 
        height: { duration: 0.2, ease: "easeIn" },
        opacity: { duration: 0.1 }
      }
    }
  };

  const messageVariants = {
    initial: { opacity: 0, y: 8 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 md:pt-32 px-4">
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Command Bar - Main Container */}
          <motion.div
            variants={barVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-2xl flex flex-col bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md backdrop-saturate-150 border border-gray-200 dark:border-zinc-700/50 shadow-2xl rounded-2xl overflow-hidden z-[51]"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            }}
          >
            {/* Input Bar */}
            <div className="relative flex items-center px-4 py-3 border-b border-gray-200 dark:border-zinc-700/70">
              <div className="absolute left-4 text-gray-400 dark:text-gray-500">
                <IconSearch className="w-5 h-5" />
              </div>
              <form onSubmit={handleSendMessage} className="w-full">
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="w-full py-2 pl-8 pr-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-base"
                  autoComplete="off"
                />
              </form>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <IconLoader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className={`p-1.5 rounded-lg flex items-center justify-center ${
                    inputText.trim() && !isLoading
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  } transition-colors duration-150`}
                >
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Suggestion Pills (visible when no messages) */}
            {messages.length === 0 && (
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputText(suggestion);
                      // Submit the suggestion automatically
                      const userMessage: Message = {
                        id: generateMessageId(),
                        sender: "user",
                        text: suggestion,
                        timestamp: new Date(),
                      };
                      setMessages([userMessage]);
                      fetchAndSetClaudeResponse(suggestion, [userMessage]);
                    }}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full text-sm text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
                  >
                    <IconSparkles className="w-3.5 h-3.5 text-blue-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Error Display Banner */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border-b border-red-200 dark:border-red-800/50 flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            )}

            {/* Expanded Messages Area */}
            <AnimatePresence mode="wait">
              {(expanded || messages.length > 0) && (
                <motion.div
                  key="messages-container"
                  initial="collapsed"
                  animate="expanded"
                  exit="exit"
                  variants={expandedVariants}
                  className="overflow-hidden"
                >
                  <div
                    ref={messagesContainerRef}
                    className="max-h-96 overflow-y-auto px-4 py-3 bg-white/50 dark:bg-zinc-900/50"
                  >
                    {/* Render Messages */}
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          variants={messageVariants}
                          initial="initial"
                          animate="animate"
                          layout
                          className={`flex mb-4 group ${
                            msg.sender === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex items-end gap-2 max-w-[85%] ${
                              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Avatar */}
                            <div 
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                msg.sender === "user" 
                                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                  : "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                              }`}
                            >
                              {msg.sender === "user" ? (
                                <IconUser className="w-4 h-4" />
                              ) : (
                                <IconMoodSmile className="w-4 h-4" />
                              )}
                            </div>
                            
                            {/* Message Bubble */}
                            <div
                              className={`relative px-4 py-3 rounded-xl ${
                                msg.sender === "user"
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                                {msg.text}
                              </div>
                              <span
                                className={`absolute -bottom-4 text-[10px] ${
                                  msg.sender === "user"
                                    ? "right-2 text-gray-500 dark:text-gray-400"
                                    : "left-2 text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                            
                            {/* Message Actions */}
                            <div
                              className={`flex items-center self-center mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1 ${
                                msg.sender === "user" ? "mr-1" : "ml-1"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  copyMessageToClipboard(msg.text, msg.id)
                                }
                                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                aria-label="Copy message"
                              >
                                {copiedMessageId === msg.id ? (
                                  <IconCheck className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <IconCopy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              {msg.sender === "assistant" && !msg.isTyping && (
                                <button
                                  onClick={() => speakMessage(msg.text)}
                                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                                  aria-label="Listen to message"
                                >
                                  <IconVolume className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* Loading Indicator */}
                    {isLoading && (
                      <motion.div
                        key="loading-indicator"
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        layout
                        className="flex justify-start mb-4"
                      >
                        <div className="flex items-end gap-2 max-w-[85%]">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                            <IconHourglass className="w-4 h-4" />
                          </div>
                          <div className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-gray-100">
                            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                              <IconLoader2 className="w-4 h-4 animate-spin text-blue-500" />
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            {messages.length > 0 && (
              <div className="px-4 py-2 flex justify-between items-center border-t border-gray-200 dark:border-zinc-700/70 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <IconHistory className="w-3.5 h-3.5 mr-1" />
                  <span>{messages.filter(m => !m.isTyping).length} messages</span>
                </div>
                
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {expanded ? (
                    <>
                      <IconMinimize className="w-3.5 h-3.5 mr-1" />
                      <span>Collapse</span>
                    </>
                  ) : (
                    <>
                      <IconMaximize className="w-3.5 h-3.5 mr-1" />
                      <span>Expand</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <IconX className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;