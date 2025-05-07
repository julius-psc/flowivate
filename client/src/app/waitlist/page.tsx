"use client";

import Image from "next/image";
import logo from "../../assets/brand/logo-v1.5.svg";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | "">("");

  // Use React.FormEvent for form elements
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!email) {
      setSubmitMessage("Please enter your email address.");
      setSubmitStatus("error");
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitStatus("");

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitMessage(data.message || "Successfully joined the waitlist!");
        setSubmitStatus("success");
        setEmail(""); // Reset email field on success
      } else {
        setSubmitMessage(data.message || "An error occurred. Please try again.");
        setSubmitStatus("error");
      }
    } catch (error) {
      console.error("Submission error:", error);
      setSubmitMessage("An unexpected error occurred. Please try again later.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-secondary-black px-4 py-12 text-secondary-white">
      {/* Enhanced moving gradient background */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ backgroundPosition: "0% 50%" }}
        animate={{ backgroundPosition: "100% 50%" }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        }}
        style={{
          backgroundImage: "linear-gradient(135deg, #0075C4, #141618, #0075C4, #FCFDFF)",
          backgroundSize: "400% 400%",
          opacity: 0.15,
        }}
      />
      
      {/* Subtle animated accent circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-primary/10 blur-3xl"
          initial={{ x: "-10%", y: "30%" }}
          animate={{ x: "5%", y: "35%" }}
          transition={{ duration: 15, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute w-96 h-96 rounded-full bg-primary/5 blur-3xl"
          initial={{ x: "80%", y: "60%" }}
          animate={{ x: "70%", y: "65%" }}
          transition={{ duration: 18, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-xl">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Image className="w-28 h-auto" alt="Flowivate's logo" src={logo} />
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Flowivate
          </motion.h1>
        </div>

        <motion.p 
          className="text-lg font-light text-secondary-white/90 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Be the first to experience Flowivate — your all-in-one AI productivity dashboard 
          built to help you focus, track, and thrive.
        </motion.p>

        <motion.form 
          onSubmit={handleSubmit}
          className="flex w-full max-w-md items-center gap-3 mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 backdrop-blur-lg shadow-lg"
          />
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center h-12 w-12 rounded-xl bg-white/5 border border-white/15 text-white transition-all hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Join Waitlist"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <ArrowRight size={18} />
            )}
          </button>
        </motion.form>

        {submitMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`mt-3 text-sm font-medium ${
              submitStatus === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {submitMessage}
          </motion.p>
        )}

        <motion.div
          className="flex flex-col items-center gap-6 mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <p className="text-sm font-medium text-white/50">
            Launching 03.06.2025
          </p>
          
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
            </div>
            <p className="text-sm text-secondary-white/80">50+ already onboard</p>
          </div>
        </motion.div>
        
        <div className="flex items-center gap-6 mt-8">
          <a target="_blank" rel="noopener noreferrer" href="https://instagram.com/flowivate" className="text-white/70 hover:text-white transition-colors text-sm font-medium" aria-label="Instagram">
            Instagram
          </a>
          <a target="_blank" rel="noopener noreferrer" href="https://x.com/flowivate" className="text-white/70 hover:text-white transition-colors text-sm font-medium" aria-label="X">
            X
          </a>
        </div>
      </div>
    </div>
  );
}
