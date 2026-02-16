"use client";

import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'subtask';
  className?: string;
  truncate?: boolean;
  textRef?: React.RefObject<HTMLSpanElement | null>;
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  variant = 'default',
  className = '',
  truncate: shouldTruncate = true,
  textRef,
}) => {

  // Define base classes using CSS variables
  const defaultColors = `
    border-primary dark:border-primary
    ${checked ? 'bg-primary dark:bg-primary' : 'bg-transparent'}
    group-hover:border-primary dark:group-hover:border-primary
    ${disabled ? 'group-hover:border-primary dark:group-hover:border-primary' : ''}
  `;

  const subtaskColors = `
    border-accent-pink dark:border-accent-pink
    ${checked ? 'bg-accent-pink dark:bg-accent-pink' : 'bg-transparent'}
    group-hover:border-accent-pink dark:group-hover:border-accent-pink
    ${disabled ? 'group-hover:border-accent-pink dark:group-hover:border-accent-pink' : ''} 
  `;

  // Determine the color set based on the variant
  const colorClasses = variant === 'subtask' ? subtaskColors : defaultColors;

  // Unique ID for accessibility
  const uniqueId = React.useId();
  const labelId = `checkbox-label-${uniqueId}`;

  return (
    // Use group for hover states on the container
    <label className={`flex items-start select-none group min-w-0 overflow-hidden transition-opacity duration-200 ${checked && !disabled ? 'opacity-50' : ''} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 peer focus:outline-none" // Peer is used for focus styles on the custom box
        aria-labelledby={labelId}
      />
      <span
        className={`
          relative inline-block w-5 h-5 mr-3 mt-0.5 flex-shrink-0
          border-2 rounded
          transition-all duration-300
          ${colorClasses}
          ${disabled ? 'opacity-50' : ''}
        `}
        aria-hidden="true" // Hide visual representation from screen readers
      >
        {/* Checkmark uses the white color variable */}
        {checked && (
          <span className="absolute top-[2px] left-[6px] w-1 h-2.5 border-r-2 border-b-2 border-secondary-white transform rotate-45" />
        )}
      </span>
      <span
        ref={textRef}
        id={labelId}
        className={`text-base text-gray-600 dark:text-gray-400 min-w-0 transition-all duration-300 ease-in-out ${shouldTruncate ? 'block truncate' : 'block break-all overflow-hidden'} ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;