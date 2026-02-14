"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { priorityLevels } from "./priorityLevels";

interface PriorityDropdownProps {
  taskId: string;
  listId: string;
  currentPriority: number;
  onSetPriority: (listId: string, taskId: string, priority: number) => void;
  onClose: () => void;
}

const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  taskId,
  listId,
  currentPriority,
  onSetPriority,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    // Use a timeout to avoid the opening click from immediately closing
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [handleClose]);

  return (
    <div
      ref={dropdownRef}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute left-full top-0 ml-2 w-40 z-50 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-700/60 rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20 py-1.5 animate-in fade-in slide-in-from-left-1 duration-150"
      style={{ transformOrigin: "top left" }}
    >
      {priorityLevels.map(({ level, label, icon: Icon, color }) => (
        <button
          key={level}
          onClick={(e) => {
            e.stopPropagation();
            onSetPriority(listId, taskId, level);
            handleClose();
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors ${currentPriority === level
            ? "bg-slate-50/80 dark:bg-zinc-700/80 font-semibold"
            : ""
            }`}
        >
          <Icon
            size={16}
            className={level === 0 ? "opacity-50 text-slate-400" : color}
          />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default PriorityDropdown;
