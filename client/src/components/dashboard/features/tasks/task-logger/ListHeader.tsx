"use client";

import React from "react";
import { IconTrash, IconLoader2 } from "@tabler/icons-react";

interface ListHeaderProps {
  listName: string;
  headingColor: string;
  completionRatio: string;
  isPlaceholder: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  isSpecialTheme: boolean;
}

const ListHeader: React.FC<ListHeaderProps> = ({
  listName,
  headingColor,
  completionRatio,
  isPlaceholder,
  isDeleting,
  onDelete,
  isSpecialTheme, // Destructure prop
}) => {
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

  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className={`text-lg font-medium ${headingColor}`}>{listName}</h2>

      <div
        className={`flex-1 mx-3 border-t ${dividerColor} border-dashed`}
      ></div>

      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-medium ${ratioTextColor} ${ratioBgColor} backdrop-blur-md px-2 py-1 rounded-full`}
        >
          {completionRatio}
        </span>

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