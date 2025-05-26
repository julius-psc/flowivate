
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
  // 1) Mobile detect
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // 2) Fullscreen state + listeners
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullChange);
    return () => document.removeEventListener("fullscreenchange", onFullChange);
  }, []);

  // Exit on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    const el = document.getElementById("dashboard-container");
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen();
    }
  };

  // 3) Mobile‐only screen
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
            Under construction... 🚧
          </h1>
          <p className="text-center text-lg text-secondary-white leading-relaxed">
            Flowivate is coming soon to Android and iOS devices,
            <br />
            head to desktop for the full experience!
          </p>
        </div>
      </div>
    );
  }

  // 4) Main dashboard shell
  return (
    <ClientProvider>
      <div
        id="dashboard-container"
        className="relative h-screen w-screen bg-secondary-white dark:bg-[#151E2F]"
      >
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ThemeBackground />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Navbar */}
          <div className="z-20">
            <Navbar />
          </div>

          <div className="flex flex-1 overflow-hidden z-10">
            {/* Sidebar (now with fullscreen button) */}
            <Sidebar
              isFullscreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
            />

            {/* Page content */}
            <DashboardProvider>
              <main className="flex-1 overflow-y-auto relative z-10">
                {children}
              </main>
            </DashboardProvider>
          </div>

          {/* Productivity Buddy */}
          <div className="relative z-10">
            <ProductivityBuddy />
          </div>
        </div>
      </div>
    </ClientProvider>
  );
}
