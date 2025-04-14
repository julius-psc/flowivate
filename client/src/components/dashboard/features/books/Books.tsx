import React from "react";
import { IconArrowUpRight, IconBook2 } from "@tabler/icons-react";
import Link from "next/link";

interface Book {
  id: string;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  coverUrl?: string;
  dateAdded: Date;
}

const Books: React.FC = () => {
  // Mock data - in a real app, you would fetch this from your MongoDB
  const books: Book[] = [
    { 
      id: "1", 
      title: "Atomic Habits", 
      author: "James Clear",
      status: "completed", 
      dateAdded: new Date('2023-12-10') 
    },
    { 
      id: "2", 
      title: "The Psychology of Money", 
      author: "Morgan Housel",
      status: "in-progress", 
      dateAdded: new Date('2024-01-15') 
    },
    { 
      id: "3", 
      title: "Deep Work", 
      author: "Cal Newport",
      status: "not-started", 
      dateAdded: new Date('2024-02-20') 
    },
    { 
      id: "4", 
      title: "Designing Data-Intensive Applications", 
      author: "Martin Kleppmann",
      status: "not-started", 
      dateAdded: new Date('2024-03-05') 
    }
  ];

  // Get last 4 books
  const recentBooks = books.slice(-4);

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

  return (
    <div className="w-full p-4 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Recent Books
        </h3>
        <Link href="/dashboard/books/new">
          <div className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer">
            <span>New Book</span>
            <IconBook2 size={14} />
          </div>
        </Link>
      </div>
      <ul className="space-y-2">
        {recentBooks.map((book, index) => (
          <React.Fragment key={book.id}>
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
              <Link href={`/dashboard/books/${book.id}`}>
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
      <div className="mt-3 text-center">
        <Link href="/dashboard/books" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          View all books
        </Link>
      </div>
    </div>
  );
};

export default Books;