"use client";

import React from "react";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { Skeleton } from "@/components/ui/Skeleton";

export const PomodoroSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isSpecialTheme =
    theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${isSpecialTheme
          ? "dark bg-zinc-900/50 border border-zinc-800/50"
          : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col space-y-6 flex-1">
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>
        <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
          <Skeleton className="h-10 w-32 mb-2" />
          <Skeleton className="w-full h-2 rounded-full" />
          <div className="mt-3 flex items-center">
            <Skeleton className="h-3 w-20 mr-2" />
            <div className="flex space-x-1.5">
              {[...Array(4)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                />
              ))}
            </div>
          </div>
          <div className="flex items-center justify-center w-full space-x-4 pt-4">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="w-20 h-9 rounded-full" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};