"use client";

import React from "react";
import { SunMedium, Moon, Monitor, type LucideIcon } from "lucide-react";
import ThemeToggle from "../../../../../../themes/ThemeToggle";
import { useSettings } from "../useSettings";

type ThemeMode = "light" | "dark" | "system";

export default function AppearanceTab(): React.JSX.Element {
  const { theme, setTheme } = useSettings();

  const themeOptions: Array<{
    value: ThemeMode;
    label: string;
    icon: LucideIcon;
    description: string;
  }> = [
      { value: "light", label: "Light", icon: SunMedium, description: "Bright and clean" },
      { value: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
      { value: "system", label: "System", icon: Monitor, description: "Follow OS setting" },
    ];

  const ThemePreview = ({ mode }: { mode: ThemeMode }) => {
    if (mode === "light") {
      return (
        <div className="h-full w-full bg-white rounded-lg overflow-hidden">
          <div className="h-5 bg-zinc-100 border-b border-zinc-200 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
          <div className="p-2.5 space-y-1.5">
            <div className="h-1.5 w-12 rounded-full bg-zinc-300" />
            <div className="h-6 w-full rounded-md bg-zinc-100" />
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-8 rounded-md bg-zinc-50 border border-zinc-200" />
              <div className="h-8 rounded-md bg-zinc-50 border border-zinc-200" />
            </div>
          </div>
        </div>
      );
    }
    if (mode === "dark") {
      return (
        <div className="h-full w-full bg-zinc-950 rounded-lg overflow-hidden">
          <div className="h-5 bg-zinc-900 border-b border-zinc-800 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
          <div className="p-2.5 space-y-1.5">
            <div className="h-1.5 w-12 rounded-full bg-zinc-700" />
            <div className="h-6 w-full rounded-md bg-zinc-900" />
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-8 rounded-md bg-zinc-900 border border-zinc-800" />
              <div className="h-8 rounded-md bg-zinc-900 border border-zinc-800" />
            </div>
          </div>
        </div>
      );
    }
    // "system" — split view
    return (
      <div className="h-full w-full relative rounded-lg overflow-hidden">
        <div className="h-full w-1/2 absolute top-0 left-0">
          <ThemePreview mode="light" />
        </div>
        <div className="h-full w-1/2 absolute top-0 right-0">
          <ThemePreview mode="dark" />
        </div>
        <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-zinc-400 to-transparent" />
      </div>
    );
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Appearance
        </h2>
        <p className="text-[13px] text-zinc-500 mt-1">
          Customize the look and feel of Flowivate.
        </p>
      </div>

      <div className="space-y-8">
        {/* Theme Selection */}
        <div>
          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100 mb-1">
              Theme
            </h3>
            <p className="text-[13px] text-zinc-500">
              Choose how Flowivate looks to you.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map((option) => {
              const active = theme === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={[
                    "relative rounded-xl border transition-all duration-200 text-left",
                    active
                      ? "border-primary"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <div className="aspect-[4/3] w-full p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-t-[10px]">
                    <ThemePreview mode={option.value} />
                  </div>
                  <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Icon
                        size={14}
                        className={
                          active
                            ? "text-primary"
                            : "text-zinc-500"
                        }
                      />
                      <span
                        className={[
                          "text-[13px] font-medium",
                          active
                            ? "text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-600 dark:text-zinc-400",
                        ].join(" ")}
                      >
                        {option.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5 ml-5">
                      {option.description}
                    </p>
                  </div>
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="white"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Accent Color */}
        <div>
          <div className="mb-4">
            <h3 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              Accent color
            </h3>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}