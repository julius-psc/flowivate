"use client";

import React, { useState, useEffect } from "react";
import {
  IconBook2,
  IconPlus,
  IconStarFilled,
  IconX,
  IconSearch,
  IconEdit,
  IconTrash,
  IconChevronRight,
  IconCalendar,
  IconBookmark,
  IconUser,
  IconTag,
} from "@tabler/icons-react";
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import { SlashCommands } from "../../recyclable/markdown/SlashCommands";
import { ContextMenu } from "../../recyclable/markdown/ContextMenu";
import { toast } from "sonner"; // Import Sonner toast

interface Book {
  _id: string;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  rating?: number;
  genre?: string;
  notes?: string;
  coverUrl?: string;
  dateAdded: string | Date;
  dateCompleted?: string | Date;
}

const lowlight = createLowlight();
lowlight.register("typescript", typescript);
lowlight.register("javascript", javascript);

const BookLogger: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null); // REMOVE error state

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [formData, setFormData] = useState<Partial<Book>>({
    title: "",
    author: "",
    status: "not-started",
    genre: "",
    notes: "",
    rating: 0,
  });

  const slashCommandItems = [
    {
      title: "Heading 1",
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      },
      icon: <span className="text-xl font-bold">H1</span>,
    },
    {
      title: "Heading 2",
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
      icon: <span className="text-lg font-bold">H2</span>,
    },
    {
      title: "Heading 3",
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      },
      icon: <span className="text-base font-bold">H3</span>,
    },
    {
      title: "Bullet List",
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleBulletList().run();
      },
      icon: <span className="text-sm">•</span>,
    },
    {
      title: "Numbered List",
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleOrderedList().run();
      },
      icon: <span className="text-sm">1.</span>,
    },
    {
      title: "Paragraph",
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().setParagraph().run();
      },
      icon: <span className="text-sm">P</span>,
    },
    {
      title: "Emoji",
      command: ({}: { editor: Editor }) => {},
      icon: <span>😊</span>,
    },
  ];

  const notesEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading")
            return `Heading ${node.attrs.level}`;
          if (node.type.name === "bulletList") return "List item";
          if (node.type.name === "orderedList") return "List item";
          return "Type $ for commands or start writing your notes...";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Highlight,
      CodeBlockLowlight.configure({ lowlight }),
      SlashCommands(slashCommandItems),
    ],
    content: formData.notes || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData((prev) => ({ ...prev, notes: html }));
    },
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-[200px] w-full text-secondary-black dark:text-secondary-white",
      },
    },
    injectCSS: false,
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (notesEditor && isEditing) {
      notesEditor.commands.setContent(formData.notes || "");
    }
  }, [isEditing, formData.notes, notesEditor]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // setError(null); // REMOVE
      const response = await fetch("/api/features/books");
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      const data = await response.json();
      setBooks(data.books);
    } catch (err) {
      // setError("Error loading books. Please try again."); // REMOVE
      toast.error("Error loading books. Please try again."); // Use toast
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Book["status"]) => {
    switch (status) {
      case "not-started":
        return "bg-primary/60 text-primary dark:bg-primary/20 dark:text-primary/20";
      case "in-progress":
        return "bg-third-yellow/30 text-amber-800 dark:bg-third-yellow/20 dark:text-third-yellow";
      case "completed":
        return "bg-third-green/30 text-green-800 dark:bg-third-green/20 dark:text-third-green";
      default:
        return "bg-accent-lightgrey text-accent-grey-hover dark:bg-bdr-dark dark:text-accent-lightgrey";
    }
  };

  const getStatusLabel = (status: Book["status"]) => {
    switch (status) {
      case "not-started":
        return "Not Started";
      case "in-progress":
        return "Reading";
      case "completed":
        return "Finished";
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
      rating: 0,
    });
    if (notesEditor) {
      notesEditor.commands.setContent("");
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(false);
    // setError(null); // REMOVE (Not strictly necessary here but for consistency)
  };

  const handleEditBook = () => {
    if (selectedBook) {
      setFormData(selectedBook);
      setIsEditing(true);
      // setError(null); // REMOVE
      if (notesEditor) {
        notesEditor.commands.setContent(selectedBook.notes || "");
      }
    }
  };

  const handleSaveBook = async () => {
    // setError(null); // REMOVE
    if (!formData.title || !formData.author) {
      // setError("Title and author are required"); // REMOVE
      toast.error("Title and author are required."); // Use toast
      return;
    }
    try {
      const url = selectedBook
        ? `/api/features/books/${selectedBook._id}`
        : "/api/features/books";
      const method = selectedBook ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.message || `Failed to ${selectedBook ? "update" : "add"} book`;
        // setError(message); // REMOVE
        toast.error(message); // Use toast
        console.error("Server error:", data);
        return;
      }

      toast.success(`Book ${selectedBook ? "updated" : "added"} successfully!`); // Optional success toast

      if (selectedBook) {
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
    } catch (err) {
      // setError("Error saving book. Please try again."); // REMOVE
      toast.error("Error saving book. Please try again."); // Use toast
      console.error("Fetch error:", err);
    }
  };

  const handleDeleteBook = async () => {
    if (selectedBook) {
      try {
        // setError(null); // REMOVE
        const response = await fetch(
          `/api/features/books/${selectedBook._id}`,
          { method: "DELETE" }
        );
        if (!response.ok) {
          throw new Error("Failed to delete book");
        }
        toast.success("Book deleted successfully!"); // Optional success toast
        setBooks(books.filter((book) => book._id !== selectedBook._id));
        setSelectedBook(null);
        setIsEditing(false);
      } catch (err) {
        // setError("Error deleting book. Please try again."); // REMOVE
        toast.error("Error deleting book. Please try again."); // Use toast
        console.error(err);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === "status" && value === "completed" && !formData.dateCompleted) {
      setFormData({
        ...formData,
        [name]: value,
        dateCompleted: new Date().toISOString(),
      });
    } else if (name === "status" && value !== "completed") {
      setFormData({
        ...formData,
        [name]: value as Book["status"],
        dateCompleted: undefined,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData({ ...formData, rating });
  };

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || book.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Not specified";
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString();
  };

  const renderNotesContent = (notes: string) => {
    return { __html: notes };
  };

  const getBookCountByStatus = (status: string) => {
    if (status === "all") return books.length;
    return books.filter((book) => book.status === status).length;
  };

  return (
    <div className="flex flex-col md:flex-row gap-2 w-full h-full">
      {/* Left Panel - Book List */}
      <div className="relative w-1/3 p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
        <h1 className="text-sm font-medium text-secondary-black dark:text-secondary-white opacity-50 tracking-wider">
          MY LIBRARY
        </h1>
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={handleAddNewBook}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-secondary-white bg-primary hover:bg-primary-hover transition-colors duration-200 rounded-md"
            >
              <IconPlus size={16} />
              <span>Add Book</span>
            </button>
          </div>
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search books or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-bdr-light dark:border-bdr-dark rounded-md bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white placeholder:text-accent-grey-hover dark:placeholder:text-accent-grey focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-transparent transition-all duration-200"
            />
            <IconSearch
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent-grey-hover dark:text-accent-grey"
            />
          </div>
          <div className="flex flex-nowrap -mx-1 pb-1 mb-1">
            {["all", "not-started", "in-progress", "completed"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`flex items-center px-3 py-1.5 mr-2 rounded-md text-sm whitespace-nowrap transition-colors duration-200 ${
                    statusFilter === status
                      ? "bg-primary-primary/60 text-primary dark:bg-primary/30 dark:text-primary/20"
                      : "bg-accent-lightgrey text-accent-grey-hover dark:bg-bdr-dark dark:text-accent-lightgrey hover:bg-accent-grey/50 dark:hover:bg-bdr-dark/60"
                  }`}
                >
                  <span className="font-medium">
                    {status === "all"
                      ? "All"
                      : getStatusLabel(status as Book["status"])}
                  </span>
                  <span className="ml-1.5 bg-secondary-white dark:bg-secondary-black text-accent-grey-hover dark:text-accent-grey text-xs rounded-full px-2 py-0.5">
                    {getBookCountByStatus(status)}
                  </span>
                </button>
              )
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-accent-grey-hover dark:text-accent-grey space-y-3 h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              <p>Loading your books...</p>
            </div> /* REMOVE error display condition */
          ) : (
            <ul className="px-2 py-1">
              {filteredBooks.length > 0 ? (
                filteredBooks.map((book, index) => (
                  <li
                    key={book._id}
                    onClick={() => handleSelectBook(book)}
                    className={`
                    pl-4 pr-5 py-4 rounded-lg transition-colors duration-200 cursor-pointer
                    ${index < filteredBooks.length - 1 ? "mb-2" : ""}
                    ${
                      selectedBook?._id === book._id
                        ? "bg-accent-lightgrey dark:bg-bdr-dark"
                        : "bg-white dark:bg-secondary-black hover:bg-accent-lightgrey/40 dark:hover:bg-bdr-dark/50"
                    }
                  `}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-secondary-black dark:text-secondary-white line-clamp-1">
                          {book.title}
                        </h4>
                        <div className="flex items-center mt-1 text-sm text-accent-grey-hover dark:text-accent-grey">
                          <IconUser size={14} className="mr-1" />
                          <span className="line-clamp-1">{book.author}</span>
                        </div>
                        <div className="flex items-center mt-3 gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-md ${getStatusColor(
                              book.status
                            )}`}
                          >
                            {getStatusLabel(book.status)}
                          </span>
                          {book.genre && (
                            <span className="flex items-center text-xs px-2 py-0.5 bg-accent-lightgrey/60 dark:bg-bdr-dark text-accent-grey-hover dark:text-accent-lightgrey rounded-md">
                              <IconTag size={12} className="mr-1" />
                              {book.genre}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {book.rating ? (
                          <div className="flex items-center bg-third-yellow/20 dark:bg-third-yellow/20 px-2 py-1 rounded-md">
                            <span className="text-amber-800 dark:text-third-yellow font-medium text-sm mr-1">
                              {book.rating}
                            </span>
                            <IconStarFilled
                              size={14}
                              className="text-third-yellow"
                            />
                          </div>
                        ) : (
                          <div className="h-[26px]"></div>
                        )}
                        <IconChevronRight
                          size={18}
                          className="text-accent-grey dark:text-bdr-dark mt-4"
                        />
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-accent-grey-hover dark:text-accent-grey h-full">
                  <div className="p-3 mb-4 rounded-full bg-accent-lightgrey dark:bg-bdr-dark">
                    <IconSearch
                      size={24}
                      className="text-accent-grey-hover dark:text-accent-lightgrey"
                    />
                  </div>
                  <p className="mb-1">No books found</p>
                  <p className="text-sm">Try changing your search or filters</p>
                </div>
              )}
            </ul>
            // )} // End of removed error display ternary
          )}
        </div>
      </div>

      {/* Right Panel - Book Details / Edit Form */}
      <div className="relative p-4 w-2/3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
        {/* REMOVE error display */}
        {/* {error && !loading && !isEditing && (
          <div className="mx-5 mt-5 bg-third-red/10 dark:bg-third-red/20 border border-third-red/30 dark:border-third-red/50 text-red-800 dark:text-third-red px-4 py-3 rounded">
            {error}
          </div>
        )} */}

        {selectedBook && !isEditing ? (
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="inline-flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-md ${getStatusColor(
                      selectedBook.status
                    )}`}
                  >
                    {getStatusLabel(selectedBook.status)}
                  </span>
                  {selectedBook.genre && (
                    <span className="text-xs bg-accent-lightgrey/60 dark:bg-bdr-dark text-accent-grey-hover dark:text-accent-lightgrey px-2 py-0.5 rounded flex items-center">
                      <IconTag size={12} className="mr-1" />
                      {selectedBook.genre}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-secondary-black dark:text-secondary-white">
                  {selectedBook.title}
                </h2>
                <p className="text-accent-grey-hover dark:text-accent-grey text-lg mt-1">
                  by {selectedBook.author}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEditBook}
                  className="p-2 rounded-md border border-bdr-light dark:border-bdr-dark hover:bg-accent-lightgrey/40 dark:hover:bg-bdr-dark/60 transition-colors duration-200"
                  aria-label="Edit book"
                >
                  <IconEdit
                    size={20}
                    className="text-accent-grey-hover dark:text-accent-lightgrey"
                  />
                </button>
                <button
                  onClick={handleDeleteBook}
                  className="p-2 rounded-md border border-bdr-light dark:border-bdr-dark hover:bg-accent-lightgrey/40 dark:hover:bg-bdr-dark/60 transition-colors duration-200"
                  aria-label="Delete book"
                >
                  <IconTrash size={20} className="text-third-red" />
                </button>
              </div>
            </div>

            {selectedBook.rating ? (
              <div className="mb-6">
                <p className="text-sm font-medium text-accent-grey-hover dark:text-accent-grey mb-2">
                  Rating
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-medium text-secondary-black dark:text-secondary-white">
                    {selectedBook.rating}/5
                  </span>
                  <div className="flex ml-2">
                    {[...Array(5)].map((_, i) => (
                      <IconStarFilled
                        key={i}
                        size={18}
                        className={
                          i < (selectedBook.rating || 0)
                            ? "text-third-yellow"
                            : "text-accent-lightgrey dark:text-accent-grey-hover"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-accent-lightgrey/30 dark:bg-bdr-dark/50 rounded-lg p-4">
                <div className="flex items-center mb-1">
                  <IconCalendar
                    size={18}
                    className="text-accent-grey-hover dark:text-accent-grey mr-2"
                  />
                  <p className="text-sm font-medium text-accent-grey-hover dark:text-accent-grey">
                    Date Added
                  </p>
                </div>
                <p className="text-secondary-black dark:text-secondary-white">
                  {formatDate(selectedBook.dateAdded)}
                </p>
              </div>

              {selectedBook.status === "completed" &&
                selectedBook.dateCompleted && (
                  <div className="bg-accent-lightgrey/30 dark:bg-bdr-dark/50 rounded-lg p-4">
                    <div className="flex items-center mb-1">
                      <IconBookmark
                        size={18}
                        className="text-third-green mr-2"
                      />
                      <p className="text-sm font-medium text-accent-grey-hover dark:text-accent-grey">
                        Date Completed
                      </p>
                    </div>
                    <p className="text-secondary-black dark:text-secondary-white">
                      {formatDate(selectedBook.dateCompleted)}
                    </p>
                  </div>
                )}
            </div>

            {selectedBook.notes && (
              <div>
                <h3 className="text-lg font-medium text-secondary-black dark:text-secondary-white mb-3">
                  Notes
                </h3>
                <div className="bg-accent-lightgrey/30 dark:bg-bdr-dark/50 rounded-lg p-5">
                  <div
                    className="text-secondary-black dark:text-secondary-white prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={renderNotesContent(
                      selectedBook.notes
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        ) : isEditing ? (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-secondary-black dark:text-secondary-white">
                {selectedBook ? "Edit Book" : "Add New Book"}
              </h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  // setError(null); // REMOVE
                }}
                className="p-2 rounded-md border border-bdr-light dark:border-bdr-dark hover:bg-accent-lightgrey/40 dark:hover:bg-bdr-dark/60 transition-colors duration-200"
                aria-label="Cancel"
              >
                <IconX
                  size={20}
                  className="text-accent-grey-hover dark:text-accent-lightgrey"
                />
              </button>
            </div>

            {/* REMOVE error display */}
            {/* {error && (
              <div className="bg-third-red/10 dark:bg-third-red/20 border border-third-red/30 dark:border-third-red/50 text-red-800 dark:text-third-red px-4 py-3 rounded mb-6">
                {error}
              </div>
            )} */}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-accent-grey-hover dark:text-accent-lightgrey mb-2">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-bdr-light dark:border-bdr-dark rounded-lg bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white placeholder:text-accent-grey dark:placeholder:text-accent-grey focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Book title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-grey-hover dark:text-accent-lightgrey mb-2">
                  Author
                </label>
                <input
                  type="text"
                  name="author"
                  value={formData.author || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-bdr-light dark:border-bdr-dark rounded-lg bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white placeholder:text-accent-grey dark:placeholder:text-accent-grey focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Author name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-accent-grey-hover dark:text-accent-lightgrey mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status || "not-started"}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-bdr-light dark:border-bdr-dark rounded-lg bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white focus:outline-none focus:ring-2 focus:ring- dark:focus:ring-primary focus:border-transparent transition-all duration-200 appearance-none"
                  >
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">Reading</option>
                    <option value="completed">Finished</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-accent-grey-hover dark:text-accent-lightgrey mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    name="genre"
                    value={formData.genre || ""}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-bdr-light dark:border-bdr-dark rounded-lg bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white placeholder:text-accent-grey dark:placeholder:text-accent-grey focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="Fiction, Non-fiction, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-grey-hover dark:text-accent-lightgrey mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleRatingChange(rating)}
                        className="focus:outline-none p-1 transition-transform duration-200 hover:scale-110"
                      >
                        <IconStarFilled
                          size={26}
                          className={
                            rating <= (formData.rating || 0)
                              ? "text-third-yellow"
                              : "text-accent-lightgrey dark:text-accent-grey-hover"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  {formData.rating ? (
                    <span className="text-sm text-accent-grey-hover dark:text-accent-lightgrey ml-2">
                      {formData.rating}/5
                    </span>
                  ) : (
                    <span className="text-sm text-accent-grey-hover dark:text-accent-grey ml-2">
                      Not rated yet
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-grey-hover dark:text-accent-lightgrey mb-2">
                  Notes
                </label>
                {notesEditor && (
                  <div className="border border-bdr-light dark:border-bdr-dark rounded-lg p-4 bg-secondary-white dark:bg-secondary-black min-h-[200px] focus-within:ring-2 focus-within:ring-primary dark:focus-within:ring-primary focus-within:border-transparent transition-all duration-200">
                    <EditorContent editor={notesEditor} />
                    {notesEditor && <ContextMenu editor={notesEditor} />}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    // setError(null); // REMOVE
                  }}
                  className="px-4 py-2 border border-bdr-light dark:border-bdr-dark text-accent-grey-hover dark:text-accent-lightgrey rounded-md hover:bg-accent-lightgrey/40 dark:hover:bg-bdr-dark/60 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBook}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-secondary-white font-medium rounded-md transition-colors duration-200"
                >
                  {selectedBook ? "Update Book" : "Add Book"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[70vh] p-6 text-center">
            <div className="bg-primary/30 dark:bg-primary/20 p-4 rounded-full mb-4">
              <IconBook2
                size={42}
                className="text-primary dark:text-primary/30"
              />
            </div>
            <h3 className="text-xl font-semibold text-secondary-black dark:text-secondary-white mb-2">
              Your Digital Bookshelf
            </h3>
            <p className="text-accent-grey-hover dark:text-accent-grey max-w-md mb-6">
              Track your reading journey, capture your thoughts, and never
              forget a book you&#39;ve read.
            </p>
            <button
              onClick={handleAddNewBook}
              className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-secondary-white font-medium rounded-md transition-colors duration-200"
            >
              <IconPlus size={18} />
              <span>Add Your First Book</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookLogger;