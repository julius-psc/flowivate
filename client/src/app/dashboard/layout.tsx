"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ClientProvider from "../providers/ClientProvider";
import Sidebar from "../../components/dashboard/navigation/Sidebar";
import Navbar from "../../components/dashboard/navigation/Navbar";
import { DashboardProvider } from "../../context/DashboardContext";
import ThemeBackground from "../../../themes/ThemeBackground";
import ProductivityBuddy from "@/components/dashboard/features/ai/ProductivityBuddy";
import logo from '../../assets/brand/logo-v1.5.svg';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Mobile detect exactly like in your page
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Early return a full-screen mobile notice
  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 bg-secondary-black">
        <div className="text-center">
          <div className="mb-8">
            <Image 
              src={logo} 
              alt="Flowivate" 
              width={120}
              height={40}
              className="mx-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold text-secondary-white mb-4">
            Coming soon 🚧
          </h1>
          <p className="text-center text-lg text-secondary-white leading-relaxed">
            Flowivate is coming soon to Android and IOS devices,
            <br />
            head to desktop for the full experience!
          </p>
        </div>
      </div>
    );
  }

  // Otherwise render your usual dashboard shell + children
  return (
    <ClientProvider>
      <div
        className="relative h-screen w-screen bg-secondary-white dark:bg-[#151E2F]"
        id="dashboard-container"
      >
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ThemeBackground />
        </div>

        {/* Main Layout */}
        <div className="relative z-10 flex flex-col h-full">
          <div className="z-20">
            <Navbar />
          </div>
          <div className="flex flex-1 overflow-hidden z-10">
            <Sidebar />
            <DashboardProvider>
              <main className="flex-1 overflow-y-auto relative z-10">
                {children}
              </main>
            </DashboardProvider>
          </div>
          <ProductivityBuddy />
        </div>
      </div>
    </ClientProvider>
  );
}