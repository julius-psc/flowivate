"use client";

import React from "react";
import { IconSparkles, IconLoader2 } from "@tabler/icons-react";

interface AddTaskInputProps {
  listId: string;
  inputRef: (el: HTMLInputElement | null) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isAiPrimed: boolean;
  setAiPrimedListId: (listId: string | null) => void;
  isAiLoading: boolean;
  handleKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string
  ) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement>, listId: string) => void;
  onAiClick: () => void;
  isDisabled: boolean;
  isSpecialTheme: boolean; // <-- Added theme prop
}

const AddTaskInput: React.FC<AddTaskInputProps> = ({
  listId,
  inputRef,
  inputValue,
  setInputValue,
  isAiPrimed,
  setAiPrimedListId,
  isAiLoading,
  handleKeyDown,
  handleBlur,
  onAiClick,
  isDisabled,
  isSpecialTheme, // <-- Destructure theme prop
}) => {
  // Theme-aware styles
  const inputBg = isSpecialTheme
    ? "bg-black/10 dark:bg-black/10" // Subtle dark input bg
    : "bg-slate-50/90 dark:bg-zinc-800/90";
  const inputBorder = isSpecialTheme
    ? "border-white/15 dark:border-white/15" // Lighter border
    : "border-slate-200/50 dark:border-zinc-700/50";
  const inputText = isSpecialTheme
    ? "text-white/90 dark:text-white/90" // Lighter text
    : "text-slate-900 dark:text-slate-200";
  const inputFocusRing = isSpecialTheme
    ? "focus:ring-white/50 dark:focus:ring-white/50" // Lighter focus ring
    : "focus:ring-blue-500 dark:focus:ring-blue-400";
   const placeholderText = isSpecialTheme
    ? "placeholder:text-white/40" // Lighter placeholder
    : "placeholder:text-slate-400 dark:placeholder:text-zinc-500"; // Default placeholder


  return (
    <div className="mt-2 flex items-center gap-2 relative">
      {/* AI Button - Keeping primary color as it should contrast well */}
      <button
        onClick={() => {
          setAiPrimedListId(listId);
          onAiClick();
        }}
        title="AI Task Breakdown"
        className={`
          relative flex items-center justify-center
          w-10 h-10 rounded-full
          bg-primary
          text-secondary-white
          transform transition duration-300 ease-out
          hover:scale-110
          focus:outline-none focus:ring-4 focus:ring-primary/30 dark:focus:ring-primary/50
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        disabled={isDisabled || isAiLoading}
      >
        {isAiLoading ? (
          <IconLoader2 size={16} className="animate-spin" />
        ) : (
          <IconSparkles size={16} />
        )}
      </button>

      {/* Task Input */}
      <input
        ref={inputRef}
        id={`task-input-${listId}`}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, listId)}
        onBlur={(e) => handleBlur(e, listId)}
        className={`flex-1 w-full p-2 ${inputBg} backdrop-blur-md rounded-lg ${inputBorder} focus:outline-none focus:ring-1 ${inputFocusRing} text-sm ${inputText} ${placeholderText} transition-all duration-200 disabled:opacity-50 ${
          isAiPrimed ? "ring-1 ring-blue-500 dark:ring-blue-400" : "" // AI Primed ring overrides focus ring intentionally
        }`}
        placeholder={
          isAiPrimed ? "Enter goal for AI breakdown..." : "New task..."
        }
        disabled={isDisabled || isAiLoading}
        autoFocus
      />
    </div>
  );
};

export default AddTaskInput;