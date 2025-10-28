"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { toast } from "sonner";
import { Lock, Loader2, X } from "lucide-react";
import { useGlobalStore } from "@/hooks/useGlobalStore";

interface BuddyResponse {
  speech: string;
  effect: "CONFETTI" | "SPARKLE" | null;
}

const FloatingParticles: React.FC = () => {
  const [particles, setParticles] = useState<
    {
      key: string;
      angle: number;
      distance: number;
      size: number;
      duration: number;
      delay: number;
    }[]
  >([]);

  useEffect(() => {
    const generateParticles = () =>
      Array.from({ length: 20 }, (_, i) => ({
        key: `${i}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        angle: Math.random() * 2 * Math.PI,
        distance: 30 + Math.random() * 30,
        size: 2 + Math.random() * 1.5,
        duration: 2.5 + Math.random() * 2,
        delay: Math.random() * 0.5,
      }));

    setParticles(generateParticles());
    const interval = setInterval(() => {
      setParticles(generateParticles());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {particles.map((p) => {
        const x = Math.cos(p.angle) * p.distance;
        const y = Math.sin(p.angle) * p.distance;

        return (
          <motion.div
            key={p.key}
            className="absolute rounded-full bg-blue-400 pointer-events-none"
            style={
              {
                width: `${p.size}px`,
                height: `${p.size}px`,
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%)`,
              } as React.CSSProperties
            }
            initial={{ x: 0, y: 0, opacity: 0.7, scale: 1 }}
            animate={{ x, y, opacity: 0, scale: 0.9 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: "easeOut",
            }}
          />
        );
      })}
    </AnimatePresence>
  );
};

const playSound = (type: "success" | "info") => {
  if (typeof window !== "undefined" && "AudioContext" in window) {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = type === "success" ? 800 : 600;
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.debug("Sound playback not available");
      console.log(err);
    }
  }
};

