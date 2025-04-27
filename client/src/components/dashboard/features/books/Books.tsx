"use client";

import React, { useEffect, useState } from "react";
import { IconArrowUpRight, IconBook2 } from "@tabler/icons-react";
import Link from "next/link";

interface Book {
  _id: string;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  coverUrl?: string;
  dateAdded: string;
}

// --- New Skeleton Loader Component ---
const BooksSkeleton = () => {
  const numberOfPlaceholderBooks = 4; // Number of skeleton rows to match the display limit

  return (
    // Match outer container style from Books component
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>{" "}
        {/* "BOOKS" placeholder */}
        <div className="h-7 w-24 bg-gray-300 dark:bg-zinc-600 rounded-md"></div>{" "}
        {/* "New Book" button placeholder */}
      </div>

      {/* Book List Skeleton */}
      {/* Use flex-grow to ensure content fills space and pushes footer down */}
      <div className="space-y-2 flex-grow">
        {[...Array(numberOfPlaceholderBooks)].map((_, index) => (
          <React.Fragment key={index}>
            {/* Mimic list item structure and spacing */}
            <div className="flex items-center justify-between py-1.5">
              {" "}
              {/* Adjusted padding slightly */}
              <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
                {" "}
                {/* Added min-w-0 for flex truncation */}
                <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-zinc-600 rounded-full flex-shrink-0"></div>{" "}
                {/* Status circle placeholder */}
                <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-4/5"></div>{" "}
                {/* Book title placeholder */}
              </div>
              <div className="w-4 h-4 bg-gray-300 dark:bg-zinc-600 rounded flex-shrink-0"></div>{" "}
              {/* Arrow Icon placeholder */}
            </div>
            {/* HR placeholder, skip after last item */}
            {index < numberOfPlaceholderBooks - 1 && (
              <div className="h-px bg-gray-200 dark:bg-zinc-700/50"></div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Footer Link Skeleton */}
      <div className="mt-3 text-center flex-shrink-0">
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded mx-auto"></div>{" "}
        {/* "View all books" placeholder */}
      </div>
    </div>
  );
};

// --- Main Books Component ---
const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      // Reset states for potential refetches
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/features/books"); // Ensure this endpoint is correct

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})); // Try to get error details
          throw new Error(
            errorData.message || `Failed to fetch books (${response.status})`
          );
        }

        const data = await response.json();
        setBooks(data.books || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        setError(`Error loading books: ${errorMessage}`);
        console.error("Fetch Books Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Get last 4 books (or fewer if less than 4 exist)
  const recentBooks = books.slice(0, 4);

  const getStatusColor = (status: Book["status"]) => {
    switch (status) {
      case "not-started":
        return "bg-red-500";
      case "in-progress":
        return "bg-orange-500";
      case "completed":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: Book["status"]) => {
    switch (status) {
      case "not-started":
        return "Not Started";
      case "in-progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  // --- Loading State --- (Uses new Skeleton)
  if (loading) {
    return <BooksSkeleton />;
  }

  // --- Error State ---
  if (error) {
    return (
      // Use consistent component container for error display
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full items-center justify-center">
        <p className="text-center text-red-500 dark:text-red-400 text-sm">
          {error}
        </p>
        {/* Optional: Add a retry button here */}
      </div>
    );
  }

  // --- Actual Component Render ---
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          BOOKS
        </h1>
        {/* Ensure Link usage is correct for your Next.js version/app router */}
        <Link href="/dashboard/books" passHref legacyBehavior>
          <a className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 transition-all">
            <span>New Book</span>
            <IconBook2 size={14} />
          </a>
        </Link>
      </div>

      {/* Book List or Empty Message */}
      {/* Use flex-grow to push footer down */}
      <div className="flex-grow">
        {recentBooks.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              No books added yet
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {recentBooks.map((book, index) => (
              <React.Fragment key={book._id}>
                <li className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200 py-1.5">
                  {" "}
                  {/* Added padding */}
                  <div className="flex items-center gap-2 flex-1 min-w-0 mr-4">
                    {" "}
                    {/* Added min-w-0 */}
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${getStatusColor(
                        book.status
                      )} flex-shrink-0`} // Added flex-shrink-0
                      title={getStatusLabel(book.status)}
                    ></span>
                    <span className="truncate" title={book.title}>
                      {book.title}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/books/${book._id}`}
                    passHref
                    legacyBehavior
                  >
                    <a title={`View details for ${book.title}`}>
                      <IconArrowUpRight
                        size={16} // Slightly larger for easier click
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors flex-shrink-0"
                      />
                    </a>
                  </Link>
                </li>
                {/* Divider */}
                {index < recentBooks.length - 1 && (
                  <hr className="border-t border-gray-200 dark:border-zinc-700/50" /> // Adjusted color
                )}
              </React.Fragment>
            ))}
          </ul>
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-3 text-center flex-shrink-0">
        <Link
          href="/dashboard/books"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          View all books
        </Link>
      </div>
    </div>
  );
};

export default Books;