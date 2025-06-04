"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import logo from "../../assets/brand/logo-v1.5-white.svg";
import landingGrad from "../../../public/assets/illustrations/landing-gradient.png";

export default function Footer() {
  return (
    <footer className="bg-secondary-black px-2 py-2">
      <div className="w-full rounded-3xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5 relative">
        {/* Gradient background */}
        <Image
          src={landingGrad}
          alt="Footer Gradient Background"
          fill
          className="absolute inset-0 object-cover opacity-80 pointer-events-none"
        />

        {/* Content */}
        <div className="relative z-10 px-10 py-12">
          {/* Main content */}
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Image
                src={logo}
                alt="Flowivate Logo"
                width={40}
                height={40}
              />
            </div>

            {/* Social links */}
            <div className="flex gap-6">
              <Link
                href="https://instagram.com/flowivate"
                className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
              >
                Instagram
              </Link>
              <Link
                href="https://x.com/flowivate"
                className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
              >
                X
              </Link>
            </div>

            {/* Legal links */}
            <div className="flex gap-6">
              <Link
                href="#"
                className="text-white/50 hover:text-white/70 text-sm transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-white/50 hover:text-white/70 text-sm transition-colors duration-300"
              >
                Cookie Policy
              </Link>
              <Link
                href="#"
                className="text-white/50 hover:text-white/70 text-sm transition-colors duration-300"
              >
                Terms of Service
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-white/50 text-sm">
              © 2025 Flowivate. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
