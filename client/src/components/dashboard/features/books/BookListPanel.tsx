"use client";

import React from "react";
import {
  IconSearch,
  IconUser,
  IconTag,
  IconStarFilled,
  IconChevronRight,
} from "@tabler/icons-react";
import {
  Book,
  getStatusLabel,
  getStatusColor,
} from "@/components/dashboard/features/books/bookUtils";

interface BookListPanelProps {
  books: Book[];
  loading: boolean;
  selectedBook: Book | null;
  searchTerm: string;
  statusFilter: string;
  onSelectBook: (book: Book) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFilterChange: (status: string) => void;
  getBookCountByStatus: (status: string) => number;
  isSpecialTheme: boolean;
}

export const BookListPanel: React.FC<BookListPanelProps> = ({
  books,
  loading,
  selectedBook,
  searchTerm,
  statusFilter,
  onSelectBook,
  onSearchChange,
  onFilterChange,
  getBookCountByStatus,
  isSpecialTheme,
}) => {
  const panelBg = isSpecialTheme ? "bg-zinc-900/50" : "bg-white/80 dark:bg-zinc-900/80";
  const panelBorder = isSpecialTheme ? "border-zinc-800/50" : "border-gray-200 dark:border-gray-800";
  const searchInputBg = isSpecialTheme ? "bg-white/5 dark:bg-white/5 border-white/10 focus:ring-white/20" : "bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 focus:ring-gray-500 dark:focus:ring-gray-700";
  const searchInputText = isSpecialTheme ? "text-white/90 placeholder:text-white/40" : "text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400";
  const searchIconColor = isSpecialTheme ? "text-white/40" : "text-gray-500 dark:text-gray-400";

  const filterButtonActiveBg = isSpecialTheme ? "bg-white text-zinc-900" : "bg-secondary-black dark:bg-white text-white dark:text-secondary-black";
  const filterButtonInactiveBg = isSpecialTheme ? "bg-white/10 text-white/70 hover:bg-white/20" : "bg-gray-200 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500/20";
  const filterCountActiveBg = isSpecialTheme ? "bg-zinc-700 text-gray-100" : "bg-gray-300 dark:bg-gray-700/80 text-gray-700 dark:text-gray-100";
  const filterCountInactiveBg = isSpecialTheme ? "bg-white/10 text-white/70" : "bg-white dark:bg-gray-500/10 text-gray-700 dark:text-gray-300";

  const listItemHoverBg = isSpecialTheme ? "hover:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-white/5";
  const listItemSelectedBg = isSpecialTheme ? "bg-white/15" : "bg-gray-100 dark:bg-gray-500/10";
  const listItemText = isSpecialTheme ? "text-white" : "text-secondary-black dark:text-secondary-white";
  const listItemSubtleText = isSpecialTheme ? "text-white/60" : "text-gray-500 dark:text-gray-400";

  return (
    // Added rounded-l-xl for left corners
    <div className={`w-1/3 flex flex-col border-r ${panelBorder} ${panelBg} backdrop-blur-md rounded-l-xl`}>
      <div className={`p-4 border-b ${panelBorder}`}>
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search books or authors..."
            value={searchTerm}
            onChange={onSearchChange}
            className={`w-full pl-10 pr-4 py-2 rounded-md focus:outline-none focus:ring-2 ${searchInputBg} ${searchInputText}`}
          />
          <IconSearch
            size={18}
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${searchIconColor}`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["all", "not-started", "in-progress", "completed"].map(
            (status) => (
              <button
                key={status}
                onClick={() => onFilterChange(status)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? filterButtonActiveBg
                    : filterButtonInactiveBg
                }`}
              >
                {status === "all"
                  ? "All"
                  : getStatusLabel(status as Book["status"])}

                <span className={`ml-2 text-xs rounded-full px-2 py-0.5 transition-colors ${
                  statusFilter === status
                    ? filterCountActiveBg
                    : filterCountInactiveBg
                }`}>
                  {getBookCountByStatus(status)}
                </span>
              </button>
            )
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className={`h-8 w-8 border-2 ${isSpecialTheme ? 'border-white/50' : 'border-gray-500 dark:border-gray-400'} border-t-transparent rounded-full animate-spin`}></div>
          </div>
        ) : books.length > 0 ? (
          <ul>
            {books.map((book) => (
              <li
                key={book._id}
                onClick={() => onSelectBook(book)}
                // Use rounded-md for inner items
                className={`p-4 rounded-md cursor-pointer mb-2 transition-colors ${
                  selectedBook?._id === book._id
                    ? listItemSelectedBg
                    : listItemHoverBg
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className={`font-medium line-clamp-1 ${listItemText}`}>
                      {book.title}
                    </h4>
                    <div className={`flex items-center text-sm mt-1 ${listItemSubtleText}`}>
                      <IconUser size={14} className="mr-1 flex-shrink-0" />
                      <span className="line-clamp-1">{book.author}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full text-white ${getStatusColor(
                          book.status
                        )}`}
                      >
                        {getStatusLabel(book.status)}
                      </span>
                      {book.genre && (
                        <span className={`flex items-center text-xs px-2 py-0.5 rounded-md ${isSpecialTheme ? 'text-white/70 bg-white/5' : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700/50'}`}>
                          <IconTag size={12} className="mr-1" />
                          {book.genre}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 ml-2">
                    {book.rating ? (
                      <div className="flex items-center px-2 py-1">
                        <span className={`text-sm ${listItemSubtleText}`}>
                          {book.rating}/5
                        </span>
                        <IconStarFilled
                          size={14}
                          className="text-yellow-500 ml-1"
                        />
                      </div>
                    ) : (
                      <div className="h-7"></div>
                    )}
                    <IconChevronRight
                      size={18}
                      className={`mt-4 ${listItemSubtleText}`}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className={`flex flex-col items-center justify-center h-full ${listItemSubtleText}`}>
            <IconSearch size={24} className="mb-2" />
            <p>No books found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};