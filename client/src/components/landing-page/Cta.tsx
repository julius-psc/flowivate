"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import landingGrad from "../../../public/assets/illustrations/landing-gradient.png";

export default function CTA() {
  return (
    <section className="flex w-full px-4 py-10 bg-[#121212] justify-center">
      <div className="w-full h-[350px] relative rounded-2xl overflow-hidden shadow-2xl">

        {/* Gradient Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={landingGrad}
            alt="Background Gradient"
            fill
            className="object-cover opacity-90"
            priority
          />
          {/* Overlay for readability */}
          <div className="absolute inset-0 bg-black/5" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full h-full flex flex-col justify-between items-center py-14 px-4">
          <h2 className="text-4xl md:text-6xl font-semibold text-white tracking-tight leading-[0.9] text-center">
            <span className="block text-white/90">Focus.</span>
            <span className="block">Execute. Flow.</span>
          </h2>

          <div className="flex flex-col items-center gap-3 mb-2">
            <Link
              href="/register"
              className="bg-white text-primary-black hover:bg-gray-100 transition-colors px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
            >
              Start Your 14-Day Free Trial Today
            </Link>
            <span className="text-white/80 text-xs font-medium">
              Cancel anytime, no questions asked
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
