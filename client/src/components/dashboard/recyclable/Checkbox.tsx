"use client";

import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'subtask'; // Keep the variants
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  variant = 'default'
}) => {

  // Define base classes using CSS variables
  const defaultColors = `
    border-primary dark:border-primary
    ${checked ? 'bg-primary dark:bg-primary' : 'bg-transparent'}
    peer-focus:ring-primary-ring/50 dark:peer-focus:ring-primary-ring-dark/50 
    group-hover:border-primary dark:group-hover:border-primary
    ${disabled ? 'group-hover:border-primary dark:group-hover:border-primary' : ''}
  `;

  const subtaskColors = `
    border-accent-pink-border dark:border-accent-pink-border-dark
    ${checked ? 'bg-accent-pink dark:bg-accent-pink' : 'bg-transparent'}
    peer-focus:ring-accent-pink-ring/50 dark:peer-focus:ring-accent-pink-ring-dark/50 /* Use variable + /opacity */
    group-hover:border-accent-pink-hover dark:group-hover:border-accent-pink-hover-dark
    ${disabled ? 'group-hover:border-accent-pink-border dark:group-hover:border-accent-pink-border-dark' : ''} /* Revert hover on disabled */
  `;

  // Determine the color set based on the variant
  const colorClasses = variant === 'subtask' ? subtaskColors : defaultColors;

  // Unique ID for accessibility
  const uniqueId = React.useId();
  const labelId = `checkbox-label-${uniqueId}`;

  return (
    // Use group for hover states on the container
    <label className={`flex items-center select-none group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 peer" // Peer is used for focus styles on the custom box
        aria-labelledby={labelId}
      />
      <span
        className={`
          relative inline-block w-5 h-5 mr-3 flex-shrink-0
          border-2 rounded
          transition-all duration-300
          peer-focus:ring-2 /* Enable ring, color/opacity set by variant */
          ${colorClasses}
          ${disabled ? 'opacity-50' : ''} /* Apply opacity to the box itself when disabled */
        `}
        aria-hidden="true" // Hide visual representation from screen readers
      >
        {/* Checkmark uses the white color variable */}
        {checked && (
          <span className="absolute top-[2px] left-[6px] w-1 h-2.5 border-r-2 border-b-2 border-secondary-white transform rotate-45" />
        )}
      </span>
      <span
        id={labelId}
        // Use Tailwind text color utilities or CSS variables for text
        className={`text-base text-gray-600 dark:text-gray-400 ${
          checked && !disabled ? 'line-through text-gray-400 dark:text-gray-500' : ''
        } ${
          disabled ? 'text-gray-400 dark:text-gray-500' : '' // Muted color when disabled
        }`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;