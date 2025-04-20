"use client";

import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string; // Kept original label prop
  disabled?: boolean;
  variant?: 'default' | 'subtask'; // Added variant prop
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  variant = 'default' // Default to 'default' (blue)
}) => {

  // Define color classes based on variant
  // Original blue colors
  const defaultColors = `
    border-[#3A6EC8] dark:border-[#4F8EDB]
    ${checked ? 'bg-[#2A4E8F] dark:bg-[#3A6EC8]' : 'bg-transparent'}
    peer-focus:ring-[#3a6ec865] dark:peer-focus:ring-[#4f8edb65]
    group-hover:border-[#5B8CEB] dark:group-hover:border-[#6FA5F5]
    ${disabled ? 'group-hover:border-[#3A6EC8] dark:group-hover:border-[#4F8EDB]' : ''}
  `;
  // Pink variant colors
  const subtaskColors = `
    border-pink-400 dark:border-pink-500
    ${checked ? 'bg-pink-500 dark:bg-pink-600' : 'bg-transparent'}
    peer-focus:ring-pink-300/70 dark:peer-focus:ring-pink-400/50
    group-hover:border-pink-500 dark:group-hover:border-pink-400
    ${disabled ? 'group-hover:border-pink-400 dark:group-hover:border-pink-500' : ''}
  `;

  return (
    // Original label wrapper structure
    <label className="flex items-center cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange} // Directly use the passed onChange handler
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 peer" // Original hidden input
        aria-labelledby={`checkbox-label-${label.replace(/\s+/g, '-')}`} // Link input to label text for accessibility
      />
      {/* Original visual span - applies variant colors */}
      <span
        className={`
          relative inline-block w-5 h-5 mr-3 flex-shrink-0
          border-2 rounded
          transition-all duration-300
          peer-focus:ring-2
          ${variant === 'subtask' ? subtaskColors : defaultColors}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-hidden="true" // Hide visual element from screen readers
      >
        {/* Original checkmark span */}
        {checked && (
          <span className="absolute top-[2px] left-[6px] w-1 h-2.5 border-r-2 border-b-2 border-white transform rotate-45" />
        )}
      </span>
      {/* Original label text span */}
      <span
        id={`checkbox-label-${label.replace(/\s+/g, '-')}`} // ID for aria-labelledby
        className={`text-base text-[#777777] dark:text-gray-400 ${
          checked ? 'line-through text-gray-400 dark:text-gray-500' : ''
        }`}
      >
        {label} {/* Use the label prop */}
      </span>
    </label>
  );
};

export default Checkbox;