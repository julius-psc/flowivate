"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { toast } from "sonner";
import { Lock, X } from "lucide-react";
import { useGlobalStore } from "@/hooks/useGlobalStore";

interface BuddyResponse {
  speech: string;
  effect: "CONFETTI" | "SPARKLE" | null;
}

const Sparkles: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const sparklePositions = [
    { top: "-4px", left: "50%", delay: 0 },
    { top: "10%", right: "-2px", delay: 0.4 },
    { bottom: "10%", right: "0px", delay: 0.8 },
    { bottom: "-4px", left: "50%", delay: 1.2 },
    { bottom: "10%", left: "0px", delay: 0.6 },
    { top: "10%", left: "-2px", delay: 1.0 },
  ];

  return (
    <>
      {sparklePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            ...pos,
            backgroundColor: isActive ? "#FF8DA1" : "#3A6EC8",
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: pos.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
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
      gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        audioContext.currentTime + 0.3
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (err) {
      console.debug("Sound playback not available", err);
    }
  }
};

const LumoLogo = ({ isActive, isLoading }: { isActive: boolean; isLoading: boolean }) => {
  const blueStart = "#3A6EC8";
  const blueEnd = "#6DA1C4";

  const pinkStart = "#FF8DA1";
  const pinkEnd = "#FFB3C1";

  const startColor = isActive ? pinkStart : blueStart;
  const endColor = isActive ? pinkEnd : blueEnd;

  return (
    <motion.svg
      width="100%"
      height="100%"
      viewBox="0 0 638 638"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      animate={isLoading ? {
        opacity: [1, 0.6, 1],
      } : {
        opacity: 1
      }}
      transition={isLoading ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : {
        duration: 0.3
      }}
    >
      <defs>
        <linearGradient id="paint0_linear" x1="319.734" y1="103.245" x2="319.734" y2="182.159" gradientUnits="userSpaceOnUse">
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
        <linearGradient id="paint1_linear" x1="319.733" y1="125.547" x2="319.733" y2="231.247" gradientUnits="userSpaceOnUse">
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
        <linearGradient id="paint2_linear" x1="319.733" y1="408.24" x2="319.733" y2="513.94" gradientUnits="userSpaceOnUse">
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
        <linearGradient id="paint3_linear" x1="319.735" y1="154.417" x2="319.735" y2="485.052" gradientUnits="userSpaceOnUse">
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
        <linearGradient id="paint4_linear" x1="319.734" y1="457.315" x2="319.734" y2="536.23" gradientUnits="userSpaceOnUse">
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
      </defs>
      <motion.path d="M319.734 182.159C357.298 182.159 387.894 151.805 388.318 114.344C366.768 107.153 343.708 103.245 319.734 103.245C295.76 103.245 272.7 107.147 251.149 114.344C251.574 151.811 282.17 182.159 319.734 182.159Z" fill="url(#paint0_linear)" />
      <motion.path d="M319.733 210.096C270.561 210.096 229.889 173.138 223.964 125.547C217.208 128.885 210.653 132.563 204.321 136.562C215.051 190.478 262.715 231.247 319.733 231.247C376.752 231.247 424.422 190.478 435.146 136.562C428.814 132.563 422.253 128.885 415.503 125.547C409.578 173.138 368.906 210.096 319.733 210.096Z" fill="url(#paint1_linear)" />
      <motion.path d="M319.733 429.385C368.906 429.385 409.578 466.343 415.503 513.94C422.259 510.601 428.814 506.924 435.146 502.925C424.416 449.009 376.752 408.24 319.733 408.24C262.715 408.24 215.045 449.009 204.321 502.925C210.653 506.924 217.214 510.601 223.964 513.94C229.889 466.343 270.561 429.385 319.733 429.385Z" fill="url(#paint2_linear)" />
      <motion.path d="M441.327 344.09C450.324 339.322 459.012 334.057 467.355 328.307C489.796 345.114 509.287 365.653 524.913 388.985C532.25 367.241 536.224 343.957 536.224 319.734C536.224 295.518 532.244 272.228 524.913 250.483C509.287 273.815 489.796 294.354 467.355 311.161C450.215 324 431.324 334.596 411.167 342.672C382.866 354.002 352.034 360.303 319.735 360.303C287.436 360.303 256.603 354.002 228.303 342.672C241.85 335.887 256.239 330.561 271.283 326.896C286.878 330.434 303.079 332.367 319.735 332.367C336.39 332.367 352.591 330.434 368.186 326.896C394.699 320.873 419.418 310.077 441.327 295.378C470.336 275.918 494.443 249.702 511.402 219.008C498.369 194.259 480.684 172.344 459.509 154.417C441.799 214.876 385.847 259.165 319.735 259.165C253.622 259.165 197.67 214.876 179.96 154.417C158.785 172.338 141.1 194.252 128.068 219.008C145.026 249.702 169.133 275.918 198.143 295.378C189.145 300.146 180.457 305.411 172.114 311.161C149.673 294.354 130.182 273.815 114.557 250.483C107.22 272.228 103.245 295.512 103.245 319.734C103.245 343.951 107.226 367.241 114.557 388.985C130.182 365.653 149.673 345.114 172.114 328.307C189.254 315.469 208.139 304.872 228.303 296.796C256.603 285.466 287.436 279.165 319.735 279.165C352.034 279.165 382.866 285.466 411.167 296.796C397.619 303.582 383.23 308.907 368.186 312.573C352.591 309.035 336.39 307.102 319.735 307.102C303.079 307.102 286.878 309.035 271.283 312.573C244.77 318.589 220.051 329.392 198.143 344.09C169.133 363.551 145.026 389.767 128.068 420.46C141.1 445.21 158.785 467.124 179.96 485.052C197.67 424.592 253.622 380.303 319.735 380.303C385.847 380.303 441.799 424.592 459.509 485.052C480.684 467.13 498.369 445.21 511.402 420.46C494.443 389.773 470.336 363.557 441.327 344.09Z" fill="url(#paint3_linear)" />
      <motion.path d="M319.734 457.315C282.17 457.315 251.574 487.663 251.149 525.13C272.706 532.322 295.76 536.23 319.734 536.23C343.708 536.23 366.768 532.322 388.318 525.13C387.894 487.669 357.298 457.315 319.734 457.315Z" fill="url(#paint4_linear)" />
    </motion.svg>
  );
};

