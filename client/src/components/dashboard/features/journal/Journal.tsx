"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
// Import week functions from date-fns
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
// Using Lucide icons as per the last working version you provided
import { ChevronLeft, ChevronRight, Save, Trash2 } from "lucide-react";


// --- Interfaces and Setup (unchanged) ---
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

// Slash commands - keep the same items from your original code
const slashCommandItems = [
    // ... (Original slash command items remain exactly the same) ...
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
// --- End Setup ---

export const Journal: React.FC<JournalProps> = ({
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [displayMonthDate, setDisplayMonthDate] = useState<Date>(initialDate);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  // --- Editor Hook (Keep updated text colors) ---
  const editor = useEditor({
    extensions: [
      /* ... (keep same extensions as original) ... */
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
      Extension.create({ /* ... (keep enterHandler as original) ... */
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
        // Keep updated text color for editor content
        class: "prose dark:prose-invert focus:outline-none flex-grow p-4 text-secondary-black dark:text-secondary-white",
      },
    },
    injectCSS: false,
    immediatelyRender: false,
    onUpdate: () => {
      if (feedback) setFeedback(null);
      if (error) setError(null);
    },
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  // --- API Interaction Logic (unchanged) ---
  const fetchJournalEntry = useCallback(
    // ... (keep the same fetchJournalEntry logic) ...
     async (date: Date) => {
      if (!editorRef.current || !isValid(date)) return;
      setIsLoading(true);
      setError(null);
      setFeedback(null);
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
          console.error(
            `Failed to fetch entry (${response.status}):`,
            errorData.message
          );
          if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
            setError(
              `Failed to load entry: ${
                errorData.message || response.statusText
              }`
            );
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
          }
        }
      } catch (err) {
        console.error("Network or other error fetching entry:", err);
        if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
          setError("A network error occurred while loading the entry.");
          if (editorRef.current)
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate]
  );

  useEffect(() => {
    // ... (keep the same useEffect logic) ...
     if (editorRef.current && isValid(selectedDate)) {
      setDisplayMonthDate(selectedDate);
      fetchJournalEntry(selectedDate);
    }
  }, [selectedDate, fetchJournalEntry]);

  const handleSave = async () => {
    // ... (keep the same handleSave logic) ...
     if (!editorRef.current || isSaving || isLoading) return;
    setIsSaving(true);
    setError(null);
    setFeedback(null);
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
        setFeedback(response.status === 201 ? "Created!" : "Saved!");
        setTimeout(() => setFeedback(null), 2000);
      } else {
        const errorData = await response.json();
        console.error(
          `Failed to save entry (${response.status}):`,
          errorData.message
        );
        setError(`Save failed: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Network or other error saving entry:", err);
      setError("A network error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    // ... (keep the same handleDelete logic with corrected format string) ...
     if (isDeleting || !editorRef.current || isLoading) return;
    if (
      !window.confirm(
        `Delete entry for ${format(selectedDate, "MMMM d,𒑊")}?` // Corrected format
      )
    )
      return;
    setIsDeleting(true);
    setError(null);
    setFeedback(null);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    console.log(`Deleting journal entry for: ${formattedDate}`);
    try {
      const response = await fetch(`/api/features/journal/${formattedDate}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log(`Successfully deleted entry for ${formattedDate}`);
        setFeedback("Deleted!");
        editorRef.current.commands.setContent("<p></p>");
        setTimeout(() => setFeedback(null), 2000);
      } else if (response.status === 404) {
        console.warn(
          `Attempted to delete non-existent entry for ${formattedDate}`
        );
        setError("Entry not found.");
        editorRef.current.commands.setContent("<p></p>");
      } else {
        const errorData = await response.json();
        console.error(
          `Failed to delete entry (${response.status}):`,
          errorData.message
        );
        setError(`Delete failed: ${errorData.message || response.statusText}`);
      }
    } catch (err) {
      console.error("Network or other error deleting entry:", err);
      setError("A network error occurred while deleting.");
    } finally {
      setIsDeleting(false);
    }
  };
  // --- End API Logic ---

  // --- Week Navigation and Date Selection (Logic unchanged) ---
  const handlePreviousWeek = () => {
    // ... (keep the same handlePreviousWeek logic) ...
     if (isLoading || isSaving || isDeleting) return;
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
     // ... (keep the same handleNextWeek logic) ...
     if (isLoading || isSaving || isDeleting) return;
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleDateSelect = (date: Date) => {
     // ... (keep the same handleDateSelect logic) ...
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
  // --- End Date Selection ---

  if (!editor) {
    return (
      // Keep updated text color
      <div className="flex items-center justify-center h-full w-full text-accent-grey-hover dark:text-accent-grey">
        Loading editor...
      </div>
    );
  }

  // --- JSX Structure ---
  return (
    // Keep updated base text colors
    <div className="flex flex-col h-full w-full overflow-hidden text-secondary-black dark:text-secondary-white">
      {/* Main Content Area */}
      <div className="flex flex-1 gap-4 p-3 md:p-4 overflow-hidden">

        {/* === Sidebar Section REVERTED to Original Styling === */}
        <div className="flex flex-col w-20 flex-shrink-0">
          {/* Week Navigation & Month Display - REVERTED */}
          <div className="flex items-center justify-between w-full my-2 px-1">
            <button
              onClick={handlePreviousWeek}
              // Original hover/disabled/text styles
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30"
              aria-label="Previous week"
              disabled={isLoading || isSaving || isDeleting}
            >
              <ChevronLeft size={16} />
            </button>
            {/* Original text color/style */}
            <span
              className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center whitespace-nowrap"
              title={format(displayMonthDate, "MMMM d, yyyy")} // Corrected format string
            >
               {format(displayMonthDate, "MMM yy")}
            </span>
            <button
              onClick={handleNextWeek}
               // Original hover/disabled/text styles
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30"
              aria-label="Next week"
              disabled={isLoading || isSaving || isDeleting}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day Buttons - REVERTED */}
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
                  // Original complex className logic REVERTED
                  className={`
                        flex flex-col items-center p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 focus:ring-black dark:focus:ring-white
                        ${
                          isSelected
                            ? "bg-black text-white dark:bg-white dark:text-black" // Original selected style
                            : "hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300" // Original hover/text style
                        }
                        ${
                           // Original today border style
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
                  {/* Original text styles */}
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
        {/* === End of REVERTED Sidebar Section === */}


        {/* Separator - REVERTED to Original Styling */}
        <div className="w-px bg-gray-200 dark:bg-zinc-700 opacity-50 flex-shrink-0" />


        {/* Editor Area - Keep BookLogger background/border */}
        <div className="relative w-full p-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
           {/* Header - Keep updated text color */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-zinc-700/50 flex-shrink-0">
            {/* Keep updated text color */}
            <div className="text-sm text-accent-grey-hover dark:text-accent-grey opacity-90">
              {format(selectedDate, "EEEE, MMMM d, yyyy")} {/* Corrected format string */}
            </div>
          </div>


          {/* Loading Overlay - Keep updated spinner and colors */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 flex items-center justify-center z-20">
              {/* Keep BookLogger spinner style */}
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-blue dark:border-primary-bluelight border-t-transparent"></div>
            </div>
          )}

          {/* Editor Content - Keep updated text colors */}
          <div className="flex-grow overflow-y-auto prose dark:prose-invert max-w-none focus:outline-none relative px-0 pb-16">
             {/* Keep padding for EditorContent */}
            <EditorContent editor={editor} className="min-h-[200px] p-4" />
            {editor && <ContextMenu editor={editor} />}
          </div>

          {/* Buttons & Feedback - Keep BookLogger styles */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
            {/* Keep updated feedback styles */}
            {error && (
              <span className="text-xs text-red-800 dark:text-third-red bg-third-red/10 dark:bg-third-red/20 px-2 py-1 rounded">
                {error}
              </span>
            )}
            {feedback && (
               <span className="text-xs text-green-800 dark:text-third-green bg-third-green/10 dark:bg-third-green/20 px-2 py-1 rounded">
                {feedback}
              </span>
            )}

            {/* Keep BookLogger DELETE button style */}
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

            {/* Keep BookLogger SAVE button style */}
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