export default function ProductivityBuddy() {
  const { status: subscriptionStatus, loading: subLoading } =
    useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BuddyResponse | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [effectKey, setEffectKey] = useState(0);
  const [expression, setExpression] = useState("default");
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [retryCount, setRetryCount] = useState(0);
  const popupRef = useRef<HTMLDivElement>(null);

  const lumoEvent = useGlobalStore((state) => state.lumoEvent);
  const clearLumoEvent = useGlobalStore((state) => state.clearLumoEvent);

  const CACHE_DURATION = 60000;

  const fetchBuddyContext = useCallback(
    async (event: string | null, isRetry = false) => {
      if (!event) {
        const now = Date.now();
        if (now - lastFetchTime < CACHE_DURATION) {
          toast.info("Already up to date!");
          return;
        }
        setLastFetchTime(now);
      }

      setLoading(true);
      setIsActive(true);
      setResponse(null);

      try {
        const res = await fetch("/api/claude/buddy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ event }),
        });

        if (!res.ok) throw new Error("API request failed");

        const data: BuddyResponse = await res.json();

        if (data.speech === "SILENT_NO_OP") {
          setLoading(false);
          setIsActive(false);
          setExpression("default");
          setLastFetchTime(0);
          return;
        }

        if (event) {
          setExpression("celebrate");
        }

        setResponse(data);
        setRetryCount(0);

        if (data.effect === "CONFETTI" || data.effect === "SPARKLE") {
          setEffectKey((prev) => prev + 1);
          if (data.effect === "CONFETTI") {
            playSound("success");
          } else {
            playSound("info");
          }
        }
      } catch (err) {
        console.error(err);

        if (!isRetry && retryCount < 2) {
          setRetryCount((prev) => prev + 1);
          toast.info("Connection issue, retrying...");
          setTimeout(() => fetchBuddyContext(event, true), 1000);
          return;
        }

        setResponse({
          speech: "I'm having trouble connecting. Try again in a moment! 💫",
          effect: null,
        });
      }

      setTimeout(() => {
        setLoading(false);
        setIsActive(false);
        if (event) {
          setTimeout(() => setExpression("default"), 2000);
        }
      }, 1000);
    },
    [lastFetchTime, retryCount]
  );

  useEffect(() => {
    if (lumoEvent) {
      fetchBuddyContext(lumoEvent);
      clearLumoEvent();
    }
  }, [lumoEvent, clearLumoEvent, fetchBuddyContext]);

  const handleFreeUserClick = () => {
    toast.info("Pro feature - join to get productivity insights!");
  };

  const handleClick = () => {
    setExpression("default");
    fetchBuddyContext(null);
  };

  const handleClose = () => {
    setResponse(null);
    setLoading(false);
    setIsActive(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (subLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Loader2
          className="animate-spin text-gray-400 dark:text-gray-500"
          size={24}
        />
      </div>
    );
  }

  if (subscriptionStatus === "free") {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <div className="relative">
          <motion.button
            onClick={handleFreeUserClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 opacity-60"
            aria-label="Productivity Buddy (Pro feature)"
          >
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gray-500 dark:bg-gray-400 rounded-full flex items-center justify-center">
              <Lock size={12} className="text-white dark:text-gray-800" />
            </div>
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                className="text-gray-600 dark:text-gray-300"
              >
                <path
                  d="M8 9 Q9 7 10 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M14 9 Q15 7 16 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
                <path
                  d="M8 15 Q12 18 16 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 10, repeat: Infinity, ease: "linear" },
          }}
          style={
            {
              width: "4rem",
              height: "4rem",
              backgroundImage: isActive
                ? "conic-gradient(from 0deg, rgba(244,114,182,0.2), rgba(244,114,182,0.4), rgba(244,114,182,0.2))"
                : "conic-gradient(from 0deg, rgba(59,130,246,0.2), rgba(59,130,246,0.4), rgba(59,130,246,0.2))",
            } as React.CSSProperties
          }
        />

        <FloatingParticles key={effectKey} />

        <motion.div
          className={`absolute inset-0 w-20 h-20 -m-2 rounded-full blur-xl transition-all duration-1000 ${
            isActive ? "bg-pink-400/20" : "bg-blue-400/20"
          }`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <motion.button
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open productivity buddy"
          aria-expanded={!!(response || loading)}
          role="button"
          tabIndex={0}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-1000 ${
            isActive
              ? "bg-pink-400"
              : "bg-blue-500 dark:bg-blue-400"
          }`}
        >
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <motion.svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              className="text-white dark:text-zinc-100"
              animate={loading ? { rotate: [0, 5, -5, 0] } : {}}
              transition={loading ? { duration: 0.5, repeat: Infinity } : {}}
            >
              <motion.path
                d="M8 9 Q9 7 10 9"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={
                  loading
                    ? {
                        d: [
                          "M8 9 Q9 7 10 9",
                          "M8 9 Q9 9 10 9",
                          "M8 9 Q9 7 10 9",
                        ],
                      }
                    : expression === "celebrate"
                    ? { d: "M8 8.5 Q9 7 10 8.5" }
                    : { d: "M8 9 Q9 7 10 9" }
                }
                transition={
                  loading ? { duration: 1, repeat: Infinity } : { duration: 0.3 }
                }
              />
              <motion.path
                d="M14 9 Q15 7 16 9"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={
                  loading
                    ? {
                        d: [
                          "M14 9 Q15 7 16 9",
                          "M14 9 Q15 9 16 9",
                          "M14 9 Q15 7 16 9",
                        ],
                      }
                    : expression === "celebrate"
                    ? { d: "M14 8.5 Q15 7 16 8.5" }
                    : { d: "M14 9 Q15 7 16 9" }
                }
                transition={
                  loading ? { duration: 1, repeat: Infinity } : { duration: 0.3 }
                }
              />
              <motion.path
                d="M8 15 Q12 18 16 15"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={
                  loading
                    ? {
                        d: [
                          "M8 15 Q12 18 16 15",
                          "M8 16 Q12 19 16 16",
                          "M8 15 Q12 18 16 15",
                        ],
                      }
                    : expression === "celebrate"
                    ? { d: "M8 14 Q12 20 16 14" }
                    : { d: "M8 15 Q12 18 16 15" }
                }
                transition={
                  loading ? { duration: 1, repeat: Infinity } : { duration: 0.3 }
                }
              />
            </motion.svg>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {(response || loading) && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mt-4 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl backdrop-blur-sm relative"
            role="dialog"
            aria-live="polite"
          >
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors z-10"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="max-h-96 overflow-y-auto p-4 pr-10 mx-1 my-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
              {loading ? (
                <div className="space-y-3 py-4">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-full" />
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-5/6" />
                </div>
              ) : (
                <div className="text-zinc-800 dark:text-zinc-100">
                  {response && expression === "celebrate" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 mb-3 text-lg font-semibold"
                    >
                      🎉 <span>Great job!</span>
                    </motion.div>
                  )}

                  {response &&
                    response.speech
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line, i) => {
                        const isHeader = /^[^\w\s]/.test(line.trim());
                        return (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`mb-3 ${
                              isHeader
                                ? "font-semibold text-base"
                                : "text-sm leading-relaxed"
                            }`}
                          >
                            {line}
                          </motion.p>
                        );
                      })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}