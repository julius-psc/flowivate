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
}) => {
  return (
    <div className="mt-2 flex items-center gap-2 relative">
      {/* AI Button */}
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
          focus:outline-none focus:ring-4 focus:ring-secondary-white/50
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
        className={`flex-1 w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50 ${
          isAiPrimed ? "ring-1 ring-blue-500 dark:ring-blue-400" : ""
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
