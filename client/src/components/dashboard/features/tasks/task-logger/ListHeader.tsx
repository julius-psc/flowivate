"use client";

import React, { useEffect, useRef } from "react";
import { IconTrash, IconLoader2, IconEdit, IconCheck, IconX } from "@tabler/icons-react";

interface ListHeaderProps {
  listName: string;
  headingColor: string;
  completionRatio: string;
  isPlaceholder: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  isRenaming?: boolean;
  renameValue?: string;
  onStartRename?: () => void;
  onRenameChange?: (value: string) => void;
  onRenameKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSaveRename?: () => void;
  onCancelRename?: () => void;
  onClearAll?: () => void;
  hasTasks?: boolean;
  isSpecialTheme: boolean;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  listName,
  headingColor,
  completionRatio,
  isPlaceholder,
  isDeleting,
  onDelete,
  isRenaming = false,
  renameValue = "",
  onStartRename,
  onRenameChange,
  onRenameKeyDown,
  onSaveRename,
  onCancelRename,
  onClearAll,
  hasTasks = false,
  isSpecialTheme,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const dividerColor = isSpecialTheme
    ? "border-white/20"
    : "border-slate-200 dark:border-zinc-700";
  const ratioBgColor = isSpecialTheme
    ? "bg-white/10 dark:bg-white/10"
    : "bg-slate-100/80 dark:bg-zinc-800/80";
  const ratioTextColor = isSpecialTheme
    ? "text-white/70 dark:text-white/70"
    : "text-slate-500 dark:text-slate-400";
  const deleteTextColor = isSpecialTheme
    ? "text-red-400 hover:text-red-300 dark:hover:text-red-300"
    : "text-red-500 hover:text-red-600 dark:hover:text-red-400";
  const clearTextColor = isSpecialTheme
    ? "text-white/50 hover:text-white/80"
    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300";

  return (
    <div className="flex items-center justify-between mb-3 gap-2">
      {isRenaming ? (
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => onRenameChange?.(e.target.value)}
          onKeyDown={onRenameKeyDown}
          onBlur={onSaveRename}
          maxLength={255}
          className={`min-w-0 w-full max-w-[18rem] bg-transparent border-b border-dashed ${dividerColor} px-0.5 pb-0.5 text-lg font-medium ${headingColor} focus:outline-none focus:border-primary-blue`}
          aria-label={`Rename ${listName}`}
        />
      ) : (
        <button
          type="button"
          onClick={onStartRename}
          onDoubleClick={onStartRename}
          disabled={isPlaceholder}
          className={`min-w-0 text-left rounded-md focus:outline-none focus:ring-2 focus:ring-primary-blue/40 disabled:cursor-default ${!isPlaceholder ? "cursor-text" : ""}`}
          title={!isPlaceholder ? `Rename "${listName}"` : undefined}
        >
          <h2 className={`text-lg font-medium truncate max-w-[18rem] ${headingColor}`}>
            {listName}
          </h2>
        </button>
      )}

      <div
        className={`flex-1 min-w-4 border-t ${dividerColor} border-dashed`}
      ></div>

      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs font-medium ${ratioTextColor} ${ratioBgColor} backdrop-blur-md px-2 py-1 rounded-full`}
        >
          {completionRatio}
        </span>

        {!isPlaceholder && (
          isRenaming ? (
            <div className="flex items-center gap-1">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={onSaveRename}
                title="Save list name"
                className={`${clearTextColor} transition-colors p-1`}
              >
                <IconCheck size={16} />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={onCancelRename}
                title="Cancel rename"
                className={`${clearTextColor} transition-colors p-1`}
              >
                <IconX size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onStartRename}
              title={`Rename list "${listName}"`}
              className={`${clearTextColor} transition-colors p-1 opacity-0 group-hover/list:opacity-100 focus-within:opacity-100`}
            >
              <IconEdit size={16} />
            </button>
          )
        )}

        {!isPlaceholder && onClearAll && hasTasks && (
          <button
            onClick={onClearAll}
            className={`${clearTextColor} text-xs transition-colors duration-200`}
          >
            Clear all
          </button>
        )}

        {!isPlaceholder && (
          <button
            onClick={onDelete}
            title={`Delete list "${listName}"`}
            className={`${deleteTextColor} transition-colors p-1 opacity-0 group-hover/list:opacity-100 focus-within:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <IconLoader2 size={16} className="animate-spin" />
            ) : (
              <IconTrash size={16} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ListHeader;
