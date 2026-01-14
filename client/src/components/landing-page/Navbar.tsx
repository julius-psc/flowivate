"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fingerprint, Menu, X } from "lucide-react";
import logo from '@/assets/brand/logo-v1.5.svg';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <div className="fixed top-6 md:top-12 left-0 right-0 z-50 flex justify-center px-4">
        <nav className="relative flex items-center bg-primary-black pr-2 pl-1 rounded-full shadow-2xl backdrop-blur-md bg-opacity-95 border border-white/5">

          {/* Logo Section */}
          <div className="flex items-center pr-3">
            <Link href="/" className="flex items-center justify-center">
              <Image
                src={logo}
                alt="Flowivate Logo"
                width={56}
                height={56}
                className="w-12 h-12"
              />
            </Link>
          </div>

          {/* Desktop Links Section */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link href="/#about" className="hover:text-white transition-colors duration-200">
              Product
            </Link>
            <Link href="/#pricing" className="hover:text-white transition-colors duration-200">
              Pricing
            </Link>
            <Link href="/updates" className="hover:text-white transition-colors duration-200">
              Updates
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center mr-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 text-gray-300 hover:text-white transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Spacer for Desktop */}
          <div className="w-6 hidden md:block"></div>

          {/* Login Section */}
          <div className="hidden md:flex items-center pr-2">
            <Link
              href="/login"
              className="flex items-center gap-2 text-sm font-medium text-white hover:text-gray-200 transition-colors duration-200"
            >
              <Fingerprint className="w-5 h-5 text-white" />
              <span>Login</span>
            </Link>
          </div>


        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-24 z-40 md:hidden bg-zinc-900 border border-zinc-800 bg-[#1E1E1E] rounded-2xl shadow-2xl overflow-hidden p-4 flex flex-col gap-4"
          >
            <nav className="flex flex-col gap-2">
              <Link
                href="/#about"
                className="p-3 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Product
              </Link>
              <Link
                href="/#pricing"
                className="p-3 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="/updates"
                className="p-3 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Updates
              </Link>
              <div className="h-px bg-white/10 my-1" />
              <Link
                href="/login"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors flex items-center gap-3 justify-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Fingerprint className="w-5 h-5" />
                Login to Flowivate
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}