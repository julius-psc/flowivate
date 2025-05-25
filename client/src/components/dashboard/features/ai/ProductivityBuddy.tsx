"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductivityBuddy() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  // Color transition effect
  const currentColor = loading ? "#ec4899" : "#3b82f6";

  const fetchBuddyContext = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("/api/claude/buddy", { method: "POST" });
      const data = await res.json();
      setResponse(data.reply);
    } catch (err) {
      console.error(err);
      setResponse("Something went wrong.");
    }

    setTimeout(() => setLoading(false), 1000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setResponse(null);
        setLoading(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      <motion.button
        onClick={fetchBuddyContext}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-16 h-16 focus:outline-none"
      >
        <div className="relative w-full h-full rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: currentColor } as React.CSSProperties}
            animate={{ opacity: [1, 0.9, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />

          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="wave1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.3)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id="wave2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
              <linearGradient id="wave3" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
                <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            <motion.path
              d="M8 32 Q16 20 24 32 T40 32 T56 32 Q48 44 40 32 T24 32 T8 32"
              fill="url(#wave1)"
              animate={{
                d: loading
                  ? [
                      "M8 32 Q16 20 24 32 T40 32 T56 32 Q48 44 40 32 T24 32 T8 32",
                      "M8 32 Q16 44 24 32 T40 32 T56 32 Q48 20 40 32 T24 32 T8 32",
                      "M8 32 Q16 20 24 32 T40 32 T56 32 Q48 44 40 32 T24 32 T8 32",
                    ]
                  : [
                      "M8 32 Q16 20 24 32 T40 32 T56 32 Q48 44 40 32 T24 32 T8 32",
                      "M8 32 Q16 40 24 32 T40 32 T56 32 Q48 24 40 32 T24 32 T8 32",
                      "M8 32 Q16 20 24 32 T40 32 T56 32 Q48 44 40 32 T24 32 T8 32",
                    ],
              }}
              transition={{ duration: loading ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
            />

            <motion.path
              d="M12 32 Q20 24 28 32 T44 32 T60 32 Q52 40 44 32 T28 32 T12 32"
              fill="url(#wave2)"
              animate={{
                d: loading
                  ? [
                      "M12 32 Q20 24 28 32 T44 32 T60 32 Q52 40 44 32 T28 32 T12 32",
                      "M12 32 Q20 40 28 32 T44 32 T60 32 Q52 24 44 32 T28 32 T12 32",
                      "M12 32 Q20 24 28 32 T44 32 T60 32 Q52 40 44 32 T28 32 T12 32",
                    ]
                  : [
                      "M12 32 Q20 24 28 32 T44 32 T60 32 Q52 40 44 32 T28 32 T12 32",
                      "M12 32 Q20 36 28 32 T44 32 T60 32 Q52 28 44 32 T28 32 T12 32",
                      "M12 32 Q20 24 28 32 T44 32 T60 32 Q52 40 44 32 T28 32 T12 32",
                    ],
              }}
              transition={{ duration: loading ? 2.5 : 5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
            />

            <motion.path
              d="M16 32 Q24 28 32 32 T48 32 Q40 36 32 32 T16 32"
              fill="url(#wave3)"
              animate={{
                d: loading
                  ? [
                      "M16 32 Q24 28 32 32 T48 32 Q40 36 32 32 T16 32",
                      "M16 32 Q24 36 32 32 T48 32 Q40 28 32 32 T16 32",
                      "M16 32 Q24 28 32 32 T48 32 Q40 36 32 32 T16 32",
                    ]
                  : [
                      "M16 32 Q24 28 32 32 T48 32 Q40 36 32 32 T16 32",
                      "M16 32 Q24 34 32 32 T48 32 Q40 30 32 32 T16 32",
                      "M16 32 Q24 28 32 32 T48 32 Q40 36 32 32 T16 32",
                    ],
              }}
              transition={{ duration: loading ? 3 : 6, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
            />

            <motion.circle
              cx="32"
              cy="32"
              r="8"
              fill="rgba(255,255,255,0.6)"
              animate={{
                r: loading ? [8, 12, 8] : [8, 10, 8],
                opacity: loading ? [0.6, 0.3, 0.6] : [0.6, 0.4, 0.6],
              }}
              transition={{ duration: loading ? 1.5 : 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>

          <div className="absolute inset-0">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-70"
                animate={{
                  x: [
                    32 + Math.cos((i * Math.PI * 2) / 8) * 18,
                    32 + Math.cos((i * Math.PI * 2) / 8 + Math.PI / 4) * 22,
                    32 + Math.cos((i * Math.PI * 2) / 8) * 18,
                  ],
                  y: [
                    32 + Math.sin((i * Math.PI * 2) / 8) * 18,
                    32 + Math.sin((i * Math.PI * 2) / 8 + Math.PI / 4) * 22,
                    32 + Math.sin((i * Math.PI * 2) / 8) * 18,
                  ],
                  scale: loading ? [1, 1.8, 1] : [1, 1.4, 1],
                  opacity: loading ? [0.7, 0.2, 0.7] : [0.7, 0.4, 0.7],
                }}
                transition={{
                  duration: loading ? 2 + i * 0.15 : 3.5 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      </motion.button>

      <AnimatePresence>
        {(response || loading) && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mt-4 w-80 max-h-96 overflow-y-auto"
          >
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4">
              {loading ? (
                <motion.div
                  className="flex items-center justify-center py-4"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <motion.div
                    className="w-6 h-6 rounded-full"
                    style={{ background: currentColor } as React.CSSProperties}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  />
                </motion.div>
              ) : (
                <div className="text-zinc-800 dark:text-zinc-100">
                  {response &&
                    response
                      .split("\n")
                      .filter((line) => line.trim())
                      .map((line, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="mb-3 leading-relaxed"
                        >
                          {line}
                        </motion.p>
                      ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}