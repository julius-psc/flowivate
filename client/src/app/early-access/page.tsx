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
    <div className="flex min-h-screen items-center justify-center bg-[#121212] px-4 text-white">
      {/* Form container */}
      <motion.div
        className="relative z-10 w-full max-w-md flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-2 text-white text-2xl font-semibold">
          <Lock size={20} className="text-[#666666]" /> Early Access
        </div>

        <p className="text-sm text-[#999999] text-center leading-relaxed">
          This area is reserved for early testers. Enter the password provided
          to unlock your experience.
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="password"
            className="w-full h-11 rounded-lg bg-[#1a1a1a] px-4 text-white placeholder:text-[#666666] border border-[#2a2a2a] focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Access password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            className="w-full h-11 bg-primary-blue hover:bg-primary-blue/90 text-white font-medium rounded-lg transition-all"
          >
            Unlock Access
          </button>
        </form>

        {error && (
          <motion.p
            className="text-sm text-red-500"
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