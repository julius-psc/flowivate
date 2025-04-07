import React from "react";

const BookTracker = () => {
  const books = [
    { id: 1, title: "Book One", status: "not-started" },
    { id: 2, title: "Book Two", status: "in-progress" },
    { id: 3, title: "Book Three", status: "completed" },
  ];

  return (
    <div className="w-full h-full p-4 border border-gray-200 bg-white dark:bg-bg-dark rounded-lg">
      <h3>My Books</h3>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            {book.title} - {book.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BookTracker;