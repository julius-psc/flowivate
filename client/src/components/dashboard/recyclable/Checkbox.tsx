import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, disabled = false }) => {
  return (
    <label className="flex items-center cursor-pointer select-none group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0 peer"
      />
      <span
        className={`
          relative inline-block w-5 h-5 mr-3
          border-2 border-[#3A6EC8] rounded
          transition-all duration-300
          ${checked ? 'bg-[#2A4E8F]' : 'bg-transparent'}
          peer-focus:ring-2 peer-focus:ring-[#3a6ec865]
          group-hover:border-[#5B8CEB]
          ${disabled ? 'opacity-50 cursor-not-allowed group-hover:border-[#3A6EC8]' : ''}
        `}
      >
        {checked && (
          <span className="absolute top-[2px] left-[6px] w-1 h-2.5 border-r-2 border-b-2 border-white transform rotate-45" />
        )}
      </span>
      <span
        className={`text-base text-[#777777] ${
          checked ? 'line-through text-gray-400' : ''
        }`}
      >
        {label}
      </span>
    </label>
  );
};

export default Checkbox;