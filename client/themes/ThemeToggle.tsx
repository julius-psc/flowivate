"use client";

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
// Import icons from lucide-react
import { Sun, Moon, Laptop } from 'lucide-react';

// Interface for theme options for better type safety
interface ThemeOption {
  name: string; // Corresponds to themes supported by next-themes ('light', 'dark', 'system')
  label: string; // User-friendly label
  icon: React.ElementType; // Icon component (Lucide icons are compatible)
}

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, essential for theme switching components
  // to avoid hydration errors.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Define the theme options using Lucide icons
  const themes: ThemeOption[] = [
    { name: 'light', label: 'Light', icon: Sun },
    { name: 'dark', label: 'Dark', icon: Moon },
    { name: 'system', label: 'System', icon: Laptop } // Using Laptop icon for system preference
  ];

  // Until the component is mounted, we can render a placeholder or null
  if (!mounted) {
    // Render a simple placeholder matching the final dimensions
    return <div className="inline-flex h-[36px] w-[100px] animate-pulse rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800"></div>;
  }

  return (
    <div className="inline-flex items-center p-0.5 space-x-1 bg-gray-200/80 dark:bg-gray-700/80 rounded-lg border border-gray-300/70 dark:border-gray-600/70 shadow-sm">
      {themes.map((t) => {
        const isActive = theme === t.name;
        const IconComponent = t.icon; // Assign to a variable starting with uppercase for JSX

        return (
          <button
            key={t.name}
            type="button"
            className={`
              p-1.5 rounded-md transition-colors duration-200 ease-in-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800
              ${isActive
                ? 'bg-white dark:bg-gray-900 shadow-sm text-blue-600 dark:text-blue-400' // Active styles
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300/60 dark:hover:bg-gray-600/60 hover:text-gray-700 dark:hover:text-gray-200' // Inactive styles
              }
            `}
            title={`Set theme to ${t.label}`}
            aria-label={`Set theme to ${t.label}`}
            aria-pressed={isActive} // Indicate active state for screen readers
            onClick={() => setTheme(t.name)}
          >
            {/* Render the Lucide icon component.
                Lucide icons inherit color via 'currentColor' by default.
                Explicit size can be set via props (e.g., size={20}) or Tailwind classes.
                Using Tailwind classes here: */}
            <IconComponent className="w-5 h-5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
