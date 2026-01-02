"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Lock } from "lucide-react";

export default function EarlyAccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/early-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/onboarding");
    } else {
      const data = await res.json();
      setError(data.message || "Access denied.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-secondary-black px-4 text-secondary-white overflow-hidden">
      {/* Ambient animated background */}
      <motion.div
        className="absolute inset-0 z-0"
        style={
          {
            backgroundImage:
              "linear-gradient(135deg, #0075C4, #141618, #0075C4, #FCFDFF)",
            backgroundSize: "400% 400%",
            backgroundPosition: "0% 50%",
            opacity: 0.15,
          } as React.CSSProperties
        }
        animate={
          {
            backgroundPosition: "100% 50%",
          } as import("motion/react").Target
        }
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
      />

      {/* Form container */}
      <motion.div
        className="relative z-10 w-full max-w-md p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-lg flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 text-primary text-2xl font-semibold">
          <Lock size={20} /> Early Access
        </div>

        <p className="text-sm text-secondary-white/70 text-center leading-relaxed">
          This area is reserved for early testers. Enter the password provided
          to unlock your experience.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/50 border border-white/15 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            placeholder="Access password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="bg-primary text-white py-2 rounded-lg hover:bg-opacity-90 transition"
          >
            Unlock Access
          </button>
        </form>

        {error && (
          <motion.p
            className="text-sm text-red-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}