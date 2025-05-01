"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconSearch,
  IconX,
  IconArrowRight,
  IconHistory,
  IconCopy,
  IconCheck,
  IconMaximize,
  IconMinimize,
  IconVolume,
  IconSparkles,
} from "@tabler/icons-react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";

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

const generateMessageId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

const ChatPanel: React.FC<CommandBarProps> = ({
  isOpen,
  setIsOpen,
  initialQuery,
  initialMessages = [],
  conversationId,
  setConversationId,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [suggestions] = useState([
    "How can i be more focused?",
    "I feel overwhelmed by work, what do I do?",
    "Give me motivation to do my workout",
    "What is a dopamine detox?",
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const apiCallInProgressRef = useRef<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

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
      } catch (err: unknown) {
        let errorText = "An unknown error occurred while saving the chat.";
        if (err instanceof Error) {
          errorText = `Error saving chat: ${err.message}`;
        }
        console.error(errorText);
        toast.error("Failed to save chat progress.");
      }
    },
    [setConversationId]
  );

  const debouncedSaveChat = useDebouncedCallback(saveChat, 1500);

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
        if (
          currentHistory.length === 1 &&
          currentHistory[0].sender === "user"
        ) {
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
        toast.error(errorText);
      } finally {
        setIsLoading(false);
        apiCallInProgressRef.current = false;
      }
    },
    [conversationId, debouncedSaveChat]
  );

  useEffect(() => {
    if (isOpen) {
      setInputText("");
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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, setIsOpen]);

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
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        toast.error("Failed to copy text to clipboard.");
      });
  };

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        toast.error(`Could not speak message: ${event.error}`);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech synthesis not supported in this browser.");
      toast.warning("Speech synthesis is not supported in this browser.");
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const barVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
    },
    exit: {
      opacity: 0,
      y: -15,
      scale: 0.98,
      transition: { duration: 0.15, ease: [0.4, 0, 0.6, 1] },
    },
  };

  const expandedVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.2, delay: 0.05 },
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.15, ease: [0.4, 0, 0.6, 1] },
        opacity: { duration: 0.1 },
      },
    },
  };

  const messageVariants = {
    initial: { opacity: 0, y: 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const SkeletonLoader = () => (
    <div className="flex flex-col gap-2 pl-2 w-full animate-pulse">
      <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-md w-3/4"></div>
      <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-md w-1/2"></div>
      <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded-md w-5/6"></div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 md:pt-32 px-4">
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            variants={barVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative w-full max-w-xl flex flex-col bg-white/90 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-200/50 dark:border-zinc-700/30 rounded-lg overflow-hidden z-[51]"
            style={{ boxShadow: "0 4px 24px rgba(0, 0, 0, 0.08)" }}
          >
            <div className="relative flex items-center px-3 py-3">
              <div className="absolute left-3 text-gray-400 dark:text-gray-500">
                <IconSearch className="w-4 h-4" />
              </div>
              <form onSubmit={handleSendMessage} className="w-full">
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="w-full py-1.5 pl-7 pr-8 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-sm"
                  autoComplete="off"
                />
              </form>
              <div className="flex items-center">
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  className={`p-1 rounded-md flex items-center justify-center ${
                    inputText.trim() && !isLoading
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  } transition-colors`}
                  aria-label="Send message"
                >
                  <IconArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {messages.length === 0 && (
              <div className="px-3 py-2 flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputText(suggestion);
                      const userMessage: Message = {
                        id: generateMessageId(),
                        sender: "user",
                        text: suggestion,
                        timestamp: new Date(),
                      };
                      setMessages([userMessage]);
                      fetchAndSetClaudeResponse(suggestion, [userMessage]);
                    }}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-zinc-800/70 hover:bg-gray-200 dark:hover:bg-zinc-700/70 rounded-md text-xs text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5"
                  >
                    <IconSparkles className="w-3 h-3 text-blue-500" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

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
                    className="max-h-96 overflow-y-auto px-3 py-2"
                  >
                    <AnimatePresence initial={false}>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          variants={messageVariants}
                          initial="initial"
                          animate="animate"
                          layout
                          className="mb-4 group"
                        >
                          {msg.sender === "user" ? (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 pl-1">
                              You
                            </div>
                          ) : null}
                          <div className="flex items-start gap-2">
                            <div
                              className={`flex-grow rounded-md p-2.5 ${
                                msg.sender === "user"
                                  ? "text-sm text-gray-700 dark:text-gray-300"
                                  : "bg-gray-50/70 dark:bg-zinc-800/40 text-sm text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              <div className="whitespace-pre-wrap leading-relaxed break-words">
                                {msg.text}
                              </div>
                            </div>

                            <div
                              className={`flex items-center self-start opacity-0 group-hover:opacity-100 transition-opacity duration-200 gap-1`}
                            >
                              <button
                                onClick={() =>
                                  copyMessageToClipboard(msg.text, msg.id)
                                }
                                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-colors"
                                aria-label="Copy message"
                              >
                                {copiedMessageId === msg.id ? (
                                  <IconCheck className="w-3 h-3 text-green-500" />
                                ) : (
                                  <IconCopy className="w-3 h-3" />
                                )}
                              </button>
                              {msg.sender === "assistant" && !msg.isTyping && (
                                <button
                                  onClick={() => speakMessage(msg.text)}
                                  className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800/70 transition-colors"
                                  aria-label="Listen to message"
                                >
                                  <IconVolume className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right pr-2">
                            {formatTime(msg.timestamp)}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {isLoading && (
                      <motion.div
                        key="loading-indicator"
                        variants={messageVariants}
                        initial="initial"
                        animate="animate"
                        layout
                        className="mb-4"
                      >
                        <div className="flex-grow rounded-md p-2.5 bg-gray-50/70 dark:bg-zinc-800/40">
                          <SkeletonLoader />
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} className="h-1" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length > 0 && (
              <div className="px-3 py-1.5 flex justify-between items-center border-t border-gray-200/50 dark:border-zinc-700/30 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <IconHistory className="w-3 h-3 mr-1" />
                  <span>
                    {messages.filter((m) => !m.isTyping).length} messages
                  </span>
                </div>

                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  {expanded ? (
                    <>
                      <IconMinimize className="w-3 h-3 mr-1" />
                      <span>Collapse</span>
                    </>
                  ) : (
                    <>
                      <IconMaximize className="w-3 h-3 mr-1" />
                      <span>Expand</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <IconX className="w-3 h-3" />
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