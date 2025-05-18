"use client";

import React, { useState } from "react";
import { IconSparkles, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

const ProductivityBuddy = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string>("");

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claude/buddy", { method: "POST" });
      const data = await res.json();
      setResponse(data.message || "No insights available.");
    } catch (err) {
      console.error("Failed to fetch insight", err);
      setResponse("Sorry, something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    setOpen((prev) => !prev);
    if (!open) fetchInsight();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 bg-primary text-white rounded-full p-3 shadow-lg hover:scale-105 transition-transform"
      >
        <IconSparkles className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-80 max-w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl shadow-xl p-4 text-sm text-gray-800 dark:text-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-semibold text-gray-900 dark:text-white">Your Productivity Buddy</span>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <IconX size={16} />
              </button>
            </div>
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-3/4" />
                <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-1/2" />
                <div className="h-3 bg-gray-300 dark:bg-zinc-700 rounded w-2/3" />
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{response}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductivityBuddy;