"use client";

import React, { useState } from "react";
import { IconBook2, IconPlus, IconStarFilled, IconX, IconSearch, IconEdit, IconTrash } from "@tabler/icons-react";

interface Book {
  id: string;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  rating?: number;
  genre?: string;
  notes?: string;
  coverUrl?: string;
  dateAdded: Date;
  dateCompleted?: Date;
}

const BookLogger: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([
    { 
      id: "1", 
      title: "Atomic Habits", 
      author: "James Clear",
      status: "completed", 
      rating: 5,
      genre: "Self-Help",
      notes: "Great book about building good habits and breaking bad ones.",
      dateAdded: new Date('2023-12-10'),
      dateCompleted: new Date('2024-01-05')
    },
    { 
      id: "2", 
      title: "The Psychology of Money", 
      author: "Morgan Housel",
      status: "in-progress", 
      genre: "Finance",
      notes: "Interesting perspectives on how people think about money.",
      dateAdded: new Date('2024-01-15') 
    },
    { 
      id: "3", 
      title: "Deep Work", 
      author: "Cal Newport",
      status: "not-started", 
      genre: "Productivity",
      dateAdded: new Date('2024-02-20') 
    },
    { 
      id: "4", 
      title: "Designing Data-Intensive Applications", 
      author: "Martin Kleppmann",
      status: "not-started", 
      genre: "Technology",
      dateAdded: new Date('2024-03-05') 
    }
  ]);
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // For creating/editing a book
  const [formData, setFormData] = useState<Partial<Book>>({
    title: "",
    author: "",
    status: "not-started",
    genre: "",
    notes: "",
    rating: 0
  });

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

  const handleAddNewBook = () => {
    setSelectedBook(null);
    setIsEditing(true);
    setFormData({
      title: "",
      author: "",
      status: "not-started",
      genre: "",
      notes: "",
      rating: 0
    });
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(false);
  };

  const handleEditBook = () => {
    if (selectedBook) {
      setFormData(selectedBook);
      setIsEditing(true);
    }
  };

  const handleSaveBook = () => {
    if (isEditing) {
      if (selectedBook) {
        // Update existing book
        setBooks(books.map(book => 
          book.id === selectedBook.id ? { ...book, ...formData } : book
        ));
      } else {
        // Create new book
        const newBook: Book = {
          id: Date.now().toString(), // Simple ID generation
          title: formData.title || "Untitled Book",
          author: formData.author || "Unknown Author",
          status: formData.status || "not-started",
          rating: formData.rating,
          genre: formData.genre,
          notes: formData.notes,
          dateAdded: new Date()
        };
        
        setBooks([...books, newBook]);
        setSelectedBook(newBook);
      }
      setIsEditing(false);
    }
  };

  const handleDeleteBook = () => {
    if (selectedBook) {
      setBooks(books.filter(book => book.id !== selectedBook.id));
      setSelectedBook(null);
      setIsEditing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRatingChange = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full">
      {/* Left Panel - Book List */}
      <div className="md:w-1/3 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              My Books
            </h3>
            <button 
              onClick={handleAddNewBook}
              className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md dark:hover:text-gray-100"
            >
              <IconPlus size={14} />
              <span>Add Book</span>
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <IconSearch size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredBooks.map((book) => (
              <li 
                key={book.id}
                onClick={() => handleSelectBook(book)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedBook?.id === book.id ? 'bg-gray-100 dark:bg-gray-800/70' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(book.status)}`} title={getStatusLabel(book.status)}></span>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{book.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{book.author}</p>
                  </div>
                  {book.rating && (
                    <div className="flex items-center">
                      <span className="text-amber-500 text-sm mr-1">{book.rating}</span>
                      <IconStarFilled size={14} className="text-amber-500" />
                    </div>
                  )}
                </div>
                {book.genre && (
                  <span className="inline-block text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded mt-2">
                    {book.genre}
                  </span>
                )}
              </li>
            ))}
            {filteredBooks.length === 0 && (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                No books found
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Right Panel - Book Details / Edit Form */}
      <div className="md:w-2/3 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg p-4">
        {selectedBook && !isEditing ? (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedBook.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">by {selectedBook.author}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditBook}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <IconEdit size={18} className="text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={handleDeleteBook}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <IconTrash size={18} className="text-red-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-3 h-3 rounded-full ${getStatusColor(selectedBook.status)}`}></span>
                  <span className="text-gray-900 dark:text-gray-100">{getStatusLabel(selectedBook.status)}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rating</p>
                <div className="flex items-center gap-1 mt-1">
                  {selectedBook.rating ? (
                    <>
                      <span className="text-gray-900 dark:text-gray-100">{selectedBook.rating}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <IconStarFilled
                            key={i}
                            size={16}
                            className={i < (selectedBook.rating || 0) ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">Not rated</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Genre</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">{selectedBook.genre || "Not specified"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Added</p>
                <p className="text-gray-900 dark:text-gray-100 mt-1">
                  {selectedBook.dateAdded.toLocaleDateString()}
                </p>
              </div>
            </div>

            {selectedBook.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{selectedBook.notes}</p>
              </div>
            )}
          </div>
        ) : isEditing ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {selectedBook ? "Edit Book" : "Add New Book"}
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  if (!selectedBook) setSelectedBook(null);
                }}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconX size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Book title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author</label>
                <input
                  type="text"
                  name="author"
                  value={formData.author || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Author name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || "not-started"}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genre</label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Fiction, Non-fiction, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingChange(rating)}
                      className="focus:outline-none"
                    >
                      <IconStarFilled
                        size={24}
                        className={rating <= (formData.rating || 0) ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Your thoughts about this book..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveBook}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  Save Book
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <IconBook2 size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Select a book from the list or add a new one</p>
            <button
              onClick={handleAddNewBook}
              className="flex items-center gap-1 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            >
              <IconPlus size={16} />
              <span>Add Book</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLogger;