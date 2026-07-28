"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Dithering } from "@paper-design/shaders-react";
import Image from "next/image";
import logoBlue from "@/assets/brand/logo-v1.5.svg";
import { IconArrowNarrowRight, IconLoader, IconCircleDashedCheck, IconCircleDashedX } from "@tabler/icons-react";

type Toast = { type: "success" | "duplicate" | "error"; message: string } | null;

export default function WaitlistPage() {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [position, setPosition] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    setIsLight(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLight(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const showToast = (next: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(next);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async () => {
    if (submitState !== "idle" && submitState !== "error") return;
    if (!inputRef.current?.reportValidity()) return;
    setSubmitState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => {
        throw new Error(`Server error (${res.status})`);
      });

      if (res.status === 409) {
        setSubmitState("error");
        setTimeout(() => setSubmitState("idle"), 2000);
        showToast({ type: "duplicate", message: "You're already on the list — we'll be in touch." });
        return;
      }

      if (!res.ok) throw new Error(data.message);

      setPosition(data.position);
      setSubmitState("success");
      showToast({ type: "success", message: "Thanks, releasing Q4 2026." });
    } catch (err) {
      console.error("Waitlist submit error:", err);
      setSubmitState("error");
      setTimeout(() => setSubmitState("idle"), 2000);
      showToast({ type: "error", message: "Something went wrong — please try again." });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setExpanded(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute inset-0">
        <Dithering
          width="100%"
          height="100%"
          colorBack={isLight ? "#F0EEE9" : "#020914"}
          colorFront="#0075C4"
          shape="warp"
          type="4x4"
          size={2.5}
          speed={0.7}
          fit="cover"
        />
      </div>

      <div className={`absolute inset-0 ${isLight ? "bg-white/30" : "bg-black/50"}`} />

      <div className="relative z-10 flex flex-col items-center justify-center h-full gap-6 px-6 text-center">
        <p className={`text-base tracking-wide ${isLight ? "text-[#1E1E1E]" : "text-white"}`}>
          A native Mac agent that learns how you focus, one session at a time.
        </p>

        <div className="relative">
          <motion.div
            layout
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="flex items-center gap-3 rounded-2xl px-2 py-2 overflow-hidden relative z-10"
            style={{
              backgroundColor: isLight ? "#FFFFFF" : "#0A0A0B",
              border: isLight ? "0.5px solid #E0DEDB" : "0.5px solid #232326",
              boxShadow: "none",
            }}
          >
            <motion.div layout="position" transition={{ type: "spring", duration: 0.5, bounce: 0 }}>
              <Image
                src={logoBlue}
                alt="Flowivate"
                width={36}
                height={36}
                className="shrink-0 scale-[1.5]"
              />
            </motion.div>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ y: "calc(100% + 8px)" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "calc(100% + 8px)" }}
                  transition={{ type: "spring", duration: 0.7, bounce: 0, delay: 0.35 }}
                  className="flex items-center gap-2 rounded-lg pl-2 pr-1 py-1"
                  style={{ backgroundColor: isLight ? "#F5F4F1" : "#17171A", width: "17rem" }}
                >
                  <div className="relative flex items-center flex-1 min-w-0">
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                      className={`bg-transparent text-xs outline-none w-full py-0 leading-none ${isLight ? "text-[#1E1E1E]" : "text-white/80"}`}
                    />
                    {!email && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none text-xs select-none leading-none ${isLight ? "text-[#1E1E1E]/30" : "text-white/20"}`}>
                        Join the waitlist
                      </span>
                    )}
                  </div>

                  <motion.button
                    onClick={handleSubmit}
                    disabled={submitState !== "idle" && submitState !== "error"}
                    whileTap={submitState === "idle" ? { scale: 0.96 } : {}}
                    transition={{ scale: { type: "spring", duration: 0.15, bounce: 0 } }}
                    className="rounded-md shrink-0 flex items-center justify-center overflow-hidden disabled:pointer-events-none"
                    style={{
                      backgroundColor: submitState === "success"
                        ? isLight ? "#dcfce7" : "#14261a"
                        : submitState === "error"
                        ? isLight ? "#fee2e2" : "#2a1515"
                        : isLight ? "#E8E6E1" : "#232326",
                      padding: "6px",
                    }}
                  >
                    <motion.span
                      animate={{ width: submitState === "success" ? 36 : 0 }}
                      transition={submitState === "success"
                        ? { type: "spring", duration: 0.5, bounce: 0, delay: 0.3 }
                        : { type: "spring", duration: 0.3, bounce: 0 }
                      }
                      className="overflow-hidden flex items-center"
                      style={{ width: 0 }}
                    >
                      <motion.span
                        animate={{ y: submitState === "success" ? "0%" : "calc(100% + 6px)" }}
                        transition={submitState === "success"
                          ? { type: "spring", duration: 0.5, bounce: 0, delay: 0.6 }
                          : { type: "spring", duration: 0.3, bounce: 0 }
                        }
                        className={`text-xs whitespace-nowrap ${isLight ? "text-[#1E1E1E]/60" : "text-white/50"}`}
                        style={{ y: "calc(100% + 6px)" }}
                      >
                        {position !== null ? `#${String(position).padStart(2, "0")}` : ""}
                      </motion.span>
                    </motion.span>

                    <div className="relative w-4 h-4 shrink-0">
                      <AnimatePresence initial={false}>
                        {submitState === "idle" && (
                          <motion.span
                            key="arrow"
                            initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            exit={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <IconArrowNarrowRight size={16} className={isLight ? "text-[#1E1E1E]" : "text-white"} />
                          </motion.span>
                        )}
                        {submitState === "loading" && (
                          <motion.span
                            key="loader"
                            initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)", rotate: 360 }}
                            exit={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            transition={{
                              scale: { type: "spring", duration: 0.3, bounce: 0 },
                              opacity: { type: "spring", duration: 0.3, bounce: 0 },
                              filter: { type: "spring", duration: 0.3, bounce: 0 },
                              rotate: { repeat: Infinity, duration: 1, ease: "linear" },
                            }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <IconLoader size={16} className={isLight ? "text-[#1E1E1E]/50" : "text-white/60"} />
                          </motion.span>
                        )}
                        {submitState === "success" && (
                          <motion.span
                            key="check"
                            initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            exit={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <IconCircleDashedCheck size={16} style={{ color: isLight ? "#16a34a" : "#4ade80" }} />
                          </motion.span>
                        )}
                        {submitState === "error" && (
                          <motion.span
                            key="error"
                            initial={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                            exit={{ scale: 0.25, opacity: 0, filter: "blur(4px)" }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            className="absolute inset-0 flex items-center justify-center"
                          >
                            <IconCircleDashedX size={16} style={{ color: "#f87171" }} />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Toast slides down from behind the pill */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ y: "-100%" }}
                animate={{ y: "0%" }}
                exit={{ y: "-100%" }}
                transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                className="absolute top-full z-0 px-3 py-2 rounded-b-xl"
                style={{
                  backgroundColor: isLight ? "#FFFFFF" : "#0A0A0B",
                  left: "5%",
                  right: "5%",
                }}
              >
                <p
                  className="text-xs text-left whitespace-nowrap truncate"
                  style={{
                    color: toast.type === "error"
                      ? "#f87171"
                      : toast.type === "duplicate"
                      ? isLight ? "#1E1E1E99" : "#ffffff60"
                      : isLight ? "#16a34a" : "#4ade80",
                  }}
                >
                  {toast.message}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
