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
import { SlashCommands } from "../../recyclable/markdown/SlashCommands"; // Adjust path if needed
import { ContextMenu } from "../../recyclable/markdown/ContextMenu"; // Adjust path if needed
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useGlobalStore } from "@/hooks/useGlobalStore"; // Adjust path if needed
import { useTheme } from "next-themes";
import { Skeleton } from "@/components/ui/Skeleton";
import { specialSceneThemeNames } from "@/lib/themeConfig"; // Adjust path if needed

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

interface SlashCommandItem {
  title: string;
  command: ({ editor }: { editor: Editor }) => void;
  icon: React.ReactNode; // Use React.ReactNode for JSX Elements
}

const lowlight = createLowlight();
lowlight.register("typescript", typescript);
lowlight.register("javascript", javascript);

const slashCommandItems: SlashCommandItem[] = [
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
    command: ({ }: { editor: Editor }) => {
      // Placeholder or implement emoji picker logic
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);

  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

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
              if (!this.editor) return false;
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
        class: `prose dark:prose-invert focus:outline-none w-full h-full px-6 py-4 ${isSpecialTheme ? "prose-invert text-white/90" : "text-secondary-black dark:text-secondary-white"
          }`,
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
      editorRef.current.commands.setContent("<p></p>");
      try {
        const response = await fetch(`/api/features/journal/${formattedDate}`);
        if (response.ok) {
          const data: { entry: JournalEntryData } = await response.json();
          const storedDate = parse(data.entry.date, "yyyy-MM-dd", new Date());
          if (isSameDay(selectedDate, storedDate)) {
            editorRef.current.commands.setContent(
              data.entry.content || "<p></p>"
            );
          }
        } else if (response.status === 404) {
          if (isSameDay(selectedDate, date)) {
            editorRef.current.commands.setContent("<p></p>");
          }
        } else {
          const errorData = await response.json();
          const errorMessage = `Failed to load entry: ${errorData.message || response.statusText
            }`;
          if (isSameDay(selectedDate, date)) {
            toast.error(errorMessage);
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
          }
        }
      } catch (err: unknown) { // Type err as unknown
        let errorMessage = "A network error occurred while loading the entry.";
        if (err instanceof Error) {
          errorMessage = `Error loading entry: ${err.message}`;
        }
        console.error("Network or other error fetching entry:", err);
        if (isSameDay(selectedDate, date)) {
          toast.error(errorMessage);
          if (editorRef.current)
            editorRef.current.commands.setContent(
              "<p>Error loading content.</p>"
            );
        }
      } finally {
        if (isSameDay(selectedDate, date)) {
          setIsLoading(false);
        }
      }
    },
    [selectedDate]
  );


  useEffect(() => {
    if (editor && editorRef.current && isValid(selectedDate)) {
      fetchJournalEntry(selectedDate);
    }
    return () => {
      setIsLoading(false);
    };
  }, [editor, selectedDate, fetchJournalEntry]);


  const handleSave = async () => {
    if (!editorRef.current || isSaving || isLoading) return;
    setIsSaving(true);
    const content = editorRef.current.getHTML();
    const formattedDate = format(selectedDate, "yyyy-MM-dd");
    try {
      const response = await fetch(`/api/features/journal/${formattedDate}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        // const data: { entry: JournalEntryData } = await response.json(); // Don't strictly need data here
        await response.json(); // Consume response body
        toast.success(
          response.status === 201 ? "Entry created" : "Entry saved"
        );
        triggerLumoEvent("JOURNAL_SAVED");
      } else {
        const errorData = await response.json();
        const errorMessage = `Save failed: ${errorData.message || response.statusText
          }`;
        toast.error(errorMessage);
      }
    } catch (err: unknown) { // Type err as unknown
      let errorMessage = "A network error occurred while saving.";
      if (err instanceof Error) {
        errorMessage = `Error saving entry: ${err.message}`;
      }
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
    try {
      const response = await fetch(`/api/features/journal/${formattedDate}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Entry deleted");
        editorRef.current.commands.setContent("<p></p>");
      } else if (response.status === 404) {
        toast.error("Entry not found.");
        editorRef.current.commands.setContent("<p></p>");
      } else {
        const errorData = await response.json();
        const errorMessage = `Delete failed: ${errorData.message || response.statusText
          }`;
        toast.error(errorMessage);
      }
    } catch (err: unknown) { // Type err as unknown
      let errorMessage = "A network error occurred while deleting.";
      if (err instanceof Error) {
        errorMessage = `Error deleting entry: ${err.message}`;
      }
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

  const containerBaseClasses = "flex flex-col flex-1 overflow-hidden max-w-screen-lg mx-auto w-full backdrop-blur-md rounded-xl transition-opacity duration-300 mb-4";
  const containerPreMountClasses = "bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/50 opacity-0";
  const containerPostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100"
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 opacity-100";

  const buttonHoverBg = isSpecialTheme ? "hover:bg-white/10" : "hover:bg-gray-100 dark:hover:bg-gray-800";
  const iconColor = isSpecialTheme ? "text-white/70" : "text-gray-700 dark:text-gray-300";
  const dateTextColor = isSpecialTheme ? "text-white" : "text-secondary-black dark:text-secondary-white";
  const saveButtonBg = isSpecialTheme ? "bg-white/90 hover:bg-white" : "bg-secondary-black dark:bg-white hover:opacity-90";
  const saveButtonText = isSpecialTheme ? "text-zinc-900" : "text-white dark:text-secondary-black";

  if (!editor && !isLoading && isMounted) { // Check isMounted here as well
    return (
      <div className={`flex items-center justify-center h-full w-full ${dateTextColor}`}>
        Editor failed to load. Please refresh.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-4 py-4">
        <div className="max-w-screen-lg mx-auto flex justify-end items-center">
          <div className="flex items-center space-x-1">
            <button
              onClick={handleDelete}
              disabled={isLoading || isSaving || isDeleting}
              className={`p-2 rounded-md ${buttonHoverBg} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label="Delete entry"
            >
              {isDeleting ? (
                <div className={`h-4 w-4 border-2 ${isSpecialTheme ? 'border-white/50' : 'border-gray-500 dark:border-gray-400'} border-t-transparent rounded-full animate-spin`}></div>
              ) : (
                <Trash2 size={18} className={iconColor} />
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={isLoading || isSaving || isDeleting}
              className={`flex items-center space-x-1 px-3 py-1.5 ${saveButtonBg} ${saveButtonText} rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-opacity`}
            >
              {isSaving && <div className={`h-4 w-4 border-2 ${isSpecialTheme ? 'border-zinc-600' : 'border-white dark:border-black'} border-t-transparent rounded-full animate-spin mr-1`}></div>}
              <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className={`${containerBaseClasses} ${isMounted ? containerPostMountClasses : containerPreMountClasses}`}>
        <div className={`flex items-center justify-between px-6 py-3 border-b ${isSpecialTheme ? 'border-white/10' : 'border-gray-200 dark:border-gray-800'}`}>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleDateSelect(subDays(selectedDate, 1))}
              className={`p-2 rounded-md ${buttonHoverBg}`}
              disabled={isLoading || isSaving || isDeleting}
            >
              <ChevronLeft size={16} className={dateTextColor} />
            </button>

            <button
              ref={dateButtonRef}
              onClick={toggleCalendar}
              className={`text-3xl font-bold hover:opacity-70 transition-opacity relative ${dateTextColor}`}
              disabled={isLoading || isSaving || isDeleting}
            >
              {format(selectedDate, "d")}
            </button>

            {isCalendarOpen && (
              <div
                ref={calendarRef}
                className={`absolute z-50 border rounded-lg shadow-lg p-3 ${isSpecialTheme
                    ? 'bg-zinc-900/70 border-zinc-700/50 backdrop-blur-sm' // Apply backdrop-blur here too
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                  }`}
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
                    className={`p-1 rounded-md ${buttonHoverBg}`}
                  >
                    <ChevronLeft size={16} className={dateTextColor} />
                  </button>
                  <span className={`font-medium ${dateTextColor}`}>
                    {format(currentMonth, "MMMM yyyy")}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className={`p-1 rounded-md ${buttonHoverBg}`}
                  >
                    <ChevronRight size={16} className={dateTextColor} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {dayOfWeekNames.map((day, index) => (
                    <div
                      key={index}
                      className={`text-xs font-medium p-1 ${isSpecialTheme ? 'text-white/50' : 'text-gray-500 dark:text-gray-400'}`}
                    >
                      {day}
                    </div>
                  ))}

                  {daysGrid.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="p-1 h-8 w-8" />;
                    }
                    const isSelectedDay = isSameDay(day, selectedDate);
                    const isTodayDate = isToday(day);

                    return (
                      <button
                        key={format(day, "yyyy-MM-dd")}
                        onClick={() => handleDateSelect(day)}
                        className={`
                          h-8 w-8 rounded-md flex items-center justify-center text-sm transition-colors
                          ${isSelectedDay
                            ? isSpecialTheme
                              ? "bg-white text-zinc-900 font-medium"
                              : "bg-secondary-black dark:bg-white text-white dark:text-secondary-black font-medium"
                            : isTodayDate
                              ? isSpecialTheme
                                ? "border border-white/40 text-white/80 hover:bg-white/10"
                                : "border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                              : isSpecialTheme
                                ? "text-white/80 hover:bg-white/10"
                                : `hover:bg-gray-100 dark:hover:bg-gray-800 ${dateTextColor}` // Apply default text color if not today/selected
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
              <span className={`text-sm font-medium ${dateTextColor}`}>
                {format(selectedDate, "EEEE")}
              </span>
              <span className={`text-xs opacity-70 ${isSpecialTheme ? 'text-white/60' : 'text-gray-700 dark:text-gray-300'}`}>
                {format(selectedDate, "MMMM yyyy")}
              </span>
            </div>

            <button
              onClick={() => handleDateSelect(addDays(selectedDate, 1))}
              className={`p-2 rounded-md ${buttonHoverBg}`}
              disabled={isLoading || isSaving || isDeleting}
            >
              <ChevronRight size={16} className={dateTextColor} />
            </button>
          </div>

          <div className={`flex items-center space-x-1 text-xs opacity-70 ${isSpecialTheme ? 'text-white/60' : 'text-gray-700 dark:text-gray-300'}`}>
            <Clock size={14} className={isSpecialTheme ? 'text-white/60' : 'text-gray-700 dark:text-gray-300'} />
            <span>{format(new Date(), "HH:mm")}</span>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto">
          {isLoading ? (
            <div className="px-6 py-4 space-y-6 h-full overflow-hidden">
              <Skeleton className="h-12 w-[30%] rounded-lg" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-[90%] rounded-md" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-[75%] rounded-md" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-[60%] rounded-md" />
              </div>
            </div>
          ) : (
            <>
              {editor && <EditorContent editor={editor} className="h-full" />}
              {editor && <ContextMenu editor={editor} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;