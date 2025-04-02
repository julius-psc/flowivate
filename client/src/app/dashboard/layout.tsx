"use client";
import ClientProvider from "../ClientProvider";
import Sidebar from "../../components/dashboard/navigation/Sidebar";
import Navbar from "../../components/dashboard/navigation/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-screen">
      <div className="flex-shrink-0">
        <Navbar />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="pr-2">
          <ClientProvider>{children}</ClientProvider>;
        </main>
      </div>
    </div>
  );
}
