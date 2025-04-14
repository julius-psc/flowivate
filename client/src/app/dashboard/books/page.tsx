import React from "react";
import BookLogger from "../../../components/dashboard/features/books/BookLogger";

export default function BookLogging() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Books</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        <div className="md:col-span-3">
          <BookLogger />
        </div>
      </div>
    </div>
  );
}