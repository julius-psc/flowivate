"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Particle definition and loop engine
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
    }, 3000); // Reset every few seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
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
    </>
  );
};

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
    } catch (err) {
      console.error(err);
      setResponse("Something went wrong.");
    }
    setTimeout(() => {
      setLoading(false);
      setIsActive(false);
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
      <div className="relative">
        {/* Orb ripple ring */}
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

        {/* Blue Floating Particles */}
        <FloatingParticles />

        {/* Soft background glow */}
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

        {/* Orb button */}
        <motion.button
          onClick={fetchBuddyContext}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-1000 ${
            isActive
              ? "bg-gradient-to-br from-pink-400 to-rose-500"
              : "bg-gradient-to-br from-blue-500 to-white dark:from-blue-400 dark:to-zinc-800"
          }`}
          style={
            {
              boxShadow: isActive
                ? "0 0 25px rgba(244,114,182,0.6)"
                : "0 0 20px rgba(59,130,246,0.6)",
            } as React.CSSProperties
          }
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
                    : {}
                }
                transition={loading ? { duration: 1, repeat: Infinity } : {}}
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
                    : {}
                }
                transition={loading ? { duration: 1, repeat: Infinity } : {}}
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
                    : {}
                }
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
                          opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut",
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
                          transition={{ delay: i * 0.05 }}
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