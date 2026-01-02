"use client";
import React from "react";
import Image from "next/image";
import landingGrad from "../../../public/assets/illustrations/landing-gradient.png";
import desktopPreview from "../../../public/assets/illustrations/desktop-preview.png";

export default function Hero() {
  return (
    <div className="w-full relative">
      {/* Background Container - Fixed Height with spacing */}
      <div className="absolute inset-x-4 top-4 h-[110vh] md:h-[120vh] z-0 rounded-xl overflow-hidden">
        <div className="relative w-full h-full">
          <Image
            src={landingGrad}
            alt="Flowivate Gradient Background"
            fill
            priority
            className="object-cover"
            quality={100}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-black/10" />
        </div>
      </div>

      {/* Content Container - Natural Flow */}
      <div className="relative z-10 w-full flex flex-col items-center justify-start pt-28 md:pt-40 px-4 pb-20">

        {/* Status Pill */}
        <div className="mb-3 md:mb-4 pl-2 pr-3 py-1 rounded-full bg-primary-black border border-white/10 flex items-center gap-2 backdrop-blur-sm shadow-xl">
          <div className="relative w-3 h-3 flex items-center justify-center">
            <div className="absolute w-full h-full bg-[#4ADE80] rounded-full opacity-20" />
            <div className="w-2 h-2 bg-[#4ADE80] rounded-full" />
          </div>
          <span className="text-xs font-medium text-white/90">v1.0 is out!</span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center tracking-tight mb-6 drop-shadow-sm whitespace-nowrap">
          Make flow your default.
        </h1>

        {/* Subheading */}
        <p className="text-sm md:text-base text-white/70 text-center max-w-4xl font-medium leading-relaxed whitespace-nowrap mb-16">
          Flowivate is a ruthless operating system designed for deep work, not busy work.
        </p>

        {/* Desktop Preview Image - Overflowing */}
        <div className="relative w-full max-w-6xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-2.5 shadow-2xl translate-y-8 md:translate-y-0">
          <div className="relative w-full rounded-2xl overflow-hidden bg-primary-black">
            <Image
              src={desktopPreview}
              alt="Flowivate Desktop Preview"
              className="w-full h-auto"
              quality={100}
              priority
              placeholder="blur"
            />
          </div>
        </div>

      </div>
    </div>
  );
}