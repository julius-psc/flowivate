'use client';

import ClientProvider from '../providers/ClientProvider';
import Sidebar from '../../components/dashboard/navigation/Sidebar';
import Navbar from '../../components/dashboard/navigation/Navbar';
import { DashboardProvider } from '../../context/DashboardContext';
import ThemeBackground from '../../../themes/ThemeBackground';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
      <div className="relative h-screen w-screen bg-secondary-white dark:bg-[#151E2F]" id="dashboard-container">
        {/* Background Environments */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ThemeBackground />
        </div>

        {/* Main App Layout Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Navbar */}
          <div className="z-20">
            <Navbar />
          </div>

          {/* Sidebar + Content */}
          <div className="flex flex-1 overflow-hidden z-10">
            <Sidebar />
            <DashboardProvider>
              <main className="flex-1 overflow-y-auto relative z-10">
                {children}
              </main>
            </DashboardProvider>
          </div>
        </div>
      </div>
    </ClientProvider>
  );
}