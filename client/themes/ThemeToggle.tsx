'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SunMedium, Sparkles, Loader2 } from 'lucide-react'; // Add icons

type Theme = 'default' | 'candy';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('default');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load theme from localStorage AFTER mounting
  useEffect(() => {
    if (isMounted) {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme === 'default' || savedTheme === 'candy') {
        setTheme(savedTheme);
      } else {
        setTheme('default'); // Fallback
        localStorage.removeItem('theme');
      }
    }
  }, [isMounted]);

  // Apply/save theme effect
  useEffect(() => {
    if (isMounted) {
      const root = document.documentElement;
      if (theme === 'default') {
        root.removeAttribute('data-theme');
        localStorage.removeItem('theme');
      } else {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
      }
    }
  }, [theme, isMounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'default' ? 'candy' : 'default'));
  }, []);

  // Define base button classes matching SettingsModal secondary button
  const buttonClasses = `
    inline-flex items-center justify-center gap-2 px-4 py-1.5
    text-sm font-medium rounded-md border
    transition-colors duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Define specific color classes (matching secondary button)
  const colorClasses = `
    border-gray-300 dark:border-gray-700
    bg-gray-100 dark:bg-gray-800
    text-gray-700 dark:text-gray-300
    hover:bg-gray-200 dark:hover:bg-gray-700
    focus:ring-gray-400
  `;

  // Loading state button
  if (!isMounted) {
    return (
      <button
        className={`${buttonClasses} ${colorClasses} cursor-wait`}
        aria-disabled="true"
        disabled // Add disabled attribute for semantics
      >
        <Loader2 size={16} className="animate-spin" />
        <span>Loading...</span>
      </button>
    );
  }

  // Active toggle button
  const Icon = theme === 'default' ? Sparkles : SunMedium; // Icon shows the theme you'll switch *to*
  const label = theme === 'default' ? 'Candy' : 'Default';

  return (
    <button
      onClick={toggleTheme}
      className={`${buttonClasses} ${colorClasses}`}
      aria-label={`Switch to ${label} theme`} // Better accessibility label
    >
      <Icon size={16} aria-hidden="true" />
      <span>Switch to {label}</span>
    </button>
  );
};

export default ThemeToggle;