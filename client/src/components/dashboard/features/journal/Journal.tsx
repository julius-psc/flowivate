"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  getDay,
  isToday,
  addWeeks,
  subWeeks,
  isValid,
  parse,
} from "date-fns";
import { EditorContent, useEditor, Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import { SlashCommands } from "../../recyclable/markdown/SlashCommands";
import { ContextMenu } from "../../recyclable/markdown/ContextMenu";
import { ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";
import { toast } from "sonner"; // Import Sonner toast

interface JournalEntryData {
  _id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}
interface JournalProps {
  initialDate?: Date;
}
const lowlight = createLowlight();
lowlight.register("typescript", typescript);
lowlight.register("javascript", javascript);

const slashCommandItems = [
    {
        title: "Heading 1",
        command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleHeading({ level: 1 }).run(); },
        icon: <span className="text-xl font-bold">H1</span>,
    },
    {
        title: "Heading 2",
        command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleHeading({ level: 2 }).run(); },
        icon: <span className="text-lg font-bold">H2</span>,
    },
    {
        title: "Heading 3",
        command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleHeading({ level: 3 }).run(); },
        icon: <span className="text-base font-bold">H3</span>,
    },
    {
        title: "Bullet List",
        command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleBulletList().run(); },
        icon: <span className="text-sm">•</span>,
    },
    {
        title: "Numbered List",
        command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleOrderedList().run(); },
        icon: <span className="text-sm">1.</span>,
    },
    {
        title: "Paragraph",
        command: ({ editor }: { editor: Editor }) => { editor.chain().focus().setParagraph().run(); },
        icon: <span className="text-sm">P</span>,
    },
    {
        title: "Emoji",
        command: ({}: { editor: Editor }) => { /* Handled in SlashCommands render */ },
        icon: <span>😊</span>,
    },
];

