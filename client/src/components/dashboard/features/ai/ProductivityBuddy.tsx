"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductivityBuddy() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const fetchBuddyContext = async () => {
    setLoading(true);
    setIsActive(true);
    setResponse(null);
    try {
      const res = await fetch("/api/claude/buddy", { method: "POST" });
      const data = await res.json();
      setResponse(data.reply);
      // Transition back to blue when response appears
      setIsActive(false);
    } catch (err) {
      console.error(err);
      setResponse("Something went wrong.");
      setIsActive(false);
    }
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setResponse(null);
        setLoading(false);
        setIsActive(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Animated Orb Container */}
      <div className="relative">
        {/* Gentle Wave Effect */}
        <motion.div
          className="absolute inset-0 w-16 h-16 rounded-full"
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8, repeat: Infinity, ease: "linear" }
          }}
          style={{
            background: isActive 
              ? 'conic-gradient(from 0deg, rgba(244,114,182,0.1), rgba(244,114,182,0.3), rgba(244,114,182,0.1))'
              : 'conic-gradient(from 0deg, rgba(59,130,246,0.1), rgba(59,130,246,0.3), rgba(59,130,246,0.1))'
          }}
        />

        {/* Soft Background Glow */}
        <motion.div
          className={`absolute inset-0 w-20 h-20 -m-2 rounded-full blur-lg transition-all duration-1000 ${
            isActive ? 'bg-pink-400/20' : 'bg-blue-400/20'
          }`}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Main Button */}
        <motion.button
          onClick={fetchBuddyContext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-1000 ${
            isActive 
              ? 'bg-gradient-to-br from-pink-400 to-rose-500'
              : 'bg-gradient-to-br from-blue-500 to-white dark:from-blue-400 dark:to-zinc-800'
          }`}
          style={{
            boxShadow: isActive 
              ? '0 0 25px rgba(244,114,182,0.6)'
              : '0 0 20px rgba(59,130,246,0.6)'
          }}
        >
          
          {/* Smiley Face */}
          <div className="relative z-10 w-full h-full flex items-center justify-center">
            <motion.svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              className="text-white dark:text-zinc-100"
              animate={loading ? { rotate: [0, 5, -5, 0] } : {}}
              transition={loading ? { duration: 0.5, repeat: Infinity } : {}}
            >
              {/* Left Eye - Parabola */}
              <motion.path
                d="M8 9 Q9 7 10 9"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={loading ? { d: ["M8 9 Q9 7 10 9", "M8 9 Q9 9 10 9", "M8 9 Q9 7 10 9"] } : {}}
                transition={loading ? { duration: 1, repeat: Infinity } : {}}
              />
              {/* Right Eye - Parabola */}
              <motion.path
                d="M14 9 Q15 7 16 9"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={loading ? { d: ["M14 9 Q15 7 16 9", "M14 9 Q15 9 16 9", "M14 9 Q15 7 16 9"] } : {}}
                transition={loading ? { duration: 1, repeat: Infinity } : {}}
              />
              {/* Smile - Inverted Parabola */}
              <motion.path
                d="M8 15 Q12 18 16 15"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                animate={loading ? { 
                  d: ["M8 15 Q12 18 16 15", "M8 16 Q12 19 16 16", "M8 15 Q12 18 16 15"] 
                } : {}}
                transition={loading ? { duration: 1, repeat: Infinity } : {}}
              />
            </motion.svg>
          </div>
        </motion.button>
      </div>

      {/* Response Popup */}
      <AnimatePresence>
        {(response || loading) && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mt-4 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-lg backdrop-blur-sm"
          >
            <div className="max-h-96 overflow-y-auto p-4 mx-1 my-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent scrollbar-thumb-opacity-50">
              {loading ? (
                <motion.div className="flex items-center justify-center py-8">
                  <div className="flex space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-3 h-3 rounded-full bg-pink-400"
                        animate={{
                          y: [0, -12, 0],
                          opacity: [0.4, 1, 0.4]
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
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