export default function ProductivityBuddy() {
  const { status: subscriptionStatus, loading: subLoading } = useSubscriptionStatus();
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<BuddyResponse | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [effectKey, setEffectKey] = useState(0);
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
          toast.info("I'm already up to date! 🚀");
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
          setLastFetchTime(0);
          return;
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
          setTimeout(() => fetchBuddyContext(event, true), 1000);
          return;
        }

        setResponse({
          speech: "I'm having a bit of trouble connecting right now. Let's try again in a moment! 🌟",
          effect: null,
        });
      }

      setLoading(false);
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
    toast.info("Upgrade to Pro to unlock your personal productivity assistant!");
  };

  const handleClick = () => {
    if (isActive && response) {
      handleClose();
    } else {
      fetchBuddyContext(null);
    }
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
    return null;
  }

  if (subscriptionStatus === "free") {
    return (
      <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end">
        <motion.button
          onClick={handleFreeUserClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 rounded-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 opacity-80 hover:opacity-100 transition-opacity"
          aria-label="Productivity Buddy (Pro feature)"
        >
          <Lock size={20} className="text-zinc-400 dark:text-zinc-500" />
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end pointer-events-none">
      <div className="pointer-events-auto relative">
        <AnimatePresence>
          {(response || loading) && (
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="absolute bottom-20 right-0 w-80 mb-2 origin-bottom-right"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 flex justify-between items-center">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">Lumo</span>
                  <button
                    onClick={handleClose}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1 -mr-1"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center gap-1.5 py-2">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1]"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1]"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                        className="w-1.5 h-1.5 rounded-full bg-[#FF8DA1]"
                      />
                    </div>
                  ) : (
                    <div className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {response?.speech.split("\n").map((line, i) => {
                        if (!line.trim()) return <div key={i} className="h-3" />;
                        const isHeader = line.startsWith("#") || (line.length < 40 && line.trim().endsWith(":"));
                        return (
                          <motion.p
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03, duration: 0.2 }}
                            className={`${isHeader ? "font-medium text-zinc-900 dark:text-zinc-100 mt-3 mb-1.5 first:mt-0" : "mb-2"}`}
                          >
                            {line.replace(/^#+\s*/, "")}
                          </motion.p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative">
          <Sparkles isActive={isActive} />

          <motion.button
            onClick={handleClick}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="relative w-16 h-16 rounded-full flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
          >
            <div className="w-10 h-10">
              <LumoLogo isActive={isActive} isLoading={loading} />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}