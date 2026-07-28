"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check, ArrowUpRight } from "lucide-react";
import confetti from "canvas-confetti";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { motion, AnimatePresence } from "motion/react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { theme } = useTheme();
  const shareUrl = "https://flowivate.com";

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      confetti({
        spread: 60,
        ticks: 100,
        gravity: 0.8,
        decay: 0.94,
        startVelocity: 30,
        colors: ["#3b82f6", "#60a5fa", "#93c5fd", "#ffffff"],
        particleCount: 50,
        origin: { y: 0.6 },
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      await handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: "Flowivate",
        text: "A focused productivity dashboard for tasks, focus sessions, journaling, and deep work.",
        url: shareUrl,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Failed to share:", err);
    }
  };

  if (!isOpen || !isClient) return null;

  const isSpecialTheme =
    isClient &&
    !!theme &&
    specialSceneThemeNames.includes(theme as (typeof specialSceneThemeNames)[number]);

  const isDark = isSpecialTheme || theme === "dark";

  const content = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[3px] z-[999]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className={`relative w-full max-w-[400px] pointer-events-auto rounded-2xl overflow-hidden ${
            isSpecialTheme
              ? "bg-zinc-950 border border-white/[0.07] shadow-[0_24px_64px_rgba(0,0,0,0.7)]"
              : "bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-[0_24px_64px_rgba(0,0,0,0.07)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.55)]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className={`absolute top-[14px] right-[14px] w-[28px] h-[28px] rounded-[7px] flex items-center justify-center transition-colors duration-100 ${
              isDark
                ? "text-white/25 hover:text-white/60 hover:bg-white/[0.06]"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Close"
          >
            <X size={14} strokeWidth={2} />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="mb-5 pr-8">
              <h2
                className={`text-[15px] font-semibold tracking-[-0.01em] mb-1.5 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Share Flowivate
              </h2>
              <p
                className={`text-[13px] leading-[1.5] ${
                  isDark ? "text-white/40" : "text-gray-500"
                }`}
              >
                Help someone find their focus. A cleaner path into deep work.
              </p>
            </div>

            {/* URL row */}
            <div
              className={`flex items-stretch rounded-[10px] border overflow-hidden ${
                isDark
                  ? "border-white/[0.08] bg-white/[0.03]"
                  : "border-gray-200 bg-gray-50/70"
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 px-3.5 py-2.5 min-w-0">
                <div
                  className={`w-[6px] h-[6px] rounded-full shrink-0 ${
                    isDark ? "bg-white/20" : "bg-gray-300"
                  }`}
                />
                <span
                  className={`text-[12px] font-mono truncate ${
                    isDark ? "text-white/45" : "text-gray-500"
                  }`}
                >
                  flowivate.com
                </span>
              </div>

              <button
                onClick={handleCopy}
                className={`shrink-0 flex items-center gap-1.5 px-3.5 text-[12px] font-medium transition-all duration-150 border-l ${
                  isDark
                    ? "border-white/[0.07] hover:bg-white/[0.06]"
                    : "border-gray-200 hover:bg-gray-100"
                } ${
                  copied
                    ? "text-emerald-500"
                    : isDark
                      ? "text-white/40 hover:text-white/80"
                      : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="check"
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.75 }}
                      transition={{ duration: 0.1 }}
                      className="flex items-center gap-1.5 text-emerald-500"
                    >
                      <Check size={12} strokeWidth={2.5} />
                      Copied
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.75 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.75 }}
                      transition={{ duration: 0.1 }}
                      className="flex items-center gap-1.5"
                    >
                      <Copy size={12} strokeWidth={2} />
                      Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>

            {/* Divider + actions */}
            <div
              className={`mt-5 pt-4 border-t flex items-center justify-between ${
                isDark ? "border-white/[0.06]" : "border-gray-100"
              }`}
            >
              <button
                onClick={handleNativeShare}
                className={`flex items-center gap-1.5 px-3 py-[7px] rounded-[8px] text-[13px] font-medium transition-colors duration-100 ${
                  isDark
                    ? "text-white/50 hover:text-white hover:bg-white/[0.06]"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <ArrowUpRight size={13} strokeWidth={2} />
                Share via…
              </button>

              <button
                onClick={onClose}
                className={`px-3 py-[7px] rounded-[8px] text-[13px] font-medium transition-colors duration-100 ${
                  isDark
                    ? "text-white/30 hover:text-white hover:bg-white/[0.06]"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default ShareModal;
