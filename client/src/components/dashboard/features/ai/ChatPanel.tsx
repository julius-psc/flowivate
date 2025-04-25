"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSend,
  IconX,
  IconLoader2,
  IconRobot,
  IconChevronDown,
  IconLock,
  IconVolume,
  IconCopy,
  IconCheck,
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

interface ChatPanelProps {
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

const ChatPanel: React.FC<ChatPanelProps> = ({
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
  const [showInfo, setShowInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // --- Refs ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
      }
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery, initialMessages, fetchAndSetClaudeResponse]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = `${Math.min(scrollHeight, 128)}px`;
    }
  }, [inputText]);

  useEffect(() => {
    if (copiedMessageId) {
      const timer = setTimeout(() => setCopiedMessageId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedMessageId]);

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
      if (inputRef.current) inputRef.current.style.height = "auto";
      setMessages((currentMessages) => {
        fetchAndSetClaudeResponse(trimmedInput, currentMessages);
        return currentMessages;
      });
    },
    [inputText, isLoading, fetchAndSetClaudeResponse]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
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

  const panelVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
    },
    exit: {
      opacity: 0,
      y: 30,
      scale: 0.98,
      transition: { duration: 0.2, ease: [0.5, 0, 0.75, 0] },
    },
  };

  const messageVariants = {
    initial: { opacity: 0, y: 10 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4"
        >
          {/* Overlay */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-white/10 backdrop-blur-sm backdrop-saturate-150 transition-all duration-300"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel - Main Container */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full sm:max-w-2xl h-[95vh] sm:h-[85vh] max-h-[800px] bg-secondary-white flex flex-col overflow-hidden shadow-2xl rounded-t-2xl sm:rounded-xl z-[51]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-bdr-light">
              <div className="flex items-center gap-3">
                {/* Assistant Icon/Badge */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-blue flex items-center justify-center">
                  <IconRobot className="w-5 h-5 text-secondary-white" />
                </div>
                {/* Title and Info */}
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-secondary-black">
                    Assistant
                  </h2>
                  <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="flex items-center text-xs text-accent-grey-hover hover:text-primary-blue"
                  >
                    <span>{showInfo ? "Hide" : "Show"} Info</span>
                    <IconChevronDown
                      className={`w-3.5 h-3.5 ml-1 transition-transform ${
                        showInfo ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-accent-grey-hover hover:bg-accent-lightgrey hover:text-secondary-black transition-colors"
                aria-label="Close chat"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Privacy Info Panel */}
            <AnimatePresence>
              {showInfo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-b border-bdr-light"
                >
                  <div className="p-3 sm:p-4 bg-primary-bluelight bg-opacity-30 text-xs text-secondary-black">
                    <p className="flex items-center mb-1">
                      <IconLock
                        size={14}
                        className="mr-1.5 flex-shrink-0 text-primary-blue"
                      />
                      <span>
                        End-to-end encrypted. Your conversations are private.
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold">Powered by Claude:</span>{" "}
                      Secure processing via Anthropic.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display Banner */}
            {error && (
              <div className="p-3 bg-third-red bg-opacity-10 text-third-red text-sm border-b border-third-red border-opacity-20 flex items-center gap-2">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            )}

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 px-4 sm:px-6 py-5 overflow-y-auto scroll-smooth bg-secondary-white"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: `var(--color-accent-grey) transparent`,
              }}
            >
              {/* Empty State */}
              {messages.length === 0 && !isLoading && (
                <div className="flex flex-col justify-center items-center h-full text-center text-accent-grey-hover p-6">
                  <div className="mb-4">
                    <IconRobot
                      size={40}
                      className="text-primary-blue"
                    />
                  </div>
                  <h3 className="text-lg font-medium text-secondary-black mb-1">
                    Ready to Assist
                  </h3>
                  <p className="text-sm max-w-xs">
                    How can I help you be more productive today?
                  </p>
                </div>
              )}

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
                      className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`relative px-4 py-3 rounded-2xl shadow-sm ${
                          msg.sender === "user"
                            ? "bg-primary-blue text-secondary-white"
                            : "bg-accent-lightgrey text-secondary-black"
                        }`}
                      >
                        <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
                          {msg.text}
                        </div>
                        <span
                          className={`absolute -bottom-3 text-[10px] ${
                            msg.sender === "user"
                              ? "right-2 text-accent-grey"
                              : "left-2 text-accent-grey-hover"
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
                          className="p-1 rounded-full text-accent-grey-hover hover:bg-accent-lightgrey hover:text-secondary-black transition-colors"
                          aria-label="Copy message"
                        >
                          {copiedMessageId === msg.id ? (
                            <IconCheck className="w-3.5 h-3.5 text-third-green" />
                          ) : (
                            <IconCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {msg.sender === "assistant" &&
                          !msg.isTyping && (
                            <button
                              onClick={() => speakMessage(msg.text)}
                              className="p-1 rounded-full text-accent-grey-hover hover:bg-accent-lightgrey hover:text-secondary-black transition-colors"
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
                  <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                    <div className="px-4 py-3 rounded-2xl bg-accent-lightgrey text-secondary-black shadow-sm">
                      <div className="flex items-center space-x-2 text-accent-grey-hover">
                        <IconLoader2 className="w-4 h-4 animate-spin text-primary-blue" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 sm:p-4 border-t border-bdr-light bg-secondary-white"
            >
              <div className="flex items-end gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-4 py-3 pr-10 rounded-xl border border-bdr-light bg-secondary-white text-secondary-black text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue-ring focus:border-primary-blue resize-none placeholder-accent-grey-hover"
                    style={{ scrollbarWidth: "none" }}
                  />
                </div>
                <button
                  type="submit"
                  title="Send message"
                  className={`flex-shrink-0 w-11 h-11 rounded-xl bg-primary-blue text-secondary-white hover:bg-primary-blue-hover disabled:bg-accent-grey disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-blue-ring ${
                    isLoading ? "w-11" : "w-11"
                  }`}
                  disabled={!inputText.trim() || isLoading}
                >
                  {isLoading ? (
                    <IconLoader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <IconSend className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatPanel;