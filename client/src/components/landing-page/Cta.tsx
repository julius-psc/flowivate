"use client";

import React from "react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative w-full px-6 py-8 overflow-hidden backdrop-blur-lg mt-24">

      {/* Overlay */}
      <div className="relative z-10 flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
          Ready to level up your workflow?
        </h2>
        <p className="text-lg text-white/70 max-w-xl leading-relaxed">
          Start using Flowivate and design your personalized productivity experience —
          smarter habits, deeper focus, and actionable insights.
        </p>
        <div className="flex gap-4 mt-6">
          <Link
            href="#get-started"
            className="relative px-8 py-4 rounded-full bg-primary-blue text-white font-semibold text-base hover:bg-primary-blue-hover transition-all duration-300 ease-out border border-primary-blue/30 overflow-hidden"
          >
            <span className="relative z-10">Get Started Now</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
