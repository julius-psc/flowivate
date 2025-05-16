"use client";

import React from "react";
import { SunMedium, Moon, Monitor } from "lucide-react";
import ThemeToggle from "../../../../../../themes/ThemeToggle";
import { useSettings } from "../useSettings";

const AppearanceTab = (): React.JSX.Element => {
  const { theme, setTheme, styling } = useSettings();

  const themeOptions = [
    { value: "light" as const, label: "Light", icon: <SunMedium size={20} /> },
    { value: "dark" as const, label: "Dark", icon: <Moon size={20} /> },
    { value: "system" as const, label: "System", icon: <Monitor size={20} /> },
  ];

  return (
    <div className="space-y-6">
      <div className={styling.sectionHeaderClasses}>
        <h2 className={styling.sectionTitleClasses}>Appearance</h2>
        <p className={styling.sectionDescriptionClasses}>
          Customize your visual experience.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <h3 className={styling.labelClasses + " mb-2"}>Theme</h3>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex flex-col items-center justify-center p-3 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${
                  theme === option.value
                    ? "bg-primary/10 dark:bg-primary/30 border-primary/30 dark:border-primary/50 text-primary dark:text-primary/70 focus:ring-primary"
                    : "bg-transparent dark:bg-transparent border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-secondary-white/40 dark:hover:bg-secondary-black/40 focus:ring-gray-400"
                }`}
                aria-pressed={theme === option.value}
              >
                {React.cloneElement(option.icon, {})}
                <span className="text-xs font-medium mt-1">{option.label}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {theme === "system"
              ? "Matches your device's color scheme."
              : theme === "dark"
              ? "Dark mode enabled."
              : "Light mode enabled."}
          </p>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default AppearanceTab;