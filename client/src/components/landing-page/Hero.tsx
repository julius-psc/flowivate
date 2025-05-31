"use client";
import React from "react";
import Image from "next/image";
import Navbar from "./Navbar";
import landingGrad from "../../../public/assets/illustrations/landing-gradient.svg";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="flex h-screen items-center justify-center bg-background px-2 py-2">
      <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 relative">
        {/* Gradient background */}
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
          
          {/* Main content - centered vertically */}
          <div className="flex-1 flex flex-col items-center justify-center px-10 -mt-20">
            {/* Status badge */}
            <div className="mb-8 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/90 font-medium backdrop-blur-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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
                An intelligent workspace designed for deep work, seamless progress, and unparalleled productivity.
              </p>
            </div>
            
            {/* CTA buttons */}
            <div className="flex gap-4 mt-10">
              {/* Enhanced primary CTA */}
              <Link
                href="#get-started"
                className="relative px-8 py-4 rounded-full bg-primary-blue text-white font-semibold text-base hover:bg-primary-blue-hover transition-all duration-300 ease-out border border-primary-blue/30"
              >
                {/* Glow ring */}
                <span className="absolute inset-0 rounded-full ring-2 ring-primary-blue/20 animate-pulse pointer-events-none"></span>
                
                {/* Optional particles */}
                <span className="absolute -top-1 -left-1 w-2 h-2 bg-primary-blue/50 rounded-full blur-sm animate-ping"></span>
                <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary-blue/50 rounded-full blur-sm animate-ping delay-150"></span>

                {/* Button text */}
                <span className="relative z-10">Start crafting your flow</span>
              </Link>
              
              {/* Secondary CTA */}
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
