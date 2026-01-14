"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { IconX, IconArrowRight } from "@tabler/icons-react";
import { useDashboard } from "@/context/DashboardContext";
import { toast } from "sonner";
import logo from "../../../../assets/brand/lumo-logo.svg";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
    sender: "assistant" | "user";
    text: string;
}

const CHECK_IN_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

const QUICK_SUGGESTIONS = [
    "Feeling unmotivated 😞",
    "Ready to work! 🚀",
    "Need a break 😴",
    "Just checking in 👋",
];

export default function ProactiveAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const { isFeatureSelected, addFeature, startDeepWork } = useDashboard();

    // Reset messages when opening
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Initial check logic moved here or kept in checkTrigger
        }
    }, [isOpen]);

    useEffect(() => {
        const checkTrigger = () => {
            const lastCheck = localStorage.getItem("flowivate_proactive_last_check");
            const now = Date.now();
            if (!lastCheck || (now - parseInt(lastCheck)) > CHECK_IN_INTERVAL) {
                const hour = new Date().getHours();
                let greeting = "How's your day going? content?";
                if (hour < 11) greeting = "Good morning! Ready for a quick recap of your work?";
                else if (hour > 17) greeting = "Wrapping up? Want a summary of your day?";
                else greeting = "Checking in! Need a quick recap of your progress?";

                setMessages([{ sender: "assistant", text: greeting }]);
                setIsOpen(true);
                localStorage.setItem("flowivate_proactive_last_check", now.toString());
            }
        };

        const timer = setTimeout(checkTrigger, 2000);
        return () => clearTimeout(timer);
    }, []);

    // ESC key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const handleSend = async (textOverride: string) => {
        const textToSend = textOverride;
        if (!textToSend) return;

        // If user asks for recap, send specific prompt
        const promptToSend = textToSend.includes("Get my recap")
            ? "Analyze my dashboard and give me a summary."
            : textToSend;

        const newMessage: Message = { sender: "user", text: textToSend };
        setMessages(prev => [...prev, newMessage]);
        setIsLoading(true);

        try {
            const contextInstruction = `(System Note: Keep response to 1 sentence max. If user is unmotivated or needs focus, offer Deep Work timer and end with <OFFER_DEEP_WORK>.)`;
            const conversationHistory = [...messages, { sender: "user", text: promptToSend }];

            const response = await fetch("/api/claude", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: `${promptToSend} ${contextInstruction}`,
                    conversationHistory
                }),
            });

            if (!response.ok) throw new Error("Failed to get response");

            const data = await response.json();
            let text = data.response || "";

            let hasAction = false;
            if (text.includes("<OFFER_DEEP_WORK>")) {
                text = text.replace("<OFFER_DEEP_WORK>", "").trim();
                hasAction = true;
            }

            setMessages(prev => [...prev, { sender: "assistant", text }]);
            setShowActions(hasAction);

        } catch (error) {
            console.error(error);
            toast.error("Lumo is momentarily offline.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartDeepWork = () => {
        if (!isFeatureSelected("DeepWork")) {
            addFeature("DeepWork");
        }
        startDeepWork(); // Trigger the task selection in DeepWork component
        setIsOpen(false);
    };

    const closePopup = () => {
        setIsOpen(false);
    };

    const panelVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
        },
        exit: {
            opacity: 0,
            y: 10,
            scale: 0.98,
            transition: { duration: 0.15, ease: [0.4, 0, 0.6, 1] as [number, number, number, number] },
        },
    };

    const QUICK_SUGGESTIONS = [
        "Get my recap 📊",
        "Feeling unmotivated 😞",
        "Ready to work! 🚀",
        "Need a break 😴",
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="fixed bottom-6 right-6 z-50 w-full max-w-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-7 h-7">
                                <Image src={logo} alt="Lumo" fill className="object-contain" />
                            </div>
                        </div>
                        <button
                            onClick={closePopup}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <IconX className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="px-5 pb-4 space-y-3 max-h-[250px] overflow-y-auto">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`text-sm leading-relaxed ${msg.sender === "user"
                                ? "text-right"
                                : "text-gray-700 dark:text-gray-300"
                                }`}>
                                {msg.sender === "user" ? (
                                    <span className="inline-block bg-primary text-white rounded-xl px-3 py-2">
                                        {msg.text}
                                    </span>
                                ) : (
                                    <div className="prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                a: ({ node, ...props }) => <a className="text-primary hover:underline cursor-pointer" {...props} />,
                                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                strong: ({ node, ...props }) => <span className="font-semibold text-gray-900 dark:text-gray-100" {...props} />,
                                            }}
                                        >
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="text-sm text-gray-400 animate-pulse">Thinking...</div>
                        )}
                    </div>

                    {/* Action Button */}
                    {showActions && (
                        <div className="px-5 pb-4">
                            <button
                                onClick={handleStartDeepWork}
                                className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                            >
                                Start Focus Session
                            </button>
                        </div>
                    )}

                    {/* Quick Suggestions - Always show if not loading and no actions pending to keep interaction simple */}
                    {!isLoading && !showActions && (
                        <div className="px-5 pb-5 pt-2 flex flex-wrap gap-2 justify-end">
                            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className={`px-3 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-zinc-600 ${suggestion.includes("recap") ? "bg-primary/5 text-primary dark:text-primary dark:bg-primary/10 border-primary/10" : ""
                                        }`}
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
