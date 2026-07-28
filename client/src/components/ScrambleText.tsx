"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_+-=[]{}|;:,.<>?";

function randomChar() {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)];
}

interface ScrambleTextProps {
  text: string;
  revealDelayMs?: number;
  flipDelayMs?: number;
  charsPerTick?: number;
  className?: string;
}

export function ScrambleText({
  text,
  revealDelayMs = 18,
  flipDelayMs = 30,
  charsPerTick = 3,
  className,
}: ScrambleTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const revealedCount = useRef(0);

  const [displayed, setDisplayed] = useState<string[]>(text.split(""));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDisplayed(text.split("").map((c) => (c === " " ? " " : randomChar())));
  }, [text]);

  useEffect(() => {
    if (!inView || !mounted) return;

    revealedCount.current = 0;

    const flipInterval = setInterval(() => {
      setDisplayed((prev) =>
        prev.map((_, i) => {
          if (i < revealedCount.current) return text[i];
          if (text[i] === " ") return " ";
          return randomChar();
        })
      );
    }, flipDelayMs);

    const revealInterval = setInterval(() => {
      revealedCount.current = Math.min(revealedCount.current + charsPerTick, text.length);
      if (revealedCount.current >= text.length) {
        clearInterval(revealInterval);
        clearInterval(flipInterval);
        setDisplayed(text.split(""));
      }
    }, revealDelayMs);

    return () => {
      clearInterval(flipInterval);
      clearInterval(revealInterval);
    };
  }, [inView, mounted, text, revealDelayMs, flipDelayMs, charsPerTick]);

  return (
    <motion.span
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 6 }}
      animate={mounted ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {displayed.join("")}
    </motion.span>
  );
}
