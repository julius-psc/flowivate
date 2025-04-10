import React from "react";
import { IconArrowUpRight, IconBook2 } from "@tabler/icons-react";

interface Book {
  id: number;
  title: string;
  status: "not-started" | "in-progress" | "completed";
}

const BookTracker: React.FC = () => {
  const books: Book[] = [
    { id: 1, title: "Book One", status: "not-started" },
    { id: 2, title: "Book Two", status: "in-progress" },
    { id: 3, title: "Book Three", status: "completed" },
  ];

  // Get last 3 books
  const recentBooks = books.slice(-3);

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

  return (
    <div className="w-full p-4 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Recent Books
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-1 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer">
          <span>New Book</span>
          <IconBook2 size={14} />
        </div>
      </div>
      <ul className="space-y-2">
        {recentBooks.map((book, index) => (
          <React.Fragment key={book.id}>
            <li className="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    book.status
                  )}`}
                ></span>
                <span className="truncate">{book.title}</span>
              </div>
              <IconArrowUpRight
                size={14}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
              />
            </li>
            {index < recentBooks.length - 1 && (
              <hr className="border-t border-gray-300 dark:border-gray-800" />
            )}
          </React.Fragment>
        ))}
      </ul>
    </div>
  );
};

export default BookTracker;