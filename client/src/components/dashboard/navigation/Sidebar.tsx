"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";

import {
  IconLayoutDashboard,
  IconStack2,
  IconNotes,
  IconLogout2,
  IconSettings,
  IconBook,
  IconCircleDashedCheck,
  IconChartArcs3,
} from "@tabler/icons-react";

import { Maximize2, Minimize2 } from "lucide-react";
import logo from "../../../assets/brand/logo-v1.5.svg";
import { usePathname } from "next/navigation";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface SidebarProps {
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  openSettings: (tab?: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isFullscreen,
  toggleFullscreen,
  openSettings,
}) => {
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  // Effect runs only on the client after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate isSpecialTheme *after* mount
  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const navItems: NavItem[] = [
    { name: "Home", icon: IconLayoutDashboard, path: "/dashboard" },
    { name: "Features", icon: IconStack2, path: "/dashboard/features" },
    { name: "Tasks", icon: IconCircleDashedCheck, path: "/dashboard/tasks" },
    { name: "Journal", icon: IconNotes, path: "/dashboard/journal" },
    { name: "Books", icon: IconBook, path: "/dashboard/books" },
    { name: "Stats", icon: IconChartArcs3, path: "/dashboard/stats" },
  ];

  const [isExpanded, setIsExpanded] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => setIsExpanded(true), 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
    setIsExpanded(false);
  };

  // Define base classes
  const asideBaseClasses =
    `flex flex-col z-30 px-2 py-4 ml-2 mx-2 mt-6 mb-2 backdrop-blur-xl rounded-xl transition-all duration-300 ease-in-out ${isExpanded ? 'w-48' : 'w-16'}`;
  // Define pre-mount classes (solid, maybe invisible)
  const asidePreMountClasses =
    "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  // Define post-mount classes based on theme
  const asidePostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100" // Frosted glass for special themes
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100"; // Standard light/dark transparent

  // Improved Color Classes
  const inactiveIconColor = "text-zinc-500 dark:text-white/60"; // Softer inactive color, good contrast on dark frost
  const hoverBgColor = "hover:bg-zinc-100/60 dark:hover:bg-white/10"; // Subtle hover
  const activeBgColor = "bg-primary/10 dark:bg-primary/10"; // Active background (removed border)
  const activeIconColor = "text-primary";

  return (
    <>
      <aside
        className={`${asideBaseClasses} ${isMounted ? asidePostMountClasses : asidePreMountClasses}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="mb-8 shrink-0 w-full flex justify-center transition-transform duration-200 hover:scale-105">
            <Image
              src={logo}
              alt="Flowivate's logo"
              width={40}
              height={40}
              priority
            />
          </div>

          {/* Navigation Items */}
          <div className="flex-grow w-full">
            <ul className="space-y-1 w-full">
              {navItems.map((item) => (
                <li key={item.name} className="relative group w-full">
                  <Link href={item.path} className="block w-full">
                    <div
                      className={`flex items-center justify-start ${isExpanded ? 'gap-3' : ''} px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${pathname === item.path ? activeBgColor : hoverBgColor}`}
                    >
                      <item.icon
                        className={`w-5 h-5 shrink-0 ${pathname === item.path ? activeIconColor : inactiveIconColor}`}
                      />
                      <span
                        className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                          isExpanded ? 'opacity-100 max-w-[120px]' : 'opacity-0 max-w-0 overflow-hidden'
                        } ${pathname === item.path ? activeIconColor : inactiveIconColor}`}
                      >
                        {item.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col items-center space-y-2 mt-4 w-full">
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className={`p-2 rounded-lg transition-colors ${hoverBgColor}`} // Use new hover color
            >
              {isFullscreen ? (
                <Minimize2 className={`w-4 h-auto ${inactiveIconColor}`} /> // Use new icon color
              ) : (
                <Maximize2 className={`w-4 h-auto ${inactiveIconColor}`} /> // Use new icon color
              )}
            </button>

            <button
              onClick={() => openSettings("account")}
              className={`p-2 rounded-lg transition-colors ${hoverBgColor}`}
              aria-label="Settings"
            >
              <IconSettings className={`w-4 h-auto ${inactiveIconColor}`} />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={`p-2 rounded-lg transition-colors ${hoverBgColor}`} // Use new hover color
              aria-label="Logout"
            >
              <IconLogout2 className={`w-4 h-auto ${inactiveIconColor}`} />{" "}
              {/* Use new icon color */}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;