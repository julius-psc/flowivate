import React from "react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/assets/brand/logo-v1.5.svg";
import xLogo from "@/assets/icons/x-logo.svg";
import instagramLogo from "@/assets/icons/instagram-logo.svg";
import githubLogo from "@/assets/icons/github-logo.svg";

export default function Footer() {
  return (
    <footer className="w-full bg-[#121212] pt-10 md:pt-16 pb-8 px-4 flex justify-center relative z-20">
      <div className="w-full max-w-6xl">

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-16 lg:gap-12 mb-16">

          {/* Brand Column */}
          <div className="flex flex-col gap-4 max-w-xs items-center md:items-start text-center md:text-left mx-auto md:mx-0">
            <div className="flex items-center">
              <Image src={logo} alt="Flowivate Logo" className="w-12 h-12" />
              <span className="text-lg font-medium text-white">Flowivate</span>
            </div>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Flowivate empowers you to transform chaos into clear, focused workflows — making deep work easier to achieve and sustain.
            </p>
            <div className="flex items-center gap-5 mt-1">
              <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <Image src={xLogo} alt="X" width={18} height={18} className="w-[18px] h-[18px] invert" />
              </Link>
              <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <Image src={instagramLogo} alt="Instagram" width={18} height={18} className="w-[18px] h-[18px] invert" />
              </Link>
              <Link href="#" className="opacity-70 hover:opacity-100 transition-opacity">
                <Image src={githubLogo} alt="GitHub" width={18} height={18} className="w-[18px] h-[18px] invert" />
              </Link>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-10 mt-2">
            <div className="flex flex-col gap-4">
              <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Core</h4>
              <div className="flex flex-col gap-3">
                <Link href="/#about" className="text-zinc-300 hover:text-white transition-colors text-sm">Product</Link>
                <Link href="/#pricing" className="text-zinc-300 hover:text-white transition-colors text-sm">Pricing</Link>
                <Link href="/updates" className="text-zinc-300 hover:text-white transition-colors text-sm">Updates</Link>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Resources</h4>
              <div className="flex flex-col gap-3">
                <Link href="/about" className="text-zinc-300 hover:text-white transition-colors text-sm">About</Link>
                <Link href="/contact" className="text-zinc-300 hover:text-white transition-colors text-sm">Contact</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-zinc-800 mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>&copy; 2026 Flowivate. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="hover:text-zinc-300 transition-colors">Cookies</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
