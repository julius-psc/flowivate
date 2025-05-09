"use client";

import ClientProvider from "../providers/ClientProvider";
import Sidebar from "../../components/dashboard/navigation/Sidebar";
import Navbar from "../../components/dashboard/navigation/Navbar";
import { DashboardProvider } from "../../context/DashboardContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientProvider>
<div
  className="flex flex-col h-screen w-screen bg-secondary-white dark:bg-[#151E2F]"
  id="dashboard-container"
>
        <div className="flex-shrink-0">
          <Navbar />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <DashboardProvider>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </DashboardProvider>
        </div>
      </div>
    </ClientProvider>
  );
}