'use client';

import React, { useState, useEffect, useCallback } from 'react';

type Theme = 'default' | 'candy';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('default');

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []); 

  useEffect(() => {
    // Only run this logic if the component has mounted
    if (isMounted) {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      if (savedTheme === 'candy') {
        setTheme(savedTheme); // Update state based on localStorage
      }
    }
  }, [isMounted]);

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
  }, [theme, isMounted]); // Also depends on isMounted

  // Function to toggle the theme
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => (prevTheme === 'default' ? 'candy' : 'default'));
  }, []);

  if (!isMounted) {
     return (
        <button
            style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-accent-grey)', // Use default styles
                color: 'var(--color-secondary-black)',
                border: '1px solid var(--color-bdr-light)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                opacity: 0.7, // Indicate loading state maybe
            }}
            aria-disabled="true" // Disable until mounted and theme loaded
        >
            Loading Theme...
        </button>
    );
  }


  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '0.5rem 1rem',
        backgroundColor: 'var(--color-accent-grey)',
        color: 'var(--color-secondary-black)',
        border: '1px solid var(--color-bdr-light)',
        borderRadius: '0.375rem',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease-in-out',
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-grey-hover)'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-accent-grey)'}
    >
      Switch to {theme === 'default' ? 'Candy' : 'Default'} Theme
    </button>
  );
};

export default ThemeToggle;