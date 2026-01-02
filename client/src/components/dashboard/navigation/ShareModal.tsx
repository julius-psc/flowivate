"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Check } from "lucide-react";
import confetti from "canvas-confetti";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
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

      // Trigger confetti
      const duration = 1500;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 2000 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.4, 0.6), y: Math.random() - 0.2 },
        });
      }, 250);

      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!isOpen || !isClient) return null;

  const content = (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] transition-opacity duration-200"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-zinc-800/80 w-full max-w-md pointer-events-auto transform transition-all duration-200 scale-100 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative p-8">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-gray-800/40 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                  Share Flowivate
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Help others discover their productivity potential. Share this link with friends, colleagues, or anyone looking to level up their workflow.
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-5 py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                      copied
                        ? "bg-green-500 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={16} strokeWidth={2.5} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
};

export default ShareModal;
