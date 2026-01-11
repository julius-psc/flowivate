"use client";

import React, { useState, useEffect } from "react";
import {
  IconBook2,
  IconPlus,
  IconStarFilled,
  IconX,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconBookmark,
  IconTag,
} from "@tabler/icons-react";
import { EditorContent, useEditor } from "@tiptap/react";
import { ContextMenu } from "../../recyclable/markdown/ContextMenu";
import {
  Book,
  editorExtensions,
  getStatusLabel,
  getStatusColor,
  formatDate,
} from "@/components/dashboard/features/books/bookUtils";

interface BookDisplayPanelProps {
  selectedBook: Book | null;
  isEditing: boolean;
  onSave: (bookData: Partial<Book>, notesContent: string) => void;
  onDelete: (book: Book) => void;
  onEdit: (book: Book) => void;
  onCancel: () => void;
  onAddNew: () => void;
  isSpecialTheme: boolean;
}

export const BookDisplayPanel: React.FC<BookDisplayPanelProps> = ({
  selectedBook,
  isEditing,
  onSave,
  onDelete,
  onEdit,
  onCancel,
  onAddNew,
  isSpecialTheme,
}) => {
  const [formData, setFormData] = useState<Partial<Book>>({});

  const panelBg = isSpecialTheme ? "bg-zinc-900/50" : "bg-white/80 dark:bg-zinc-900/80";
  const panelText = isSpecialTheme ? "text-white" : "text-secondary-black dark:text-secondary-white";
  const subtleText = isSpecialTheme ? "text-white/60" : "text-gray-500 dark:text-gray-400";
  const buttonHoverBg = isSpecialTheme ? "hover:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-gray-800";
  const iconColor = isSpecialTheme ? "text-white/70" : "text-gray-700 dark:text-gray-300";
  const deleteIconColor = isSpecialTheme ? "text-red-400" : "text-red-600 dark:text-red-400";

  const inputBg = isSpecialTheme ? "bg-white/5 dark:bg-white/5 border-white/10 focus:ring-white/20" : "bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 focus:ring-gray-500 dark:focus:ring-gray-700";
  const inputText = isSpecialTheme ? "text-white/90 placeholder:text-white/40" : "text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400";

  const editorBorder = isSpecialTheme ? "border-white/10" : "border-gray-200 dark:border-gray-800";
  const editorWrapperBg = isSpecialTheme ? "bg-black/10 dark:bg-black/10" : "bg-white dark:bg-transparent";

  const infoBoxBg = isSpecialTheme ? "bg-white/5 dark:bg-white/5" : "bg-gray-100 dark:bg-gray-500/10";

  const cancelButtonBg = isSpecialTheme ? "bg-white/10 hover:bg-white/20 text-white/80" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600";
  const saveButtonBg = isSpecialTheme ? "bg-white/90 hover:bg-white text-zinc-900" : "bg-secondary-black dark:bg-white text-white dark:text-secondary-black hover:opacity-90";
  const firstButtonBg = isSpecialTheme ? "bg-white/90 hover:bg-white text-zinc-900" : "bg-secondary-black dark:bg-white text-white dark:text-secondary-black hover:opacity-90";

  const notesEditor = useEditor({
    extensions: editorExtensions,
    content: "",
    editorProps: {
      attributes: {
        class:
          `prose dark:prose-invert focus:outline-none w-full px-4 py-2 leading-relaxed ${isSpecialTheme ? 'text-white/90 prose-invert' : 'text-secondary-black dark:text-secondary-white'}`,
      },
    },
    injectCSS: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (isEditing) {
      const initialData = selectedBook
        ? { ...selectedBook, notes: selectedBook.notes || "<p></p>" }
        : {
          title: "",
          author: "",
          status: "not-started" as Book["status"],
          genre: "",
          notes: "<p></p>",
          rating: 0,
        };
      setFormData(initialData);
      notesEditor?.commands.setContent(initialData.notes || "<p></p>");
    } else if (selectedBook && notesEditor && !notesEditor.isDestroyed) {
      notesEditor.commands.setContent(selectedBook.notes || "<p></p>");
    } else if (!selectedBook && notesEditor && !notesEditor.isDestroyed) {
      notesEditor.commands.setContent("<p></p>");
    }
  }, [isEditing, selectedBook, notesEditor]);


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
    setFormData((prev) => ({
      ...prev,
      rating: prev.rating === rating ? 0 : rating,
    }));
  };

  const handleSaveClick = () => {
    const notesContent = notesEditor?.getHTML() || "<p></p>";
    onSave(formData, notesContent);
  };

  const renderNotesContent = (notes: string | undefined): { __html: string } => {
    return { __html: notes || "<p>No notes available.</p>" };
  };

  // Base classes for the display panel
  const displayPanelBaseClasses = `w-2/3 flex flex-col ${panelBg} backdrop-blur-md`;

  if (isEditing) {
    return (
      // Added rounded-r-xl for right corners
      <div className={`${displayPanelBaseClasses} rounded-r-xl`}>
        <style jsx>{`
          .prose p {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
          .dark .prose-invert a { color: #93c5fd; }
          .dark .prose-invert strong { color: #fff; }
        `}</style>
        <div className="flex-1 overflow-y-auto p-6 pb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className={`text-2xl font-bold ${panelText}`}>
              {selectedBook?._id ? "Edit Book" : "Add New Book"}
            </h2>
            <button
              onClick={onCancel}
              className={`p-2 rounded-md ${buttonHoverBg}`}
              aria-label="Cancel"
            >
              <IconX
                size={18}
                className={iconColor}
              />
            </button>
          </div>
          <div className="py-6 space-y-4">
            <div>
              <label className={`block text-sm font-medium ${subtleText} mb-2`}>
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${inputBg} ${inputText}`}
                placeholder="Book title"
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${subtleText} mb-2`}>
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author || ""}
                onChange={handleInputChange}
                className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${inputBg} ${inputText}`}
                placeholder="Author name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${subtleText} mb-2`}>
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status || "not-started"}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 appearance-none ${inputBg} ${inputText}`}
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">Reading</option>
                  <option value="completed">Finished</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium ${subtleText} mb-2`}>
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre || ""}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${inputBg} ${inputText}`}
                  placeholder="Fiction, Non-fiction, etc."
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${subtleText} mb-2`}>
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
                        className={`transition-colors ${rating <= (formData.rating || 0)
                            ? "text-yellow-500"
                            : isSpecialTheme
                              ? "text-white/20"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                      />
                    </button>
                  ))}
                </div>
                <span className={`text-sm ${subtleText}`}>
                  {formData.rating ? `${formData.rating}/5` : "Not rated"}
                </span>
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${subtleText} mb-2 mt-4`}>
                Notes
              </label>
              <div className={`relative border rounded-lg min-h-[200px] ${editorBorder} ${editorWrapperBg}`}>
                {notesEditor && (
                  <>
                    <EditorContent
                      editor={notesEditor}
                      className="h-full max-w-full break-words whitespace-pre-wrap"
                    />
                    <ContextMenu editor={notesEditor} />
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 my-4">
              <button
                onClick={onCancel}
                className={`px-4 py-2 rounded-md transition-colors ${cancelButtonBg}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                className={`px-4 py-2 rounded-md transition-opacity ${saveButtonBg}`}
              >
                {selectedBook?._id ? "Update Book" : "Add Book"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedBook && !isEditing) {
    return (
      // Added rounded-r-xl for right corners
      <div className={`${displayPanelBaseClasses} rounded-r-xl`}>
        <style jsx>{`
          .prose p { margin-top: 0.5rem; margin-bottom: 0.5rem; line-height: 1.5; }
          .dark .prose-invert a { color: #93c5fd; }
          .dark .prose-invert strong { color: #fff; }
           .rendered-notes h1, .rendered-notes h2, .rendered-notes h3 { margin-top: 1em; margin-bottom: 0.5em; }
           .rendered-notes ul, .rendered-notes ol { margin-left: 1.5em; }
        `}</style>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${getStatusColor(
                    selectedBook.status
                  )}`}
                >
                  {getStatusLabel(selectedBook.status)}
                </span>
                {selectedBook.genre && (
                  <span className={`flex items-center text-xs px-2 py-0.5 rounded ${isSpecialTheme ? 'text-white/70 bg-white/5' : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700/50'}`}>
                    <IconTag size={12} className="mr-1" />
                    {selectedBook.genre}
                  </span>
                )}
              </div>
              <h2 className={`text-3xl font-bold ${panelText}`}>
                {selectedBook.title}
              </h2>
              <p className={`text-xl mt-1 ${isSpecialTheme ? 'text-white/80' : 'text-gray-700 dark:text-gray-300'}`}>
                by {selectedBook.author}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onEdit(selectedBook)}
                className={`p-2 rounded-md ${buttonHoverBg}`}
                aria-label="Edit book"
              >
                <IconEdit
                  size={18}
                  className={iconColor}
                />
              </button>
              <button
                onClick={() => onDelete(selectedBook)}
                className={`p-2 rounded-md ${buttonHoverBg}`}
                aria-label="Delete book"
              >
                <IconTrash
                  size={18}
                  className={deleteIconColor}
                />
              </button>
            </div>
          </div>
          {selectedBook.rating ? (
            <div className="mb-6">
              <p className={`text-sm font-medium ${subtleText} mb-2`}>
                Rating
              </p>
              <div className="flex items-center gap-1">
                <span className={`text-lg font-medium ${isSpecialTheme ? 'text-white/80' : 'text-gray-700 dark:text-gray-300'}`}>
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
                          : isSpecialTheme ? "text-white/20" : "text-gray-300 dark:text-gray-600"
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={`${infoBoxBg} rounded-lg p-4`}>
              <div className="flex items-center mb-1">
                <IconCalendar
                  size={16}
                  className={`${subtleText} mr-2`}
                />
                <p className={`text-sm font-medium ${subtleText}`}>
                  Date Added
                </p>
              </div>
              <p className={panelText}>
                {formatDate(selectedBook.dateAdded)}
              </p>
            </div>
            {selectedBook.status === "completed" &&
              selectedBook.dateCompleted && (
                <div className={`${infoBoxBg} rounded-lg p-4`}>
                  <div className="flex items-center mb-1">
                    <IconBookmark size={16} className="text-green-500 mr-2" />
                    <p className={`text-sm font-medium ${subtleText}`}>
                      Date Completed
                    </p>
                  </div>
                  <p className={panelText}>
                    {formatDate(selectedBook.dateCompleted)}
                  </p>
                </div>
              )}
          </div>
          {selectedBook.notes && selectedBook.notes !== '<p></p>' && (
            <div>
              <h3 className={`text-sm font-medium mb-3 ${subtleText}`}>
                Notes
              </h3>
              <div className={`prose dark:prose-invert max-w-none ${isSpecialTheme ? 'text-white/90 prose-invert' : 'text-secondary-black dark:text-secondary-white'}`}>
                <div
                  className="rendered-notes"
                  dangerouslySetInnerHTML={renderNotesContent(selectedBook.notes)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback / Initial state view
  return (
    <div className={`w-2/3 ${panelBg} backdrop-blur-md rounded-r-xl`} />
  );
};