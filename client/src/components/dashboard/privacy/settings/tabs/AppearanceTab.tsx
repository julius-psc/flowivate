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
  }> = [
    { value: "light", label: "Light", icon: SunMedium },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const ThemePreview = ({ mode }: { mode: ThemeMode }) => {
    if (mode === "light") {
      return (
        <div className="h-full w-full bg-white rounded-md overflow-hidden border border-gray-200">
          <div className="h-6 bg-gray-50 border-b border-gray-200 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
          <div className="p-3 space-y-2">
            <div className="h-2 w-16 rounded bg-gray-300" />
            <div className="h-8 w-full rounded bg-gray-100 border border-gray-200" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 rounded bg-gray-50 border border-gray-200" />
              <div className="h-12 rounded bg-gray-50 border border-gray-200" />
            </div>
          </div>
        </div>
      );
    }
    if (mode === "dark") {
      return (
        <div className="h-full w-full bg-gray-950 rounded-md overflow-hidden border border-gray-800">
          <div className="h-6 bg-gray-900 border-b border-gray-800 flex items-center px-2 gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
          <div className="p-3 space-y-2">
            <div className="h-2 w-16 rounded bg-gray-700" />
            <div className="h-8 w-full rounded bg-gray-900 border border-gray-800" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-12 rounded bg-gray-900 border border-gray-800" />
              <div className="h-12 rounded bg-gray-900 border border-gray-800" />
            </div>
          </div>
        </div>
      );
    }
    // "system" — split view
    return (
      <div className="h-full w-full relative rounded-md overflow-hidden">
        <div className="h-full w-1/2 absolute top-0 left-0">
          <ThemePreview mode="light" />
        </div>
        <div className="h-full w-1/2 absolute top-0 right-0">
          <ThemePreview mode="dark" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-gradient-to-b from-transparent via-gray-400 to-transparent" />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Appearance
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Customize the look and feel of Flowivate to match your preferences.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Theme
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select your preferred color theme for the interface.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map((option) => {
              const active = theme === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={[
                    "relative rounded-lg border-2 transition-all group",
                    active
                      ? "border-primary shadow-sm"
                      : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <div className="aspect-video w-full p-3">
                    <ThemePreview mode={option.value} />
                  </div>
                  <div
                    className={[
                      "flex items-center justify-center gap-2 py-3 border-t",
                      active
                        ? "bg-primary/5 dark:bg-primary/10 border-primary/20"
                        : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800",
                    ].join(" ")}
                  >
                    <Icon
                      size={16}
                      className={
                        active
                          ? "text-primary"
                          : "text-gray-600 dark:text-gray-400"
                      }
                    />
                    <span
                      className={[
                        "text-sm font-medium",
                        active
                          ? "text-primary"
                          : "text-gray-700 dark:text-gray-300",
                      ].join(" ")}
                    >
                      {option.label}
                    </span>
                  </div>
                  {active && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                      <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
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

        <div className="h-px bg-gray-200 dark:bg-gray-800" />

        <div>
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Accent color
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose an accent color to personalize your experience.
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}