'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
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
  {
    name: 'candy',
    color: '#f9a8d4',
    label: 'Candy',
    bgUrl: "/assets/illustrations/gradient-bg-candy.svg",
  },
  {
    name: 'sunset',
    color: '#FF7043',
    label: 'Sunset',
    bgUrl: "/assets/illustrations/gradient-bg-sunset.svg",
  },
  {
    name: 'teal',
    color: '#26A69A',
    label: 'Teal',
    bgUrl: "/assets/illustrations/gradient-bg-teal.svg",
  },
  {
    name: 'desert',
    color: '#FFB74D',
    label: 'Desert',
    bgUrl: "/assets/illustrations/gradient-bg-desert.svg",
  },
] as const;

const specialSceneThemes = [
  {
    name: 'jungle',
    color: '#81C784',
    label: 'Jungle',
  },
  {
    name: 'ocean',
    color: '#26A69A',
    label: 'Ocean',
  },
] as const;

type ThemeName = (typeof themeConfigs | typeof specialSceneThemes)[number]['name'];

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleThemeSelection = useCallback((newTheme: ThemeName) => {
    setTheme(newTheme);
  }, [setTheme]);

  if (!isMounted) {
    return (
      <button
        className="inline-flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md border transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-wait"
        disabled
      >
        <Loader2 size={16} className="animate-spin" />
        <span>Loading Themes...</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* First row: Color themes */}
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

      {/* Second row: Scene themes */}
      <div className="flex flex-col items-start">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 ml-1">Scene Themes:</span>
        <div className="flex items-center space-x-3 p-1">
          {specialSceneThemes.map((sceneTheme) => (
            <button
              key={sceneTheme.name}
              type="button"
              onClick={() => handleThemeSelection(sceneTheme.name)}
              className="flex flex-col items-center cursor-pointer group p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
              aria-label={`Select ${sceneTheme.label} scene theme`}
              title={`Select ${sceneTheme.label} scene theme`}
            >
              <div
                style={{ backgroundColor: sceneTheme.color }}
                className={`
                  w-12 h-8 rounded border border-gray-300 dark:border-gray-600 group-hover:shadow-md transition-shadow duration-150
                  ${theme === sceneTheme.name ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}
                `}
                aria-hidden="true"
              />
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