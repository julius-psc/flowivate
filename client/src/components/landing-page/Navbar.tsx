'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Fingerprint } from "lucide-react";
import logo from '../../assets/brand/logo-v1.5-white.svg';

export default function Navbar() {
  return (
    <div className="w-full flex justify-center py-4 px-6">
      <nav className="flex items-center justify-center gap-10 rounded-full backdrop-blur-md bg-white/10 border border-white/10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src={logo} alt="Flowivate Logo" width={44} height={40} />
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6 text-sm font-medium text-secondary-white">
          <Link href="#product" className="transition">Product</Link>
          <Link href="#pricing" className="transition">Pricing</Link>
          <Link href="#updates" className="transition">Updates</Link>
        </div>

        {/* Login */}
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-full transition text-secondary-white"
        >
          <Fingerprint size={18} />
          <span className="text-sm font-medium">Login</span>
        </Link>
      </nav>
    </div>
  );
}