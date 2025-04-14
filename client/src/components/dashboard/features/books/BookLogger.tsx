"use client";

import React, { useState, useEffect } from "react";
import { IconBook2, IconPlus, IconStarFilled, IconX, IconSearch, IconEdit, IconTrash } from "@tabler/icons-react";
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import { SlashCommands } from '../../recyclable/markdown/SlashCommands';
import { ContextMenu } from '../../recyclable/markdown/ContextMenu';

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
lowlight.register('typescript', typescript);
lowlight.register('javascript', javascript);

const BookLogger: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  const slashCommandItems = [
    {
      title: 'Heading 1',
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 1 }).run();
      },
      icon: <span className="text-xl font-bold">H1</span>,
    },
    {
      title: 'Heading 2',
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 2 }).run();
      },
      icon: <span className="text-lg font-bold">H2</span>,
    },
    {
      title: 'Heading 3',
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleHeading({ level: 3 }).run();
      },
      icon: <span className="text-base font-bold">H3</span>,
    },
    {
      title: 'Bullet List',
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleBulletList().run();
      },
      icon: <span className="text-sm">•</span>,
    },
    {
      title: 'Numbered List',
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().toggleOrderedList().run();
      },
      icon: <span className="text-sm">1.</span>,
    },
    {
      title: 'Paragraph',
      command: ({ editor }: { editor: Editor }) => {
        editor.chain().focus().setParagraph().run();
      },
      icon: <span className="text-sm">P</span>,
    },
    {
      title: 'Emoji',
      command: ({ }: { editor: Editor }) => {
        // This will be handled in SlashCommands render
      },
      icon: <span>😊</span>,
    },
  ];

  const notesEditor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
        codeBlock: false, 
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`;
          }
          if (node.type.name === 'bulletList') {
            return 'List item';
          }
          if (node.type.name === 'orderedList') {
            return 'List item';
          }
          return 'Type $ for commands or start writing your notes...';
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Highlight,
      CodeBlockLowlight.configure({ lowlight }),
      SlashCommands(slashCommandItems),
    ],
    content: formData.notes || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setFormData(prev => ({ ...prev, notes: html }));
    },
    editorProps: {
      attributes: {
        class: 'prose focus:outline-none min-h-[200px] w-full dark:text-primary-white',
      },
    },
    injectCSS: false,
  });

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  // Update editor content when selected book changes or editing mode changes
  useEffect(() => {
    if (notesEditor && isEditing) {
      notesEditor.commands.setContent(formData.notes || '');
    }
  }, [isEditing, formData.notes, notesEditor]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/features/books');
      
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      
      const data = await response.json();
      setBooks(data.books);
      setError(null);
    } catch (err) {
      setError('Error loading books. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
    if (notesEditor) {
      notesEditor.commands.setContent('');
    }
  };

  const handleSelectBook = (book: Book) => {
    setSelectedBook(book);
    setIsEditing(false);
  };

  const handleEditBook = () => {
    if (selectedBook) {
      setFormData(selectedBook);
      setIsEditing(true);
      if (notesEditor) {
        notesEditor.commands.setContent(selectedBook.notes || '');
      }
    }
  };

  const handleSaveBook = async () => {
    if (!formData.title || !formData.author) {
      setError('Title and author are required');
      return;
    }

    try {
      if (selectedBook) {
        // Update existing book
        const response = await fetch(`/api/features/books/${selectedBook._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to update book');
        }

        const data = await response.json();
        setBooks(books.map(book => 
          book._id === selectedBook._id ? data.book : book
        ));
        setSelectedBook(data.book);
      } else {
        // Create new book
        const response = await fetch('/api/features/books', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to add book');
        }

        const data = await response.json();
        setBooks([...books, data.book]);
        setSelectedBook(data.book);
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Error saving book. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteBook = async () => {
    if (selectedBook) {
      try {
        const response = await fetch(`/api/features/books/${selectedBook._id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete book');
        }

        setBooks(books.filter(book => book._id !== selectedBook._id));
        setSelectedBook(null);
        setIsEditing(false);
        setError(null);
      } catch (err) {
        setError('Error deleting book. Please try again.');
        console.error(err);
      }
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

  // Format date display helper
  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Not specified";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString();
  };

  // Render notes content using dangerouslySetInnerHTML
  const renderNotesContent = (notes: string) => {
    return { __html: notes };
  };

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
              className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-gray-100 dark:bg-gray-800 px-2 py-1times rounded-md dark:hover:text-gray-100"
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
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              Loading books...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {filteredBooks.length > 0 ? filteredBooks.map((book) => (
                <li 
                  key={book._id}
                  onClick={() => handleSelectBook(book)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${selectedBook?._id === book._id ? 'bg-gray-100 dark:bg-gray-800/70' : ''}`}
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
              )) : (
                <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No books found
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Right Panel - Book Details / Edit Form */}
      <div className="md:w-2/3 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg p-4">
        {error && !loading && !isEditing && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
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
                  {formatDate(selectedBook.dateAdded)}
                </p>
              </div>
              
              {selectedBook.status === "completed" && selectedBook.dateCompleted && (
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Completed</p>
                  <p className="text-gray-900 dark:text-gray-100 mt-1">
                    {formatDate(selectedBook.dateCompleted)}
                  </p>
                </div>
              )}
            </div>

            {selectedBook.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                <div 
                  className="text-gray-900 dark:text-gray-100 prose prose-sm dark:prose-invert max-w-none" 
                  dangerouslySetInnerHTML={renderNotesContent(selectedBook.notes)}
                />
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
                  setError(null);
                  if (!selectedBook) setSelectedBook(null);
                }}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <IconX size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

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
                {notesEditor && (
                  <div className="border border-gray-300 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800">
                    <EditorContent editor={notesEditor} />
                    {notesEditor && <ContextMenu editor={notesEditor} />}
                  </div>
                )}
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