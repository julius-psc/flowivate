'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const themeConfigs = [
  {
    name: 'default',
    color: '#0075C4',
    label: 'Default',
    bgUrl: "/assets/illustrations/gradient-bg-blue.svg",
  },
  {
    name: 'forest',
    color: '#48AC5C',
    label: 'Forest',
    bgUrl: "/assets/illustrations/gradient-bg-forest.svg",
  },
  // Add more themes here...
] as const;

type ThemeName = (typeof themeConfigs)[number]['name'];

const ThemeToggle: React.FC = () => {
  const defaultThemeName = themeConfigs[0].name;

  const [theme, setTheme] = useState<ThemeName>(defaultThemeName);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const storedThemeName = localStorage.getItem('theme') as ThemeName | null;
      const validTheme = themeConfigs.find(t => t.name === storedThemeName);
      setTheme(validTheme ? validTheme.name : defaultThemeName);
    }
  }, [isMounted, defaultThemeName]);

  useEffect(() => {
    if (!isMounted) return;

    const root = document.documentElement;
    const dashboardContainer = document.getElementById('dashboard-container');
    const selectedThemeConfig = themeConfigs.find(t => t.name === theme);

    if (!selectedThemeConfig || !dashboardContainer) return;

    // Set data-theme
    if (theme === defaultThemeName) {
      root.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      root.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }

    // Set background image using inline style
    dashboardContainer.style.backgroundImage = `url('${selectedThemeConfig.bgUrl}')`;
    dashboardContainer.style.backgroundSize = 'cover';
    dashboardContainer.style.backgroundRepeat = 'no-repeat';
  }, [theme, isMounted, defaultThemeName]);

  const handleThemeSelection = useCallback((newTheme: ThemeName) => {
    setTheme(newTheme);
  }, []);

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
      <button className={loadingButtonClasses} disabled>
        <Loader2 size={16} className="animate-spin" />
        <span>Loading Themes...</span>
      </button>
    );
  }

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
              ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-gray-800 scale-110 shadow-md'
              : 'hover:scale-110 hover:shadow-sm'
            }
          `}
          style={{ backgroundColor: themeConfig.color }}
          aria-label={`Switch to ${themeConfig.label} theme`}
          title={`Switch to ${themeConfig.label} theme`}
        />
      ))}
    </div>
  );
};

export default ThemeToggle;