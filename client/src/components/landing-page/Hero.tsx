"use client";
import React from "react";
import Image from "next/image";
import Navbar from "./Navbar";
import landingGrad from "../../../public/assets/illustrations/landing-gradient.png";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="w-screen h-screen p-1 pr-3 box-border overflow-hidden">
      <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 relative">
        {/* Background Image */}
        <Image
          src={landingGrad}
          alt="Gradient Background"
          fill
          className="absolute inset-0 object-cover opacity-80 pointer-events-none"
        />
        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Navbar */}
          <div className="p-10 pb-0">
            <Navbar />
          </div>
          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-10">
            {/* Badge */}
            <div className="mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/90 font-medium backdrop-blur-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              30+ users onboard
            </div>
            {/* Headings */}
            <div className="flex flex-col gap-6 text-center max-w-4xl">
              <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight tracking-tight">
                Supercharge your focus.
                <br />
                <span className="text-white/90">Personalize your flow.</span>
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                An intelligent workspace designed for deep work, seamless
                progress, and unparalleled productivity.
              </p>
            </div>
            {/* CTA */}
            <div className="flex gap-4 mt-10 relative">
              <Link
                href="#get-started"
                className="relative px-8 py-4 rounded-full bg-primary-blue text-white font-semibold text-base hover:bg-primary-blue-hover transition-all duration-300 ease-out border border-primary-blue/30 overflow-hidden"
              >
                <span className="absolute inset-0 rounded-full ring-2 ring-primary-blue/20 animate-pulse pointer-events-none" />
                <span className="absolute top-0 left-0 w-2 h-2 bg-primary-blue/50 rounded-full blur-sm animate-ping" />
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-primary-blue/50 rounded-full blur-sm animate-ping delay-150" />
                <span className="relative z-10">Start crafting your flow</span>
              </Link>
              <Link
                href="#learn-more"
                className="flex items-center gap-2 px-6 py-4 rounded-full border border-white/20 text-white/80 font-medium text-base hover:bg-white/5 hover:text-white hover:border-white/30 transition-all duration-300"
              >
                Learn more <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}