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

const Books: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/features/books");
        
        if (!response.ok) {
          throw new Error("Failed to fetch books");
        }
        
        const data = await response.json();
        setBooks(data.books || []);
        setError(null);
      } catch (err) {
        setError("Error loading books");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  // Get last 4 books
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

  if (loading) {
    return (
      <div className="w-full p-4 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg">
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg">
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
    <div className="flex justify-between items-center mb-4 flex-shrink-0">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">BOOKS</h1>
      <Link href="/dashboard/books">
          <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer">
            <span>New Book</span>
            <IconBook2 size={14} />
          </div>
        </Link>
    </div>
      
      {recentBooks.length === 0 ? (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
          No books added yet
        </div>
      ) : (
        <ul className="space-y-2">
          {recentBooks.map((book, index) => (
            <React.Fragment key={book._id}>
              <li className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${getStatusColor(book.status)}`}
                    title={getStatusLabel(book.status)}
                  ></span>
                  <span className="truncate max-w-[180px]" title={book.title}>
                    {book.title}
                  </span>
                </div>
                <Link href={`/dashboard/books/${book._id}`}>
                  <IconArrowUpRight
                    size={14}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
                  />
                </Link>
              </li>
              {index < recentBooks.length - 1 && (
                <hr className="border-t border-gray-300 dark:border-gray-800" />
              )}
            </React.Fragment>
          ))}
        </ul>
      )}
      
      <div className="mt-3 text-center">
        <Link href="/dashboard/books" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          View all books
        </Link>
      </div>
    </div>
  );
};

export default Books;