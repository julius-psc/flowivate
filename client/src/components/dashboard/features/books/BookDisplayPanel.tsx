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
}

export const BookDisplayPanel: React.FC<BookDisplayPanelProps> = ({
  selectedBook,
  isEditing,
  onSave,
  onDelete,
  onEdit,
  onCancel,
  onAddNew,
}) => {
  const [formData, setFormData] = useState<Partial<Book>>({});

  const notesEditor = useEditor({
    extensions: editorExtensions,
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert focus:outline-none w-full px-4 py-2 text-secondary-black dark:text-secondary-white leading-relaxed",
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

  const renderNotesContent = (notes: string) => {
    return { __html: notes || "<p>No notes available.</p>" };
  };

  if (isEditing) {
    return (
      <div className="w-2/3 flex flex-col">
        <style jsx>{`
          .prose p {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
        `}</style>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-secondary-black dark:text-secondary-white">
              {selectedBook ? "Edit Book" : "Add New Book"}
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Cancel"
            >
              <IconX
                size={18}
                className="text-gray-700 dark:text-gray-300"
              />
            </button>
          </div>
          <div className="py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-700"
                placeholder="Book title"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Author
              </label>
              <input
                type="text"
                name="author"
                value={formData.author || ""}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-700"
                placeholder="Author name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status || "not-started"}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 text-secondary-black dark:text-secondary-white focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-700"
                >
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">Reading</option>
                  <option value="completed">Finished</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre || ""}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 text-secondary-black dark:text-secondary-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-700"
                  placeholder="Fiction, Non-fiction, etc."
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
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
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.rating ? `${formData.rating}/5` : "Not rated"}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-4">
                Notes
              </label>
              <div className="relative border border-gray-200 dark:border-gray-800 rounded-lg p-4 min-h-[200px] bg-white dark:bg-transparent">
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
                className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveClick}
                className="px-4 py-2 bg-secondary-black dark:bg-white text-white dark:text-secondary-black rounded-md hover:opacity-90"
              >
                {selectedBook ? "Update Book" : "Add Book"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedBook && !isEditing) {
    return (
      <div className="w-2/3 flex flex-col">
        <style jsx>{`
          .prose p {
            margin-top: 0.5rem;
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
        `}</style>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-0.5 text-xs font-medium ${getStatusColor(
                    selectedBook.status
                  )}`}
                >
                  {getStatusLabel(selectedBook.status)}
                </span>
                {selectedBook.genre && (
                  <span className="flex items-center text-xs px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                    <IconTag size={12} className="mr-1" />
                    {selectedBook.genre}
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-secondary-black dark:text-secondary-white">
                {selectedBook.title}
              </h2>
              <p className="text-xl mt-1 text-gray-700 dark:text-gray-300">
                by {selectedBook.author}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(selectedBook)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Edit book"
              >
                <IconEdit
                  size={18}
                  className="text-gray-700 dark:text-gray-300"
                />
              </button>
              <button
                onClick={() => onDelete(selectedBook)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Rating
              </p>
              <div className="flex items-center gap-1">
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
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
            <div className="bg-gray-100 dark:bg-gray-500/10 rounded-lg p-4">
              <div className="flex items-center mb-1">
                <IconCalendar
                  size={16}
                  className="text-gray-500 dark:text-gray-400 mr-2"
                />
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Date Added
                </p>
              </div>
              <p className="text-secondary-black dark:text-secondary-white">
                {formatDate(selectedBook.dateAdded)}
              </p>
            </div>
            {selectedBook.status === "completed" &&
              selectedBook.dateCompleted && (
                <div className="bg-gray-100 dark:bg-gray-500/10 rounded-lg p-4">
                  <div className="flex items-center mb-1">
                    <IconBookmark size={16} className="text-green-500 mr-2" />
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
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
              <h3 className="text-sm font-medium mb-3 text-gray-500 dark:text-gray-400">
                Notes
              </h3>
              <div className="prose dark:prose-invert max-w-none text-secondary-black dark:text-secondary-white">
                <div
                  className="rendered-notes"
                  dangerouslySetInnerHTML={renderNotesContent(
                    selectedBook.notes
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-2/3 flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-6">
      <IconBook2 size={48} className="mb-4" />
      <h3 className="text-xl font-semibold mb-2 text-secondary-black dark:text-secondary-white">
        Your Digital Bookshelf
      </h3>
      <p className="text-center max-w-md mb-4">
        Track your reading journey, capture your thoughts, and never forget a
        book you&apos;ve read.
      </p>
      <button
        onClick={onAddNew}
        className="flex items-center space-x-1 px-4 py-2 bg-secondary-black dark:bg-white text-white dark:text-secondary-black rounded-md hover:opacity-90"
      >
        <IconPlus size={18} />
        <span>Add Your First Book</span>
      </button>
    </div>
  );
};