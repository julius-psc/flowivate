import React, { useState } from "react";

interface Book {
  id: number;
  title: string;
  status: "not-started" | "in-progress" | "completed";
  notes: string;
}

const BookTracker: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([
    { id: 1, title: "Book One", status: "not-started", notes: "" },
    { id: 2, title: "Book Two", status: "in-progress", notes: "" },
    { id: 3, title: "Book Three", status: "completed", notes: "" },
  ]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const statusColors: Record<Book["status"], string> = {
    "not-started": "bg-red-500",
    "in-progress": "bg-orange-500",
    "completed": "bg-green-500",
  };

  const MiniBookList: React.FC = () => (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-200">
        My Books
      </h3>
      <ul className="space-y-2">
        {books.map((book) => (
          <li
            key={book.id}
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded"
            onClick={() => setSelectedBook(book)}
          >
            <div
              className={`w-3 h-3 rounded-full mr-2 ${statusColors[book.status]}`}
            />
            <span className="text-gray-800 dark:text-gray-200">
              {book.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  const DetailedBookView: React.FC = () => {
    if (!selectedBook) return null;

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setBooks(books.map((b) =>
        b.id === selectedBook.id ? { ...b, notes: e.target.value } : b
      ));
    };

    const handleStatusChange = (status: Book["status"]) => {
      setBooks(books.map((b) =>
        b.id === selectedBook.id ? { ...b, status } : b
      ));
    };

    return (
      <div className="w-96 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex items-center mb-4">
          <button
            onClick={() => setSelectedBook(null)}
            className="mr-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            ← Back
          </button>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-200">
            {selectedBook.title}
          </h2>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status:</p>
          <div className="flex gap-2">
            {Object.entries(statusColors).map(([status, color]) => (
              <button
                key={status}
                className={`w-6 h-6 rounded-full ${color} ${
                  selectedBook.status === status 
                    ? "ring-2 ring-offset-2 ring-gray-400" 
                    : ""
                }`}
                onClick={() => handleStatusChange(status as Book["status"])}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Notes:</p>
          <textarea
            className="w-full h-32 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedBook.notes}
            onChange={handleNotesChange}
            placeholder="Write your thoughts about the book..."
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <MiniBookList />
      <DetailedBookView />
    </div>
  );
};

export default BookTracker;