export const Journal: React.FC<JournalProps> = ({
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [displayMonthDate, setDisplayMonthDate] = useState<Date>(initialDate);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // const [error, setError] = useState<string | null>(null); // REMOVE error state
  // const [feedback, setFeedback] = useState<string | null>(null); // REMOVE feedback state
  const editorRef = useRef<Editor | null>(null);

  const editor = useEditor({
    extensions: [
       StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return `Heading ${node.attrs.level}`;
          if (node.type.name === "bulletList") return "List item";
          if (node.type.name === "orderedList") return "List item";
          return "Type $ for commands or start writing your daily progress...";
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Highlight,
      CodeBlockLowlight.configure({ lowlight }),
      SlashCommands(slashCommandItems),
      Extension.create({
        name: "enterHandler",
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              const { state } = this.editor;
              const { selection } = state;
              const { $from, empty } = selection;
              if (empty && $from.parent.type.name !== "paragraph") {
                const atEnd = $from.parentOffset === $from.parent.nodeSize - 2;
                if (atEnd) {
                  return this.editor.commands.insertContent({
                    type: "paragraph",
                  });
                }
              }
              return false;
            },
          };
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose dark:prose-invert focus:outline-none flex-grow p-4 text-secondary-black dark:text-secondary-white",
      },
    },
    injectCSS: false,
    immediatelyRender: false,
    onUpdate: () => {
      // REMOVE feedback/error clearing logic
      // if (feedback) setFeedback(null);
      // if (error) setError(null);
    },
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  const fetchJournalEntry = useCallback(
     async (date: Date) => {
      if (!editorRef.current || !isValid(date)) return;
      setIsLoading(true);
      // setError(null); // REMOVE
      // setFeedback(null); // REMOVE
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log(`Workspaceing journal entry for: ${formattedDate}`);
      editorRef.current.commands.setContent("<p></p>");
      try {
        const response = await fetch(`/api/features/journal/${formattedDate}`);
        if (response.ok) {
          const data: { entry: JournalEntryData } = await response.json();
          console.log("Fetched entry:", data.entry._id);
          const storedDate = parse(data.entry.date, "yyyy-MM-dd", new Date());
          if (
            format(selectedDate, "yyyy-MM-dd") ===
            format(storedDate, "yyyy-MM-dd")
          ) {
            editorRef.current.commands.setContent(
              data.entry.content || "<p></p>"
            );
          } else {
            console.log("Stale data fetched, ignoring.");
          }
        } else if (response.status === 404) {
          console.log(`No entry found for ${formattedDate}. Editor cleared.`);
          if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
            editorRef.current.commands.setContent("<p></p>");
          }
        } else {
          const errorData = await response.json();
          const errorMessage = `Failed to load entry: ${errorData.message || response.statusText}`;
          console.error(`Failed to fetch entry (${response.status}):`, errorData.message);
          if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
            // setError(errorMessage); // REMOVE
            toast.error(errorMessage); // Use toast
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
          }
        }
      } catch (err) {
        const errorMessage = "A network error occurred while loading the entry.";
        console.error("Network or other error fetching entry:", err);
        if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
          // setError(errorMessage); // REMOVE
          toast.error(errorMessage); // Use toast
          if (editorRef.current)
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate] // Keep selectedDate dependency
  );

  useEffect(() => {
     if (editorRef.current && isValid(selectedDate)) {
      setDisplayMonthDate(selectedDate);
      fetchJournalEntry(selectedDate);
    }
  }, [selectedDate, fetchJournalEntry]);

  const handleSave = async () => {
     if (!editorRef.current || isSaving || isLoading) return;
    setIsSaving(true);
    // setError(null); // REMOVE
    // setFeedback(null); // REMOVE
    const content = editorRef.current.getHTML();
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    console.log(`Saving journal entry for: ${formattedDate}`);
    try {
      const response = await fetch(`/api/features/journal/${formattedDate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        const data: { entry: JournalEntryData } = await response.json();
        console.log("Saved entry:", data.entry._id);
        // setFeedback(response.status === 201 ? "Created!" : "Saved!"); // REMOVE
        toast.success(response.status === 201 ? "Entry created!" : "Entry saved!"); // Use toast
        // setTimeout(() => setFeedback(null), 2000); // REMOVE timeout
      } else {
        const errorData = await response.json();
        const errorMessage = `Save failed: ${errorData.message || response.statusText}`;
        console.error(`Failed to save entry (${response.status}):`, errorData.message);
        // setError(errorMessage); // REMOVE
        toast.error(errorMessage); // Use toast
      }
    } catch (err) {
      const errorMessage = "A network error occurred while saving.";
      console.error("Network or other error saving entry:", err);
      // setError(errorMessage); // REMOVE
      toast.error(errorMessage); // Use toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
     if (isDeleting || !editorRef.current || isLoading) return;
    if (!window.confirm(`Delete entry for ${format(selectedDate, "MMMM d, yyyy")}?`)) return;
    setIsDeleting(true);
    // setError(null); // REMOVE
    // setFeedback(null); // REMOVE
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    console.log(`Deleting journal entry for: ${formattedDate}`);
    try {
      const response = await fetch(`/api/features/journal/${formattedDate}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log(`Successfully deleted entry for ${formattedDate}`);
        // setFeedback("Deleted!"); // REMOVE
        toast.success("Entry deleted!"); // Use toast
        editorRef.current.commands.setContent("<p></p>");
        // setTimeout(() => setFeedback(null), 2000); // REMOVE timeout
      } else if (response.status === 404) {
        console.warn(`Attempted to delete non-existent entry for ${formattedDate}`);
        // setError("Entry not found."); // REMOVE
        toast.error("Entry not found."); // Use toast
        editorRef.current.commands.setContent("<p></p>");
      } else {
        const errorData = await response.json();
        const errorMessage = `Delete failed: ${errorData.message || response.statusText}`;
        console.error(`Failed to delete entry (${response.status}):`, errorData.message);
        // setError(errorMessage); // REMOVE
        toast.error(errorMessage); // Use toast
      }
    } catch (err) {
      const errorMessage = "A network error occurred while deleting.";
      console.error("Network or other error deleting entry:", err);
      // setError(errorMessage); // REMOVE
      toast.error(errorMessage); // Use toast
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreviousWeek = () => {
     if (isLoading || isSaving || isDeleting) return;
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
     if (isLoading || isSaving || isDeleting) return;
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleDateSelect = (date: Date) => {
     if (isLoading || isSaving || isDeleting) return;
    setSelectedDate(date);
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getDayLabel = (dayIndex: number): string => {
    const labels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    return labels[dayIndex];
  };

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full w-full text-accent-grey-hover dark:text-accent-grey">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden text-secondary-black dark:text-secondary-white">
      <div className="flex flex-1 gap-4 p-3 md:p-4 overflow-hidden mx-auto max-w-4xl w-full">

        <div className="flex flex-col w-20 flex-shrink-0">
          <div className="flex items-center justify-between w-full my-2 px-1">
            <button
              onClick={handlePreviousWeek}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30"
              aria-label="Previous week"
              disabled={isLoading || isSaving || isDeleting}
            >
              <ChevronLeft size={16} />
            </button>
            <span
              className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center whitespace-nowrap"
              title={format(displayMonthDate, "MMMM d, yyyy")}
            >
               {format(displayMonthDate, "MMM yy")}
            </span>
            <button
              onClick={handleNextWeek}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30"
              aria-label="Next week"
              disabled={isLoading || isSaving || isDeleting}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {daysInWeek.map((day) => {
              const dayOfWeekIndex = getDay(day);
              const isSelected =
                format(selectedDate, "yyyy-MM-dd") ===
                format(day, "yyyy-MM-dd");
              const isTodayDate = isToday(day);

              return (
                <button
                  key={format(day, "yyyy-MM-dd")}
                  onClick={() => handleDateSelect(day)}
                  disabled={isLoading || isSaving || isDeleting}
                  className={`
                        flex flex-col items-center p-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 focus:ring-black dark:focus:ring-white
                        ${
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300"
                        }
                        ${
                          isTodayDate && !isSelected
                            ? "border border-gray-400 dark:border-zinc-600"
                            : "border border-transparent"
                        }
                        ${
                          isLoading || isSaving || isDeleting
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }
                    `}
                >
                  <span className="text-xs font-medium opacity-80">
                    {getDayLabel(dayOfWeekIndex)}
                  </span>
                  <span className="text-sm font-semibold mt-0.5">
                    {format(day, "d")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-px bg-gray-200 dark:bg-zinc-700 opacity-50 flex-shrink-0" />

        <div className="relative w-full p-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 flex-shrink-0">
            <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">JOURNAL</h1>
            <div className="text-sm text-accent-grey-hover dark:text-accent-grey opacity-90">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </div>
          </div>

          {isLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 flex items-center justify-center z-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-blue dark:border-primary-bluelight border-t-transparent"></div>
            </div>
          )}

          <div className="flex-grow overflow-y-auto prose dark:prose-invert max-w-none focus:outline-none relative px-0 pb-16">
            <EditorContent editor={editor} className="min-h-[200px] p-4" />
            {editor && <ContextMenu editor={editor} />}
          </div>

          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            {/* REMOVE error and feedback spans */}
            {/* {error && (
              <span className="text-xs text-red-800 dark:text-third-red bg-third-red/10 dark:bg-third-red/20 px-2 py-1 rounded">
                {error}
              </span>
            )}
            {feedback && (
               <span className="text-xs text-green-800 dark:text-third-green bg-third-green/10 dark:bg-third-green/20 px-2 py-1 rounded">
                {feedback}
              </span>
            )} */}

            <button
              onClick={handleDelete}
              className={`p-2 rounded-md border border-bdr-light dark:border-bdr-dark hover:bg-accent-lightgrey/40 dark:hover:bg-bdr-dark/60 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Delete journal entry"
              title="Delete Entry"
              disabled={isLoading || isSaving || isDeleting}
            >
              {isDeleting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-third-red border-t-transparent"></div>
              ) : (
                <Trash2 size={16} className="text-third-red" />
              )}
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 min-w-[80px] bg-primary-blue hover:bg-primary-blue-hover text-secondary-white font-medium rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Save journal entry"
              disabled={isLoading || isSaving || isDeleting}
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <Save size={16} />
              )}
              <span className={`hidden sm:inline ${isSaving ? 'ml-1' : ''}`}>
                {isSaving ? "Saving..." : "Save"}
              </span>
               <span className={`sm:hidden ${isSaving ? 'ml-1' : ''}`}>
                 {isSaving ? "" : "Save"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Journal;