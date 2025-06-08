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
}

const ListHeader: React.FC<ListHeaderProps> = ({
  listName,
  headingColor,
  completionRatio,
  isPlaceholder,
  isDeleting,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      {/* List Name */}
      <h2 className={`text-lg font-medium ${headingColor}`}>
        {listName}
      </h2>

      {/* Divider */}
      <div className="flex-1 mx-3 border-t border-slate-200 dark:border-zinc-700 border-dashed"></div>

      {/* Completion + Delete */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
          {completionRatio}
        </span>

        {/* Delete button */}
        {!isPlaceholder && (
          <button
            onClick={onDelete}
            title={`Delete list "${listName}"`}
            className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover/list:opacity-100 focus-within:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
