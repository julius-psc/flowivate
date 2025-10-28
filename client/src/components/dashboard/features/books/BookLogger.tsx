"use client";

import React, { useState, useEffect } from "react";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/hooks/useGlobalStore";
import {
  Book,
} from "@/components/dashboard/features/books/bookUtils";
import { BookListPanel } from "@/components/dashboard/features/books/BookListPanel";
import { BookDisplayPanel } from "@/components/dashboard/features/books/BookDisplayPanel";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";

const BookLogger: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);

  const { theme } = useTheme();
  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);

  useEffect(() => {
    setIsMounted(true);
    fetchBooks();
  }, []);

  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/features/books");
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      const data = await response.json();
      setBooks(data.books);
    } catch (err: unknown) {
        let message = "Error loading books. Please try again.";
        if (err instanceof Error) message = err.message;
        toast.error(message);
        console.error("Fetch books error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewBook = () => {
    setSelectedBook(null);
    setIsEditing(true);
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(false);
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (!selectedBook?._id) { // Clear selection if cancelling a new book
      setSelectedBook(null);
    }
  };

  const handleSaveBook = async (
    formData: Partial<Book>,
    notesContent: string
  ) => {
    if (!formData.title?.trim() || !formData.author?.trim()) {
      toast.error("Title and author are required.");
      return;
    }
    try {
      const url = selectedBook?._id
        ? `/api/features/books/${selectedBook._id}`
        : "/api/features/books";
      const method = selectedBook?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          title: formData.title?.trim(),
          author: formData.author?.trim(),
          genre: formData.genre?.trim() || null,
          notes: notesContent,
          rating: formData.rating || null,
          dateCompleted:
            formData.status === "completed" && !formData.dateCompleted
              ? new Date().toISOString()
              : formData.dateCompleted || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `Failed to ${selectedBook?._id ? "update" : "add"} book`
        );
      }

      toast.success(`Book ${selectedBook?._id ? "updated" : "added"} successfully!`);
      triggerLumoEvent("BOOK_LOGGED");

      if (selectedBook?._id) {
        setBooks(
          books.map((book) =>
            book._id === selectedBook._id ? data.book : book
          )
        );
      } else {
        setBooks([...books, data.book]);
      }
      setSelectedBook(data.book);
      setIsEditing(false);
    } catch (err: unknown) {
        let message = "Error saving book. Please try again.";
        if (err instanceof Error) message = err.message;
        toast.error(message);
        console.error("Save book error:", err);
    }
  };

  const handleDeleteBook = async (bookToDelete: Book) => {
    if (!bookToDelete) return;
    if (
      !window.confirm(
        `Delete "${bookToDelete.title}" by ${bookToDelete.author}?`
      )
    )
      return;

    try {
      const response = await fetch(`/api/features/books/${bookToDelete._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete book");
      }

      toast.success("Book deleted successfully!");
      setBooks(books.filter((book) => book._id !== bookToDelete._id));
      setSelectedBook(null);
      setIsEditing(false);
    } catch (err: unknown) {
        let message = "Error deleting book. Please try again.";
        if (err instanceof Error) message = err.message;
        toast.error(message);
        console.error("Delete book error:", err);
    }
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getBookCountByStatus = (status: string) => {
    if (status === "all") return books.length;
    return books.filter((book) => book.status === status).length;
  };

  // Theme-aware styles
  const addButtonBg = isSpecialTheme ? "bg-white/90 hover:bg-white" : "bg-secondary-black dark:bg-white hover:opacity-90";
  const addButtonText = isSpecialTheme ? "text-zinc-900" : "text-white dark:text-secondary-black";
  const mainContainerBorder = isSpecialTheme ? 'border-zinc-800/50' : 'border-gray-200 dark:border-gray-800';

  // Prevent rendering until mounted to avoid hydration errors
  if (!isMounted) {
     return <div className="flex flex-col h-full w-full items-center justify-center">Loading...</div>; // Or a proper skeleton
  }

  return (
    <div className={`flex flex-col h-full w-full ${isSpecialTheme ? 'text-white' : 'text-secondary-black dark:text-secondary-white'}`}>
      <div className="px-4 py-4">
        <div className="max-w-screen-lg mx-auto flex justify-end items-center">
          <button
            onClick={handleAddNewBook}
            className={`flex items-center space-x-1 px-3 py-1.5 ${addButtonBg} ${addButtonText} rounded-md disabled:opacity-50 transition-colors`}
            disabled={loading}
          >
            <IconPlus size={18} />
            <span className="text-sm font-medium">Add Book</span>
          </button>
        </div>
      </div>

      <div className={`flex flex-1 overflow-hidden max-w-screen-lg mx-auto w-full ${mainContainerBorder}`}>
        <BookListPanel
          books={filteredBooks}
          loading={loading}
          selectedBook={selectedBook}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSelectBook={handleSelectBook}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onFilterChange={setStatusFilter}
          getBookCountByStatus={getBookCountByStatus}
          isSpecialTheme={isSpecialTheme} // Pass prop
        />
        <BookDisplayPanel
          selectedBook={selectedBook}
          isEditing={isEditing}
          onSave={handleSaveBook}
          onDelete={handleDeleteBook}
          onEdit={handleEditBook}
          onCancel={handleCancelEdit}
          onAddNew={handleAddNewBook}
          isSpecialTheme={isSpecialTheme} // Pass prop
        />
      </div>
    </div>
  );
};

export default BookLogger;