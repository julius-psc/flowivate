'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const themeConfigs = [
  { name: 'default', color: '#0075C4', label: 'Default' }, // Blue
  { name: 'candy', color: '#f9a8d4', label: 'Candy' },   // Pink
  // To add new themes, simply add new objects to this array:
  // { name: 'forest', color: '#228B22', label: 'Forest' },
  // { name: 'ocean', color: '#0077BE', label: 'Ocean' },
] as const; // Using 'as const' allows TypeScript to infer a precise ThemeName type.

// Derive the ThemeName type from the names in themeConfigs for type safety.
type ThemeName = typeof themeConfigs[number]['name'];

const ThemeToggle: React.FC = () => {
  // The default theme name is taken from the first entry in themeConfigs.
  const defaultThemeName = themeConfigs[0].name;

  const [theme, setTheme] = useState<ThemeName>(defaultThemeName);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Component is mounted, safe to access localStorage.
    setIsMounted(true);
  }, []);

  // Load theme from localStorage after the component has mounted.
  useEffect(() => {
    if (isMounted) {
      const storedThemeName = localStorage.getItem('theme') as string | null;

      if (storedThemeName === null) {
        // No theme explicitly stored in localStorage; this implies the default theme.
        setTheme(defaultThemeName);
      } else {
        // A theme name is stored. Validate it against our configurations.
        const matchedTheme = themeConfigs.find(t => t.name === storedThemeName);

        if (matchedTheme && matchedTheme.name !== defaultThemeName) {
          // Valid, non-default theme found in localStorage.
          setTheme(matchedTheme.name);
        } else {
          // The stored name is either invalid or it's the default theme's name
          // (which shouldn't be stored directly according to our logic).
          // Fallback to the default theme.
          setTheme(defaultThemeName);
          // If an invalid theme name was stored, or if the default theme's name
          // was incorrectly stored, clean up localStorage.
          if (storedThemeName !== null) {
             localStorage.removeItem('theme');
          }
        }
      }
    }
  }, [isMounted, defaultThemeName]);

  // Apply the current theme to the DOM and update localStorage whenever the theme state changes.
  useEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      if (theme === defaultThemeName) {
        // For the default theme, remove the 'data-theme' attribute and the localStorage item.
        root.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      } else {
        // For other themes, set the 'data-theme' attribute and store the theme name.
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      }
    }
  }, [theme, isMounted, defaultThemeName]);

  const handleThemeSelection = useCallback((newThemeName: ThemeName) => {
    setTheme(newThemeName);
  }, []);

  // Display a loading state until the component is mounted and theme is determined.
  if (!isMounted) {
    const loadingButtonClasses = `
      inline-flex items-center justify-center gap-2 px-4 py-1.5
      text-sm font-medium rounded-md border
      transition-colors duration-150 ease-in-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950
      disabled:opacity-50 disabled:cursor-not-allowed
      border-gray-300 dark:border-gray-700
      bg-gray-100 dark:bg-gray-800
      text-gray-700 dark:text-gray-300
      cursor-wait
    `;
    return (
      <button
        className={loadingButtonClasses}
        aria-disabled="true"
        disabled
      >
        <Loader2 size={16} className="animate-spin" />
        <span>Loading Themes...</span>
      </button>
    );
  }

  // Render the theme selection circles.
  return (
    <div className="flex items-center space-x-3 p-1" role="radiogroup" aria-label="Theme selection">
      {themeConfigs.map((themeConfig) => (
        <button
          key={themeConfig.name}
          type="button"
          role="radio"
          aria-checked={theme === themeConfig.name}
          onClick={() => handleThemeSelection(themeConfig.name)}
          className={`
            w-6 h-6 rounded-full cursor-pointer
            transition-all duration-200 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 
            focus:ring-indigo-500 dark:focus:ring-indigo-400
            ${theme === themeConfig.name
              ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-gray-800 scale-110 shadow-md' // Active state
              : 'hover:scale-110 hover:shadow-sm' // Hover state for inactive circles
            }
          `}
          style={{ backgroundColor: themeConfig.color }}
          aria-label={`Switch to ${themeConfig.label} theme`}
          title={`Switch to ${themeConfig.label} theme`} // Tooltip for desktop users
        />
      ))}
    </div>
  );
};

export default ThemeToggle;