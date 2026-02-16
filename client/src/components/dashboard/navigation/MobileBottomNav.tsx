"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import {
    IconLayoutDashboard,
    IconStack2,
    IconCircleDashedCheck,
    IconNotes,
    IconBook,
    IconSettings,
} from "@tabler/icons-react";

interface MobileBottomNavProps {
    openSettings: (tab?: string) => void;
}

interface NavItem {
    name: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    path: string;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ openSettings }) => {
    const pathname = usePathname();
    const [isMounted, setIsMounted] = useState(false);
    const { theme } = useTheme();

    useEffect(() => {
        setIsMounted(true);
    }, []);

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

    const bgClasses = !isMounted
        ? "bg-white dark:bg-zinc-900 opacity-0"
        : isSpecialTheme
            ? "dark bg-zinc-900/80 border-t border-zinc-800/50 opacity-100"
            : "bg-white/90 dark:bg-zinc-900/90 border-t border-slate-200/50 dark:border-zinc-800/50 opacity-100";

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl transition-opacity duration-300 ${bgClasses}`}
        >
            <div className="flex items-center justify-around px-1 py-2 safe-area-pb">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px] ${isActive
                                    ? "text-primary"
                                    : isSpecialTheme
                                        ? "text-white/50"
                                        : "text-zinc-400 dark:text-zinc-500"
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="text-[10px] font-medium leading-tight">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
                <button
                    onClick={() => openSettings("account")}
                    className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px] ${isSpecialTheme
                            ? "text-white/50"
                            : "text-zinc-400 dark:text-zinc-500"
                        }`}
                >
                    <IconSettings size={20} />
                    <span className="text-[10px] font-medium leading-tight">
                        Settings
                    </span>
                </button>
            </div>
        </nav>
    );
};

export default MobileBottomNav;
