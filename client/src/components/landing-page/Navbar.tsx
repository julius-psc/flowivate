'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fingerprint } from "lucide-react";
import logo from '@/assets/brand/logo-v1.5.svg';

export default function Navbar() {
  return (
    <div className="fixed top-12 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="flex items-center bg-primary-black pr-2 rounded-full shadow-2xl backdrop-blur-md bg-opacity-95">

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

        {/* Links Section */}
        <div className="hidden md:flex items-center gap-5 text-sm font-medium text-gray-300">
          <Link href="#product" className="hover:text-white transition-colors duration-200">
            Product
          </Link>
          <Link href="#pricing" className="hover:text-white transition-colors duration-200">
            Pricing
          </Link>
          <Link href="#updates" className="hover:text-white transition-colors duration-200">
            Updates
          </Link>
        </div>

        {/* Spacer */}
        <div className="w-6 hidden md:block"></div>

        {/* Login Section */}
        <div className="flex items-center pr-2">
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
  );
}