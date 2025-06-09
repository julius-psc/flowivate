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
import { Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import { SlashCommands } from "../../recyclable/markdown/SlashCommands";
import { ContextMenu } from "../../recyclable/markdown/ContextMenu";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { format } from "date-fns";

export interface Book {
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
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const bookEditorText = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-secondary-black dark:text-secondary-white";

  const [formData, setFormData] = useState<Partial<Book>>({
    title: "",
    author: "",
    status: "not-started",
    genre: "",
    notes: "<p></p>",
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
        paragraph: {
          HTMLAttributes: {
            class: "leading-relaxed my-1",
          },
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading")
            return `Heading ${node.attrs.level}`;
          if (node.type.name === "bulletList") return "List item";
          if (node.type.name === "orderedList") return "List item";
          return "Type $ for commands or start writing your notes…";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Highlight,
      CodeBlockLowlight.configure({ lowlight }),
      SlashCommands(slashCommandItems),
      Extension.create({
        name: "spaceHandler",
        addKeyboardShortcuts() {
          return {
            " ": () => {
              this.editor.commands.insertContent(" ");
              return true;
            },
          };
        },
      }),
    ],
    content: formData.notes || "<p></p>",
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert focus:outline-none w-full px-4 py-2 ${bookEditorText} leading-relaxed`,
      },
    },
    injectCSS: false,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      setFormData((prev) => ({ ...prev, notes: content }));
    },
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (notesEditor && isEditing) {
      notesEditor.commands.setContent(formData.notes || "<p></p>");
    }
  }, [isEditing, formData.notes, notesEditor]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/features/books");
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      const data = await response.json();
      setBooks(data.books);
    } catch (err) {
      toast.error("Error loading books. Please try again.");
      console.error("Fetch books error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Book["status"]) => {
    switch (status) {
      case "not-started":
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-gray-700 dark:text-gray-400";
      case "in-progress":
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-yellow-800 dark:text-yellow-400";
      case "completed":
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-green-800 dark:text-green-400";
      default:
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-gray-700 dark:text-gray-300";
    }
  };

  const getRightPanelStatusColor = (status: Book["status"]) => {
    switch (status) {
      case "not-started":
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-gray-700 dark:text-gray-400";
      case "in-progress":
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-yellow-800 dark:text-yellow-400";
      case "completed":
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-green-800 dark:text-green-400";
      default:
        return theme === "jungle" || theme === "ocean"
          ? "text-white"
          : "text-gray-700 dark:text-gray-300";
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
      notes: "<p></p>",
      rating: 0,
    });
    if (notesEditor) {
      notesEditor.commands.setContent("<p></p>");
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(false);
  };

  const handleEditBook = () => {
    if (selectedBook) {
      setFormData({
        ...selectedBook,
        notes: selectedBook.notes || "<p></p>",
      });
      setIsEditing(true);
      if (notesEditor) {
        notesEditor.commands.setContent(selectedBook.notes || "<p></p>");
      }
    }
  };

  const handleSaveBook = async () => {
    if (!formData.title?.trim() || !formData.author?.trim()) {
      toast.error("Title and author are required.");
      return;
    }
    try {
      const url = selectedBook
        ? `/api/features/books/${selectedBook._id}`
        : "/api/features/books";
      const method = selectedBook ? "PUT" : "POST";

      const notesContent = notesEditor?.getHTML() || "<p></p>";

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
          data.message || `Failed to ${selectedBook ? "update" : "add"} book`
        );
      }

      toast.success(`Book ${selectedBook ? "updated" : "added"} successfully!`);

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Error saving book. Please try again.");
        console.error("Save book error:", err);
      } else {
        toast.error("Error saving book. Please try again.");
        console.error("Save book error:", err);
      }
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    if (
      !window.confirm(
        `Delete "${selectedBook.title}" by ${selectedBook.author}?`
      )
    )
      return;

    try {
      const response = await fetch(`/api/features/books/${selectedBook._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete book");
      }

      toast.success("Book deleted successfully!");
      setBooks(books.filter((book) => book._id !== selectedBook._id));
      setSelectedBook(null);
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message || "Error deleting book. Please try again.");
        console.error("Delete book error:", err);
      } else {
        toast.error("Error deleting book. Please try again.");
        console.error("Delete book error:", err);
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "status" && value === "completed" && !prev.dateCompleted
        ? { dateCompleted: new Date().toISOString() }
        : name === "status" && value !== "completed"
        ? { dateCompleted: undefined }
        : {}),
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
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
    return format(date, "MMMM d, yyyy");
  };

  const renderNotesContent = (notes: string) => {
    return { __html: notes || "<p>No notes available.</p>" };
  };

  const getBookCountByStatus = (status: string) => {
    if (status === "all") return books.length;
    return books.filter((book) => book.status === status).length;
  };

  const bookHeadingColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-xl font-bold text-gray-900 dark:text-gray-100";

  const bookSubtextColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white opacity-70"
    : "text-sm opacity-70 text-gray-700 dark:text-gray-300";

  const bookEmptyIconColor = !mounted
    ? ""
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "";

  const bookEmptyTitleColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-xl font-semibold text-gray-900 dark:text-gray-100";

  const bookTitleColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-900 dark:text-gray-100";

  const bookAuthorColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-500 dark:text-gray-400";

  const bookGenreColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-700 dark:text-gray-300";

  const bookIconColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-700 dark:text-gray-300";

  const bookAddButtonColor = !mounted
    ? "text-transparent"
    : theme === "jungle"
    ? "text-white"
    : "text-white dark:text-secondary-black";

  const bookLabelColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-secondary-black"
    : "text-gray-500 dark:text-gray-400";

  const bookRatingTextColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-500 dark:text-gray-400";

  const bookChevronColor = !mounted
    ? "text-transparent"
    : theme === "jungle" || theme === "ocean"
    ? "text-white"
    : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex flex-col w-full h-full text-secondary-black dark:text-secondary-white">
      <style jsx>{`
        .prose p {
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
          line-height: 1.5;
        }
      `}</style>
      {/* Header */}
      <div className="px-4 py-4">
        <div className="max-w-screen-lg mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className={`text-xl font-bold ${bookHeadingColor}`}>
              Book Logger
            </h1>
            <div className={`${bookSubtextColor}`}>
              {selectedBook
                ? `${selectedBook.title} by ${selectedBook.author}`
                : "Your Digital Bookshelf"}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleAddNewBook}
              className={`flex items-center px-1 py-1 bg-secondary-black dark:bg-white ${bookAddButtonColor} rounded-lg hover:opacity-90`}
            >
              <IconPlus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden max-w-screen-lg mx-auto w-full">
        {/* Left Panel - Book List */}
        <div className="w-1/3 p-4 flex flex-col">
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search books or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
            />
            <IconSearch
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
            />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {["all", "not-started", "in-progress", "completed"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? "bg-gray-500 text-white dark:bg-gray-400 dark:text-secondary-black"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {status === "all"
                    ? "All"
                    : getStatusLabel(status as Book["status"])}
                  <span className="ml-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full px-2 py-0.5">
                    {getBookCountByStatus(status)}
                  </span>
                </button>
              )
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="h-8 w-8 border-2 border-gray-500 dark:border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredBooks.length > 0 ? (
              <ul>
                {filteredBooks.map((book) => (
                  <li
                    key={book._id}
                    onClick={() => handleSelectBook(book)}
                    className={`p-4 rounded-md cursor-pointer mb-2 transition-colors ${
                      selectedBook?._id === book._id
                        ? "bg-gray-200/50 dark:bg-gray-700/50"
                        : "hover:bg-gray-100/50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4
                          className={`font-medium line-clamp-1 ${bookTitleColor}`}
                        >
                          {book.title}
                        </h4>
                        <div
                          className={`flex items-center text-sm mt-1 ${bookAuthorColor}`}
                        >
                          <IconUser size={14} className="mr-1" />
                          <span className="line-clamp-1">{book.author}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span
                            className={`px-2 py-0.5 text-xs ${getStatusColor(
                              book.status
                            )}`}
                          >
                            {getStatusLabel(book.status)}
                          </span>
                          {book.genre && (
                            <span
                              className={`flex items-center text-xs px-2 py-0.5 rounded-md ${bookGenreColor}`}
                            >
                              <IconTag size={12} className="mr-1" />
                              {book.genre}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        {book.rating ? (
                          <div className="flex items-center px-2 py-1">
                            <span className={`text-sm ${bookRatingTextColor}`}>
                              {book.rating}/5
                            </span>
                            <IconStarFilled
                              size={14}
                              className="text-yellow-500 ml-1"
                            />
                          </div>
                        ) : (
                          <div className="h-7"></div>
                        )}
                        <IconChevronRight
                          size={18}
                          className={`mt-4 ${bookChevronColor}`}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <IconSearch size={24} className="mb-2" />
                <p>No books found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Book Details / Edit Form */}
        <div className="w-2/3 p-4 flex flex-col">
          {selectedBook && !isEditing ? (
            <div className="flex-1 overflow-y-auto opacity-90">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 text-xs font-medium ${getRightPanelStatusColor(
                        selectedBook.status
                      )}`}
                    >
                      {getStatusLabel(selectedBook.status)}
                    </span>
                    {selectedBook.genre && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${bookGenreColor}`}
                      >
                        <IconTag size={12} className="mr-1" />
                        {selectedBook.genre}
                      </span>
                    )}
                  </div>
                  <h2 className={`text-2xl font-bold ${bookTitleColor}`}>
                    {selectedBook.title}
                  </h2>
                  <p className={`text-lg mt-1 ${bookAuthorColor}`}>
                    by {selectedBook.author}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleEditBook}
                    className="p-2 rounded-full"
                    aria-label="Edit book"
                  >
                    <IconEdit size={18} className={bookIconColor} />
                  </button>
                  <button
                    onClick={handleDeleteBook}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label="Delete book"
                  >
                    <IconTrash
                      size={18}
                      className="text-red-600 dark:text-red-400"
                    />
                  </button>
                </div>
              </div>
              {selectedBook.rating ? (
                <div className="mb-6">
                  <p className={`text-sm font-medium ${bookLabelColor} mb-2`}>
                    Rating
                  </p>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-lg font-medium ${bookRatingTextColor}`}
                    >
                      {selectedBook.rating}/5
                    </span>
                    <div className="flex ml-2">
                      {[...Array(5)].map((_, i) => (
                        <IconStarFilled
                          key={i}
                          size={18}
                          className={
                            i < (selectedBook.rating || 0)
                              ? "text-yellow-500"
                              : "text-gray-300 dark:text-gray-600"
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center mb-1">
                    <IconCalendar
                      size={16}
                      className="text-gray-500 dark:text-gray-400 mr-2"
                    />
                    <p className={`text-sm font-medium ${bookLabelColor}`}>
                      Date Added
                    </p>
                  </div>
                  <p>{formatDate(selectedBook.dateAdded)}</p>
                </div>
                {selectedBook.status === "completed" &&
                  selectedBook.dateCompleted && (
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                      <div className="flex items-center mb-1">
                        <IconBookmark
                          size={16}
                          className="text-green-500 mr-2"
                        />
                        <p className={`text-sm font-medium ${bookLabelColor}`}>
                          Date Completed
                        </p>
                      </div>
                      <p>{formatDate(selectedBook.dateCompleted)}</p>
                    </div>
                  )}
              </div>
              {selectedBook.notes && (
                <div>
                  <h3 className={`text-sm font-medium mb-3 ${bookLabelColor}`}>
                    Notes
                  </h3>
                  <div className="bg-transparent rounded-lg p-5 prose dark:prose-invert max-w-none">
                    <div
                      className={`rendered-notes prose dark:prose-invert max-w-none ${
                        theme === "jungle"  || theme === "ocean" ? "text-white" : ""
                      }`}
                      dangerouslySetInnerHTML={renderNotesContent(
                        selectedBook.notes
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : isEditing ? (
            <div className="flex-1 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className={`text-2xl font-bold ${bookTitleColor}`}>
                  {selectedBook ? "Edit Book" : "Add New Book"}
                </h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Cancel"
                >
                  <IconX
                    size={18}
                    className="text-gray-700 dark:text-gray-300"
                  />
                </button>
              </div>
              <div className="py-6">
                <div>
                  <label
                    className={`block text-sm font-medium ${bookLabelColor} mb-2`}
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleInputChange}
                    className="w-[80%] ml-1 mb-4 px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                    placeholder="Book title"
                    required
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${bookLabelColor} mb-2`}
                  >
                    Author
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author || ""}
                    onChange={handleInputChange}
                    className="w-[80%] ml-1 mb-4 px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 max-w-full"
                    placeholder="Author name"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium ${bookLabelColor} mb-2`}
                    >
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status || "not-started"}
                      onChange={handleInputChange}
                      className="w-[80%] ml-1 mb-4 px-2 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-secondary-black dark:text-secondary-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">Reading</option>
                      <option value="completed">Finished</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium ${bookLabelColor} mb-2`}
                    >
                      Genre
                    </label>
                    <input
                      type="text"
                      name="genre"
                      value={formData.genre || ""}
                      onChange={handleInputChange}
                      className="w-[80%] ml-1 mb-4 px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 max-w-full"
                      placeholder="Fiction, Non-fiction, etc."
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${bookLabelColor} mb-2`}
                  >
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(rating)}
                          className="p-1"
                        >
                          <IconStarFilled
                            size={24}
                            className={
                              rating <= (formData.rating || 0)
                                ? "text-yellow-500"
                                : "text-gray-300 dark:text-gray-600"
                            }
                          />
                        </button>
                      ))}
                    </div>
                    <span className={`text-sm ${bookRatingTextColor}`}>
                      {formData.rating ? `${formData.rating}/5` : "Not rated"}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium ${bookLabelColor} mb-2 mt-4`}
                  >
                    Notes
                  </label>
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 min-h-[200px] bg-transparent">
                    {notesEditor && (
                      <>
                        <EditorContent
                          editor={notesEditor}
                          className="h-full max-w-full"
                        />
                        <ContextMenu editor={notesEditor} />
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 my-4">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBook}
                    className="px-4 py-2 bg-secondary-black dark:bg-white text-white dark:text-secondary-black rounded-md hover:opacity-90"
                  >
                    {selectedBook ? "Update Book" : "Add Book"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <IconBook2 size={48} className={`mb-4 ${bookEmptyIconColor}`} />
              <h3
                className={`text-xl font-semibold mb-2 ${bookEmptyTitleColor}`}
              >
                Your Digital Bookshelf
              </h3>
              <p className="text-center max-w-md mb-4">
                Track your reading journey, capture your thoughts, and never
                forget a book you&#39;ve read.
              </p>
              <button
                onClick={handleAddNewBook}
                className={`flex items-center space-x-1 px-4 py-2 bg-secondary-black dark:bg-white ${bookAddButtonColor} rounded-md hover:opacity-90`}
              >
                <IconPlus size={18} />
                <span>Add Your First Book</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookLogger;