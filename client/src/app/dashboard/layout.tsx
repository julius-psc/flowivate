"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import ClientProvider from "../providers/ClientProvider";
import Sidebar from "../../components/dashboard/navigation/Sidebar";
import Navbar from "../../components/dashboard/navigation/Navbar";
import { DashboardProvider, useDashboard } from "../../context/DashboardContext";
import { PomodoroProvider } from "@/components/dashboard/features/pomodoro/PomodoroContext";
import MiniPomo from "@/components/dashboard/features/pomodoro/MiniPomo";
import ThemeBackground from "../../../themes/ThemeBackground";
import Settings from "../../components/dashboard/privacy/settings";
import logo from "../../assets/brand/logo-v1.5.svg";
import ProactiveAssistant from "../../components/dashboard/features/ai/ProactiveAssistant";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 bg-secondary-black">
        <Image
          src={logo}
          alt="Flowivate"
          width={120}
          height={40}
          className="mx-auto"
        />
        <h1 className="mt-8 text-2xl font-semibold text-secondary-white">
          Under construction... 🚧
        </h1>
        <p className="mt-4 text-center text-lg text-secondary-white">
          Flowivate is coming soon to mobile. Please use desktop!
        </p>
      </div>
    );
  }

  return (
    <ClientProvider>
      <div
        id="dashboard-container"
        className="relative h-screen w-screen bg-[#F9FAFB] dark:bg-[#121214]"
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ThemeBackground />
        </div>
        <DashboardProvider>
          <LayoutCore>{children}</LayoutCore>
        </DashboardProvider>
      </div>
    </ClientProvider>
  );
}

function LayoutCore({ children }: { children: React.ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const onFullChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullChange);
    return () => document.removeEventListener("fullscreenchange", onFullChange);
  }, []);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.fullscreenElement)
        document.exitFullscreen();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const openSettings = (tab: string = "account") => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
    setIsSettingsOpen(true);
  };

  const { isFeatureSelected } = useDashboard();
  const pomoEnabled = isFeatureSelected("Pomodoro");


  return (
    <PomodoroProvider enabled={pomoEnabled}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="z-20">
          <Navbar openSettings={openSettings} />
          {pomoEnabled && (
            <div className="mt-2">
              <MiniPomo />
            </div>
          )}
        </div>
        <div className="flex flex-1 overflow-hidden z-10">
          <Sidebar
            isFullscreen={isFullscreen}
            toggleFullscreen={toggleFullscreen}
            openSettings={openSettings}
          />
          <main className="flex-1 overflow-y-auto relative z-10">
            {children}
          </main>
        </div>
      </div>
      {isSettingsOpen && (
        <Settings
          isOpen={isSettingsOpen}
          onClose={() => {
            setIsSettingsOpen(false);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              url.searchParams.delete("tab");
              window.history.replaceState({}, "", url.toString());
            }
          }}
        />
      )}
      <ProactiveAssistant />
    </PomodoroProvider>
  );
}