"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isToday,
  addMonths,
  subMonths,
  isValid,
  parse,
  isSameDay,
  addDays,
  subDays,
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
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/hooks/useGlobalStore";

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
    command: ({}: { editor: Editor }) => {
    },
    icon: <span>😊</span>,
  },
];

export const Journal: React.FC<JournalProps> = ({
  initialDate = new Date(),
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [currentMonth, setCurrentMonth] = useState<Date>(initialDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const editorRef = useRef<Editor | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);

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
          if (node.type.name === "heading")
            return `Heading ${node.attrs.level}`;
          if (node.type.name === "bulletList") return "List item";
          if (node.type.name === "orderedList") return "List item";
          return "Type $ for commands or start writing your thoughts...";
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
        class: "prose dark:prose-invert focus:outline-none w-full h-full px-6 py-4 text-secondary-black dark:text-secondary-white",
      },
    },
    injectCSS: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        dateButtonRef.current &&
        !dateButtonRef.current.contains(event.target as Node)
      ) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchJournalEntry = useCallback(
    async (date: Date) => {
      if (!editorRef.current || !isValid(date)) return;
      setIsLoading(true);
      const formattedDate = format(date, "yyyy-MM-dd");
      console.log(`Fetching journal entry for: ${formattedDate}`);
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
          const errorMessage = `Failed to load entry: ${
            errorData.message || response.statusText
          }`;
          console.error(
            `Failed to fetch entry (${response.status}):`,
            errorData.message
          );
          if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
            toast.error(errorMessage);
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
          }
        }
      } catch (err) {
        const errorMessage =
          "A network error occurred while loading the entry.";
        console.error("Network or other error fetching entry:", err);
        if (format(selectedDate, "yyyy-MM-dd") === formattedDate) {
          toast.error(errorMessage);
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
    if (editor && editorRef.current && isValid(selectedDate)) {
      fetchJournalEntry(selectedDate);
    }
  }, [editor, fetchJournalEntry, selectedDate]);

  const handleSave = async () => {
    if (!editorRef.current || isSaving || isLoading) return;
    setIsSaving(true);
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
        toast.success(
          response.status === 201 ? "Entry created" : "Entry saved"
        );
        triggerLumoEvent("JOURNAL_SAVED");
      } else {
        const errorData = await response.json();
        const errorMessage = `Save failed: ${
          errorData.message || response.statusText
        }`;
        console.error(
          `Failed to save entry (${response.status}):`,
          errorData.message
        );
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "A network error occurred while saving.";
      console.error("Network or other error saving entry:", err);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !editorRef.current || isLoading) return;
    if (
      !window.confirm(
        `Delete entry for ${format(selectedDate, "MMMM d, yyyy")}?`
      )
    )
      return;
    setIsDeleting(true);
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    console.log(`Deleting journal entry for: ${formattedDate}`);
    try {
      const response = await fetch(`/api/features/journal/${formattedDate}`, {
        method: "DELETE",
      });
      if (response.ok) {
        console.log(`Successfully deleted entry for ${formattedDate}`);
        toast.success("Entry deleted");
        editorRef.current.commands.setContent("<p></p>");
      } else if (response.status === 404) {
        console.warn(
          `Attempted to delete non-existent entry for ${formattedDate}`
        );
        toast.error("Entry not found.");
        editorRef.current.commands.setContent("<p></p>");
      } else {
        const errorData = await response.json();
        const errorMessage = `Delete failed: ${
          errorData.message || response.statusText
        }`;
        console.error(
          `Failed to delete entry (${response.status}):`,
          errorData.message
        );
        toast.error(errorMessage);
      }
    } catch (err) {
      const errorMessage = "A network error occurred while deleting.";
      console.error("Network or other error deleting entry:", err);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePrevMonth = () => {
    if (isLoading || isSaving || isDeleting) return;
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    if (isLoading || isSaving || isDeleting) return;
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateSelect = (date: Date) => {
    if (isLoading || isSaving || isDeleting) return;
    setSelectedDate(date);
    setCurrentMonth(date);
    setIsCalendarOpen(false);
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dayOfWeekNames = ["S", "M", "T", "W", "T", "F", "S"];

  const startDay = getDay(monthStart);
  const daysGrid = [...Array(startDay).fill(null), ...daysInMonth];

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-full w-full text-secondary-black dark:text-secondary-white">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full text-secondary-black dark:text-secondary-white">
      <div className="px-4 py-4">
        <div className="max-w-screen-lg mx-auto flex justify-end items-center">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDelete}
              disabled={isLoading || isSaving || isDeleting}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Delete entry"
            >
              {isDeleting ? (
                <div className="h-4 w-4 border-2 border-gray-500 dark:border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Trash2 size={18} className="text-gray-700 dark:text-gray-300" />
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isLoading || isSaving || isDeleting}
              className="flex items-center space-x-1 px-3 py-1.5 bg-secondary-black dark:bg-white text-white dark:text-secondary-black rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-sm font-medium">Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden max-w-screen-lg mx-auto w-full">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDateSelect(subDays(selectedDate, 1))}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isLoading}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              ref={dateButtonRef}
              onClick={toggleCalendar}
              className="text-3xl font-bold hover:opacity-70 transition-opacity relative"
              disabled={isLoading}
            >
              {format(selectedDate, "d")}
            </button>

            {isCalendarOpen && (
              <div
                ref={calendarRef}
                className="absolute z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3"
                style={{
                  minWidth: "250px",
                  top: dateButtonRef.current
                    ? dateButtonRef.current.getBoundingClientRect().bottom + window.scrollY + 4
                    : "auto",
                  left: dateButtonRef.current
                    ? dateButtonRef.current.getBoundingClientRect().left
                    : "auto",
                }}
              >
                <div className="flex justify-between items-center mb-3">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-medium">
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {dayOfWeekNames.map((day, index) => (
                    <div
                      key={index}
                      className="text-xs font-medium text-gray-500 dark:text-gray-400 p-1"
                    >
                      {day}
                    </div>
                  ))}

                  {daysGrid.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="p-1" />;
                    }

                    const isSelectedDay = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                      <button
                        key={format(day, "yyyy-MM-dd")}
                        onClick={() => handleDateSelect(day)}
                        className={`
                          h-8 w-8 rounded-md flex items-center justify-center text-sm
                          ${
                            isSelectedDay
                              ? "bg-secondary-black dark:bg-white text-white dark:text-secondary-black font-medium"
                              : ""
                          }
                          ${
                            isTodayDate && !isSelectedDay
                              ? "border border-gray-400 dark:border-gray-600"
                              : ""
                          }
                          ${
                            !isSelectedDay
                              ? "hover:bg-gray-100 dark:hover:bg-gray-800"
                              : ""
                          }
                        `}
                      >
                        {format(day, "d")}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {format(selectedDate, "EEEE")}
              </span>
              <span className="text-xs text-gray-700 dark:text-gray-300 opacity-70">
                {format(selectedDate, "MMMM yyyy")}
              </span>
            </div>

            <button
              onClick={() => handleDateSelect(addDays(selectedDate, 1))}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isLoading}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs text-gray-700 dark:text-gray-300 opacity-70">
            <Clock size={14} className="text-gray-700 dark:text-gray-300" />
            <span>{format(new Date(), "HH:mm")}</span>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto">
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 z-10 ${
              isLoading
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="h-8 w-8 border-2 border-secondary-black dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>

          <EditorContent editor={editor} className="h-full" />
          {editor && <ContextMenu editor={editor} />}
        </div>
      </div>
    </div>
  );
};

export default Journal;