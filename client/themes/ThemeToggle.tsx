'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

const themeConfigs = [
  {
    name: 'default',
    color: '#0075C4', // Blue
    label: 'Default',
    bgUrl: "/assets/illustrations/gradient-bg-blue.svg",
  },
  {
    name: 'forest',
    color: '#48AC5C', // Green
    label: 'Forest',
    bgUrl: "/assets/illustrations/gradient-bg-forest.svg",
  },
  {
    name: 'candy',
    color: '#f9a8d4', // Pink
    label: 'Candy',
    bgUrl: "/assets/illustrations/gradient-bg-candy.svg",
  },
  {
    name: 'sunset',
    color: '#FF7043', // Coral
    label: 'Sunset',
    bgUrl: "/assets/illustrations/gradient-bg-sunset.svg", 
  },
  {
    name: 'ocean', 
    color: '#26A69A', // Teal
    label: 'Ocean',
    bgUrl: "/assets/illustrations/gradient-bg-ocean.svg", 
  },
  {
    name: 'desert', 
    color: '#FFB74D', // Yellow
    label: 'Desert',
    bgUrl: "/assets/illustrations/gradient-bg-desert.svg",
  }
] as const; // `as const` makes properties readonly and infers literal types.
            // Now, `selectedThemeConfig.bgUrl` will be typed as `string | undefined`.

type ThemeName = (typeof themeConfigs)[number]['name'];

// Configuration for the second row of "scene" themes
const specialSceneThemes = [
  {
    name: 'underwater',
    color: '#4FC3F7', // Light Blue for the rectangle visual
    label: 'Underwater',
  },
  {
    name: 'jungle',
    color: '#81C784', // Light Green for the rectangle visual
    label: 'Jungle',
  },
] as const;


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

    // Set data-theme attribute for potential global CSS rules
    if (theme === defaultThemeName) {
      root.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      root.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    }

    // Apply or remove background image on the dashboard container
    // This check is now type-safe because selectedThemeConfig.bgUrl exists (value can be string or undefined).
    if (selectedThemeConfig.bgUrl) {
      dashboardContainer.style.backgroundImage = `url('${selectedThemeConfig.bgUrl}')`;
      dashboardContainer.style.backgroundSize = 'cover';
      dashboardContainer.style.backgroundRepeat = 'no-repeat';
      dashboardContainer.style.backgroundPosition = 'center';
      dashboardContainer.style.backgroundColor = ''; // Clear any solid background color if gradient is applied
    } else {
      // If bgUrl is undefined (e.g., for the default theme), remove the background image
      dashboardContainer.style.backgroundImage = 'none';
      // Optionally, set a solid background color for the default theme if desired:
      // dashboardContainer.style.backgroundColor = selectedThemeConfig.color;
    }
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
    <div className="space-y-4"> {/* Main wrapper for both sections */}
      {/* First row: Color toggles */}
      <div>
        <div className="flex items-center space-x-3 p-1" role="radiogroup" aria-label="Color Theme selection">
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
      </div>

      {/* Second row: Special scene theme rectangles */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Scene Themes:</span>
        <div className="flex items-center space-x-3 p-1">
          {specialSceneThemes.map((sceneTheme) => (
            <button
              key={sceneTheme.name}
              type="button"
              // onClick={() => console.log(`Scene theme ${sceneTheme.name} selected - logic TBD`)}
              className="flex flex-col items-center cursor-pointer group p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              aria-label={`Select ${sceneTheme.label} scene theme`}
              title={`Select ${sceneTheme.label} scene theme (logic TBD)`}
            >
              <div
                style={{ backgroundColor: sceneTheme.color }}
                className="w-12 h-8 rounded border border-gray-300 dark:border-gray-600 group-hover:shadow-md transition-shadow duration-150"
                aria-hidden="true"
              >
              </div>
              <span className="text-xs mt-1.5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300">
                {sceneTheme.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
