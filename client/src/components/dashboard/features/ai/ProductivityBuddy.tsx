"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductivityBuddy() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  
  // Control the color transition
  const [gradientColor, setGradientColor] = useState("blue");

  // Effect to handle the smooth color transition when loading changes
  useEffect(() => {
    if (loading) {
      // Smoothly transition to pink when loading
      setGradientColor("pink");
      
      // Set a timer to gradually return to blue when loading completes
      const timer = setTimeout(() => {
        if (!loading) {
          setGradientColor("blue");
        }
      }, 2000); // Delay to keep pink visible briefly after loading
      
      return () => clearTimeout(timer);
    } else {
      // When loading stops, gradually return to blue
      const timer = setTimeout(() => {
        setGradientColor("blue");
      }, 500); // Small delay before transitioning back
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

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
    setTimeout(() => {
      setLoading(false);
    }, 1000); // Ensure we see the color transition
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Aesthetic Modern Orb */}
      <motion.button
        onClick={fetchBuddyContext}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-16 h-16 focus:outline-none"
      >
        {/* Outer glow effect */}
        <motion.div 
          className="absolute inset-0 rounded-full blur-xl"
          animate={{ 
            boxShadow: gradientColor === "pink" 
              ? "0 0 25px 5px rgba(244, 114, 182, 0.6)" 
              : "0 0 25px 5px rgba(59, 130, 246, 0.6)"
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        
        {/* Main orb with smooth gradient transition */}
        <motion.div
          className="absolute inset-0 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
        >
          {/* Animated gradient background */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ 
              background: gradientColor === "pink"
                ? "radial-gradient(circle, rgba(244, 114, 182, 0.9) 0%, rgba(236, 72, 153, 0.7) 100%)"
                : "radial-gradient(circle, rgba(96, 165, 250, 0.9) 0%, rgba(59, 130, 246, 0.7) 100%)"
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          
          {/* Subtle rotating shimmer effect */}
          <motion.div
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0) 100%)"
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          />
        </motion.div>
        
        {/* Moving inner white gradient */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
        >
          <motion.div
            className="absolute w-full h-full"
            animate={{ 
              background: gradientColor === "pink"
                ? [
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(244,114,182,0) 50%)",
                    "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.8) 0%, rgba(244,114,182,0) 50%)",
                    "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.8) 0%, rgba(244,114,182,0) 50%)",
                    "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.8) 0%, rgba(244,114,182,0) 50%)",
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(244,114,182,0) 50%)"
                  ]
                : [
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0) 50%)",
                    "radial-gradient(circle at 70% 70%, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0) 50%)",
                    "radial-gradient(circle at 70% 30%, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0) 50%)",
                    "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0) 50%)",
                    "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(59,130,246,0) 50%)"
                  ]
            }}
            transition={{ duration: 8, times: [0, 0.25, 0.5, 0.75, 1], repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.button>

      {/* Response Panel */}
      <AnimatePresence>
        {response && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="mt-4 w-80 max-h-96 overflow-y-auto bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-blue-200/40 dark:border-blue-700/40 rounded-2xl shadow-xl p-4 text-zinc-800 dark:text-zinc-100"
          >
            {loading ? (
              <p className="text-pink-500 dark:text-pink-400">Loading...</p>
            ) : (
              response
                .split("\n")
                .filter((line) => line.trim())
                .map((line, i) => (
                  <p key={i} className="mb-3 leading-relaxed">
                    {line}
                  </p>
                ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}