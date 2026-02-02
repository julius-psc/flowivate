"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { motion, AnimatePresence } from "motion/react";
import {
  IconX,
  IconArrowRight,
} from "@tabler/icons-react";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/Skeleton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: Date;
  isTyping?: boolean;
  missingData?: {
    sleep: boolean;
    mood: boolean;
    journal: boolean;
    tasks: boolean;
  };
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
  const { highlightFeature, isFeatureSelected } = useDashboard();
  const { theme } = useTheme();
  const isSpecialTheme =
    theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions] = useState([
    "How can i be more focused?",
    "I feel overwhelmed by work, what do I do?",
    "Give me motivation to do my workout",
    "What is a dopamine detox?",
  ]);
  const [initialSetupComplete, setInitialSetupComplete] = useState(false);

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

        let response;
        const lowerCaseMessage = userMessageText.toLowerCase();

        // Intercept dashboard summary requests
        if (
          lowerCaseMessage.includes("dashboard") &&
          lowerCaseMessage.includes("summary")
        ) {
          response = await fetch("/api/claude/buddy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: null }),
          });
        } else {
          // Standard chat request
          response = await fetch("/api/claude", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMessageText,
              conversationHistory,
            }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || `API Error: ${response.status}`
          );
        }

        const data = await response.json();
        const responseText = data.speech || data.response;
        const missingData = data.missingData;

        const aiMessage: Message = {
          id: generateMessageId(),
          sender: "assistant",
          text: responseText,
          timestamp: new Date(),
          missingData
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
        toast.error(errorText);
      } finally {
        setIsLoading(false);
        apiCallInProgressRef.current = false;
      }
    },
    [conversationId, debouncedSaveChat]
  );

  useEffect(() => {
    if (isOpen && !initialSetupComplete) {
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

      setInitialSetupComplete(true);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setInitialSetupComplete(false);
    }
  }, [
    isOpen,
    initialQuery,
    initialMessages,
    fetchAndSetClaudeResponse,
    initialSetupComplete,
  ]);

  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

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
        const updatedMessages = [...currentMessages];
        fetchAndSetClaudeResponse(trimmedInput, updatedMessages);
        return updatedMessages;
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

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };

  const panelVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
    exit: {
      opacity: 0,
      y: -15,
      scale: 0.98,
      transition: { duration: 0.15, ease: [0.4, 0, 0.6, 1] as [number, number, number, number] },
    },
  };

  const messageVariants = {
    initial: { opacity: 0, y: 6 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    },
  };

  const SkeletonLoader = () => (
    <div className="flex flex-col gap-2 pl-2 w-full">
      <Skeleton className="h-3 rounded-md w-3/4" />
      <Skeleton className="h-3 rounded-md w-1/2" />
      <Skeleton className="h-3 rounded-md w-5/6" />
    </div>
  );

  const handleActionClick = (action: string) => {
    let featureKey = "";
    if (action === "sleep") featureKey = "Sleep";
    if (action === "mood") featureKey = "Mood";
    if (action === "journal") featureKey = "Journal";
    if (action === "tasks") featureKey = "Tasks";

    if (featureKey && isFeatureSelected(featureKey as any)) {
      setIsOpen(false);
      highlightFeature(featureKey as any);
    } else {
      toast.error(`Please add the ${action} widget to your dashboard first.`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 md:pt-32 px-4">
          {/* Overlay with higher z-index to cover sidebar and navbar */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Chat Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full max-w-xl flex flex-col rounded-xl overflow-hidden z-[101] transition-colors duration-300 ${isSpecialTheme
              ? "bg-zinc-900/90 border-zinc-800 backdrop-blur-xl"
              : "bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800"
              }`}
            style={{ maxHeight: 'calc(100vh - 180px)' }}
          >
            {/* Header with close button */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isSpecialTheme ? "border-zinc-800" : "border-gray-100 dark:border-zinc-800"
              }`}>
              <span className={`text-sm font-medium ${isSpecialTheme ? "text-white" : "text-gray-700 dark:text-gray-300"
                }`}>
                {messages.length > 0 ? `${messages.filter(m => !m.isTyping).length} messages` : 'New conversation'}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-md transition-colors ${isSpecialTheme
                  ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                  : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-grow overflow-y-auto px-4 py-3 min-h-[200px]"
            >
              {messages.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">Try one of these:</p>
                  <div className="flex flex-wrap justify-center gap-2">
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
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${isSpecialTheme
                          ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                          : "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300"
                          }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      variants={messageVariants}
                      initial="initial"
                      animate="animate"
                      layout
                      className="mb-4"
                    >
                      {msg.sender === "user" ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 pl-1">
                          You
                        </div>
                      ) : null}
                      <div className="flex flex-col items-start gap-2">
                        <div className="flex items-start gap-2 w-full">
                          <div
                            className={`grow rounded-lg p-3 ${msg.sender === "user"
                              ? isSpecialTheme
                                ? "text-sm text-white"
                                : "text-sm text-gray-700 dark:text-gray-300"
                              : isSpecialTheme
                                ? "bg-zinc-800/80 text-sm text-gray-200 border border-zinc-700/50"
                                : "bg-gray-50 dark:bg-zinc-800/50 text-sm text-gray-800 dark:text-gray-200"
                              }`}
                          >
                            <div className="text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-7" {...props} />,
                                  a: ({ node, ...props }) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1.5" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1.5" {...props} />,
                                  li: ({ node, ...props }) => <li className="pl-1 leading-7" {...props} />,
                                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100" {...props} />,
                                  h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-5 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
                                  h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-4 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
                                  hr: ({ node, ...props }) => <hr className="my-6 border-gray-200 dark:border-zinc-700" {...props} />,
                                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-4 py-2 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50/50 dark:bg-zinc-800/30 rounded-r-md" {...props} />,
                                  strong: ({ node, ...props }) => <span className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                                  code: ({ node, className, children, ...props }: any) => {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !match ? (
                                      <code className="bg-gray-100 dark:bg-zinc-700/50 px-1.5 py-0.5 rounded text-xs font-mono text-pink-500" {...props}>
                                        {children}
                                      </code>
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    )
                                  }
                                }}
                              >
                                {msg.text}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for Missing Data */}
                        {msg.sender === 'assistant' && msg.missingData && (
                          <div className="flex flex-wrap gap-2 pl-1 mt-1">
                            {msg.missingData.sleep && isFeatureSelected('Sleep') && (
                              <button
                                onClick={() => handleActionClick('sleep')}
                                className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 border border-indigo-500/20 text-xs rounded-full transition-colors"
                              >
                                Log Sleep
                              </button>
                            )}
                            {msg.missingData.mood && isFeatureSelected('Mood') && (
                              <button
                                onClick={() => handleActionClick('mood')}
                                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 text-xs rounded-full transition-colors"
                              >
                                Log Mood
                              </button>
                            )}
                            {msg.missingData.journal && isFeatureSelected('Journal') && (
                              <button
                                onClick={() => handleActionClick('journal')}
                                className="px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-xs rounded-full transition-colors"
                              >
                                Write Journal
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 text-right pr-2">
                        {formatTime(msg.timestamp)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}

              {isLoading && (
                <motion.div
                  key="loading-indicator"
                  variants={messageVariants}
                  initial="initial"
                  animate="animate"
                  layout
                  className="mb-4"
                >
                  <div className="grow rounded-lg p-3 bg-gray-50 dark:bg-zinc-800/50">
                    <SkeletonLoader />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input at the bottom - fixed position within panel */}
            <div className={`px-4 py-3 border-t ${isSpecialTheme ? "border-zinc-800 bg-transparent" : "border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
              }`}>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className={`flex-1 py-2 px-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${isSpecialTheme
                    ? "bg-zinc-800/50 text-white placeholder-zinc-500 border border-zinc-700/50"
                    : "bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                    }`}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading}
                  className={`p-2 rounded-lg flex items-center justify-center transition-colors ${inputText.trim() && !isLoading
                    ? "bg-primary hover:bg-primary/80 text-white"
                    : isSpecialTheme
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                    }`}
                  aria-label="Send message"
                >
                  <IconArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};


export default ChatPanel;