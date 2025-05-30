// app/components/dashboard/navigation/Sidebar.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Settings from "../privacy/settings";

import {
  IconLayoutDashboard,
  IconStack2,
  IconNotes,
  IconLogout2,
  IconSettings,
  IconBook,
  IconCircleDashedCheck
} from "@tabler/icons-react";

import { Maximize2, Minimize2 } from "lucide-react";
import logo from "../../../assets/brand/logo-v1.5.svg";
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface SidebarProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isFullscreen, toggleFullscreen }) => {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: "Home", icon: IconLayoutDashboard, path: "/dashboard" },
    { name: "Features", icon: IconStack2, path: "/dashboard/features" },
    { name: "Tasks", icon: IconCircleDashedCheck, path: "/dashboard/tasks" },
    { name: "Journal", icon: IconNotes, path: "/dashboard/journal" },
    { name: "Books", icon: IconBook, path: "/dashboard/books" },
  ];

  return (
    <>
      <aside className="flex flex-col z-40 px-2 py-4 ml-2 mx-2 my-1 mb-2 w-16 bg-transparent dark:bg-zinc-900/60 backdrop-blur-xl rounded-xl border border-slate-200/30 dark:border-zinc-800/30">
        <div className="flex flex-col items-center h-full">
          {/* Logo */}
          <div className="mb-8 flex-shrink-0 transition-transform duration-200 hover:scale-105">
            <Image src={logo} alt="Flowivate's logo" width={40} height={40} priority />
          </div>

          {/* Navigation Items */}
          <div className="flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name} className="relative group">
                  <Link href={item.path}>
                    <div
                      className={`flex items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        pathname === item.path
                          ? "bg-primary/10 dark:bg-primary/10 border border-primary/80 dark:border-primary/40"
                          : "hover:bg-gray-100/60 dark:hover:bg-gray-800/30"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${
                          pathname === item.path
                            ? "text-primary"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      />
                    </div>
                  </Link>

                  {/* Tooltip */}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-medium bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md whitespace-nowrap shadow-sm border border-gray-100 dark:border-gray-800 z-10">
                    {item.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Fullscreen Toggle */}
          <div className="flex flex-col items-center space-y-2 mt-4">
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
            >
              {isFullscreen
                ? <Minimize2 className="w-4 h-auto text-gray-600 dark:text-gray-300" />
                : <Maximize2 className="w-4 h-auto text-gray-600 dark:text-gray-300" />
              }
            </button>

            {/* Settings & Logout */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
              aria-label="Settings"
            >
              <IconSettings className="w-4 h-auto text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <IconLogout2 className="w-4 h-auto text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </aside>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Sidebar;