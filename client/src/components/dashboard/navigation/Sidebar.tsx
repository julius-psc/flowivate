"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Settings from "../privacy/settings";
import { useTheme } from "next-themes"; // Import useTheme
import { specialSceneThemeNames } from "@/lib/themeConfig"; // Import theme names

import {
  IconLayoutDashboard,
  IconStack2,
  IconNotes,
  IconLogout2,
  IconSettings,
  IconBook,
  IconCircleDashedCheck,
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
}

const Sidebar: React.FC<SidebarProps> = ({
  isFullscreen,
  toggleFullscreen,
}) => {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Add isMounted state
  const { theme } = useTheme(); // Get theme

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
  ];

  // Define base classes
  const asideBaseClasses =
    "flex flex-col z-40 px-2 py-4 ml-2 mx-2 my-1 mb-2 w-16 backdrop-blur-xl rounded-xl transition-opacity duration-300";
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
        className={`${asideBaseClasses} ${
          isMounted ? asidePostMountClasses : asidePreMountClasses // Apply conditional classes
        }`}
      >
        <div className="flex flex-col items-center h-full">
          {/* Logo */}
          <div className="mb-8 flex-shrink-0 transition-transform duration-200 hover:scale-105">
            <Image
              src={logo}
              alt="Flowivate's logo"
              width={40}
              height={40}
              priority
            />
          </div>

          {/* Navigation Items */}
          <div className="flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name} className="relative group">
                  <Link href={item.path}>
                    <div
                      className={`flex items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        pathname === item.path ? activeBgColor : hoverBgColor // Use new color vars
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${
                          pathname === item.path
                            ? activeIconColor
                            : inactiveIconColor // Use new color vars
                        }`}
                      />
                    </div>
                  </Link>

                  {/* Tooltip - Style remains the same */}
                  <div className="absolute left-14 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs font-medium bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-2 py-1 rounded-md whitespace-nowrap shadow-sm border border-gray-100 dark:border-gray-800 z-10">
                    {item.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-col items-center space-y-2 mt-4">
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
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-lg transition-colors ${hoverBgColor}`} // Use new hover color
              aria-label="Settings"
            >
              <IconSettings className={`w-4 h-auto ${inactiveIconColor}`} />{" "}
              {/* Use new icon color */}
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

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Sidebar;