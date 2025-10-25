'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ClientProvider from '../providers/ClientProvider';
import Sidebar from '../../components/dashboard/navigation/Sidebar';
import Navbar from '../../components/dashboard/navigation/Navbar';
import { DashboardProvider, useDashboard } from '../../context/DashboardContext';
import { PomodoroProvider } from '@/components/dashboard/features/pomodoro/PomodoroContext';
import MiniPomo from '@/components/dashboard/features/pomodoro/MiniPomo';
import ThemeBackground from '../../../themes/ThemeBackground';
import ProductivityBuddy from '@/components/dashboard/features/ai/ProductivityBuddy';
import logo from '../../assets/brand/logo-v1.5.svg';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // 1) Mobile detect
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-4 bg-secondary-black">
        <Image src={logo} alt="Flowivate" width={120} height={40} className="mx-auto" />
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
      <div id="dashboard-container" className="relative h-screen w-screen bg-[#F9FAFB] dark:bg-[#121214]">
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ThemeBackground />
        </div>

        {/* Dashboard Context */}
        <DashboardProvider>
          <LayoutCore>{children}</LayoutCore>
        </DashboardProvider>
      </div>
    </ClientProvider>
  );
}

function LayoutCore({ children }: { children: React.ReactNode }) {
  // 2) Fullscreen state + toggle
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onFullChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullChange);
    return () => document.removeEventListener('fullscreenchange', onFullChange);
  }, []);
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);
  const toggleFullscreen = () => {
    const el = document.getElementById('dashboard-container');
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen();
    else document.exitFullscreen();
  };

  // 3) Pomodoro feature toggle from dashboard
  const { isFeatureSelected } = useDashboard();
  const pomoEnabled = isFeatureSelected('Pomodoro');

  return (
    <PomodoroProvider enabled={pomoEnabled}>
      <div className="relative z-10 flex flex-col h-full">
        {/* Navbar + Mini Pomodoro */}
        <div className="z-20">
          <Navbar />
          {pomoEnabled && (
            <div className="mt-2">
              <MiniPomo />
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden z-10">
          {/* Sidebar */}
          <Sidebar isFullscreen={isFullscreen} toggleFullscreen={toggleFullscreen} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto relative z-10">
            {children}
          </main>
        </div>

        {/* Productivity Buddy */}
        <div className="relative z-10">
          <ProductivityBuddy />
        </div>
      </div>
    </PomodoroProvider>
  );
}