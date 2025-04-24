"use client";

import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
  variant?: 'default' | 'subtask';
}

const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  variant = 'default'
}) => {

  // Updated blue palette - more cohesive and slightly softer
  const defaultColors = `
    border-[#4675D5] dark:border-[#5B8AE5]
    ${checked ? 'bg-[#3B68C2] dark:bg-[#4675D5]' : 'bg-transparent'}
    peer-focus:ring-[#4675D580] dark:peer-focus:ring-[#5B8AE580]
    group-hover:border-[#6B9AF0] dark:group-hover:border-[#7BACFF]
    ${disabled ? 'group-hover:border-[#4675D5] dark:group-hover:border-[#5B8AE5]' : ''}
  `;
  
  // Updated pink palette - more vibrant but balanced
  const subtaskColors = `
    border-[#E56BBF] dark:border-[#F07DD0]
    ${checked ? 'bg-[#D04FAF] dark:bg-[#E56BBF]' : 'bg-transparent'}
    peer-focus:ring-[#E56BBF80] dark:peer-focus:ring-[#F07DD080]
    group-hover:border-[#F383CF] dark:group-hover:border-[#FF9AE2]
    ${disabled ? 'group-hover:border-[#E56BBF] dark:group-hover:border-[#F07DD0]' : ''}
  `;

  return (
    <label className="flex items-center cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 peer"
        aria-labelledby={`checkbox-label-${label.replace(/\s+/g, '-')}`}
      />
      <span
        className={`
          relative inline-block w-5 h-5 mr-3 flex-shrink-0
          border-2 rounded
          transition-all duration-300
          peer-focus:ring-2
          ${variant === 'subtask' ? subtaskColors : defaultColors}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        aria-hidden="true"
      >
        {checked && (
          <span className="absolute top-[2px] left-[6px] w-1 h-2.5 border-r-2 border-b-2 border-white transform rotate-45" />
        )}
      </span>
      <span
        id={`checkbox-label-${label.replace(/\s+/g, '-')}`}
        className={`text-base text-[#777777] dark:text-gray-400 ${
          checked ? 'line-through text-gray-400 dark:text-gray-500' : ''
        }`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;