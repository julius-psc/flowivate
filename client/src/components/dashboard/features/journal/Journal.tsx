"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
// Import week functions from date-fns
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay, isToday, addWeeks, subWeeks, isValid, parse } from 'date-fns';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import { SlashCommands } from '../../recyclable/markdown/SlashCommands'; // Adjust path if needed
import { ContextMenu } from '../../recyclable/markdown/ContextMenu'; // Adjust path if needed
import { ChevronLeft, ChevronRight, Save, Trash2, Loader2 } from 'lucide-react';

// --- Interfaces and Setup (unchanged) ---
interface JournalEntryData {
    _id: string; userId: string; date: string; content: string; createdAt: string; updatedAt: string;
}
interface JournalProps { initialDate?: Date; }
const lowlight = createLowlight();
lowlight.register('typescript', typescript);
lowlight.register('javascript', javascript);
const slashCommandItems = [ /* ... (keep the same items) ... */
    { title: 'Heading 1', command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleHeading({ level: 1 }).run(); }, icon: <span className="text-xl font-bold">H1</span>, }, { title: 'Heading 2', command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleHeading({ level: 2 }).run(); }, icon: <span className="text-lg font-bold">H2</span>, }, { title: 'Heading 3', command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleHeading({ level: 3 }).run(); }, icon: <span className="text-base font-bold">H3</span>, }, { title: 'Bullet List', command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleBulletList().run(); }, icon: <span className="text-sm">•</span>, }, { title: 'Numbered List', command: ({ editor }: { editor: Editor }) => { editor.chain().focus().toggleOrderedList().run(); }, icon: <span className="text-sm">1.</span>, }, { title: 'Paragraph', command: ({ editor }: { editor: Editor }) => { editor.chain().focus().setParagraph().run(); }, icon: <span className="text-sm">P</span>, }, { title: 'Emoji', command: ({ }: { editor: Editor }) => { /* Handled in SlashCommands render */ }, icon: <span>😊</span>, },];
// --- End Setup ---

export const Journal: React.FC<JournalProps> = ({
    initialDate = new Date(), // Today's date if not provided
}) => {
    // selectedDate drives the API calls and the highlighted day
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
    // displayMonthDate determines the month/year shown in "< Apr 25 >"
    // It's updated when the selected week moves into a new month/year
    const [displayMonthDate, setDisplayMonthDate] = useState<Date>(initialDate);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const editorRef = useRef<Editor | null>(null);

    // --- Editor Hook (unchanged) ---
    const editor = useEditor({
        extensions: [ /* ... (keep same extensions) ... */
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, bulletList: { keepMarks: true, keepAttributes: false }, orderedList: { keepMarks: true, keepAttributes: false }, codeBlock: false, }), Placeholder.configure({ placeholder: ({ node }) => { if (node.type.name === 'heading') return `Heading ${node.attrs.level}`; if (node.type.name === 'bulletList') return 'List item'; if (node.type.name === 'orderedList') return 'List item'; return 'Type $ for commands or start writing your daily progress...'; }, showOnlyWhenEditable: true, showOnlyCurrent: true, }), Highlight, CodeBlockLowlight.configure({ lowlight }), SlashCommands(slashCommandItems), Extension.create({ name: 'enterHandler', addKeyboardShortcuts() { return { Enter: () => { const { state } = this.editor; const { selection } = state; const { $from, empty } = selection; if (empty && $from.parent.type.name !== 'paragraph') { const atEnd = $from.parentOffset === $from.parent.nodeSize - 2; if (atEnd) { return this.editor.commands.insertContent({ type: 'paragraph' }); } } return false; }, }; }, }),],
        content: '',
        editorProps: { attributes: { class: 'prose dark:prose-invert focus:outline-none flex-grow p-4' }, },
        injectCSS: false,
        immediatelyRender: false,
        onUpdate: () => { if (feedback) setFeedback(null); if (error) setError(null); },
    });

    useEffect(() => { if (editor) { editorRef.current = editor; } }, [editor]);

    // --- API Interaction Logic (unchanged, uses selectedDate) ---
    const fetchJournalEntry = useCallback(async (date: Date) => {
        if (!editorRef.current || !isValid(date)) return;
        setIsLoading(true); setError(null); setFeedback(null);
        const formattedDate = format(date, 'yyyy-MM-dd');
        console.log(`Workspaceing journal entry for: ${formattedDate}`);
        // Clear editor content immediately for visual feedback while loading
        editorRef.current.commands.setContent('<p></p>');
        try {
            const response = await fetch(`/api/features/journal/${formattedDate}`);
            if (response.ok) {
                const data: { entry: JournalEntryData } = await response.json();
                console.log('Fetched entry:', data.entry._id);
                // Parse stored date to compare - defensive check
                const storedDate = parse(data.entry.date, 'yyyy-MM-dd', new Date());
                 // Check if the fetched data is still for the currently selected date
                 // Prevents race conditions if user clicks dates quickly
                if (format(selectedDate, 'yyyy-MM-dd') === format(storedDate, 'yyyy-MM-dd')) {
                    editorRef.current.commands.setContent(data.entry.content || '<p></p>');
                } else {
                     console.log("Stale data fetched, ignoring.");
                }

            } else if (response.status === 404) {
                console.log(`No entry found for ${formattedDate}. Editor cleared.`);
                 // Ensure editor is clear only if it's still the selected date
                 if (format(selectedDate, 'yyyy-MM-dd') === formattedDate) {
                    editorRef.current.commands.setContent('<p></p>');
                 }
            } else {
                const errorData = await response.json();
                console.error(`Failed to fetch entry (${response.status}):`, errorData.message);
                if (format(selectedDate, 'yyyy-MM-dd') === formattedDate) {
                     setError(`Failed to load entry: ${errorData.message || response.statusText}`);
                     editorRef.current.commands.setContent('<p>Error loading content.</p>');
                }
            }
        } catch (err) {
            console.error('Network or other error fetching entry:', err);
             if (format(selectedDate, 'yyyy-MM-dd') === formattedDate) {
                setError('A network error occurred while loading the entry.');
                if (editorRef.current) editorRef.current.commands.setContent('<p>Error loading content.</p>');
             }
        } finally { setIsLoading(false); }
    // selectedDate is now a dependency to handle race conditions
    }, [selectedDate]);

    // Fetch entry when selectedDate changes
    useEffect(() => {
        if (editorRef.current && isValid(selectedDate)) {
             // Also update the display month whenever selected date changes
            setDisplayMonthDate(selectedDate);
            fetchJournalEntry(selectedDate);
        }
    }, [selectedDate, fetchJournalEntry]); // Depends on selectedDate

    const handleSave = async () => {
        if (!editorRef.current || isSaving || isLoading) return; // Prevent save while loading
        setIsSaving(true); setError(null); setFeedback(null);
        const content = editorRef.current.getHTML();
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        console.log(`Saving journal entry for: ${formattedDate}`);
        try {
            const response = await fetch(`/api/features/journal/${formattedDate}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }), });
            if (response.ok) {
                const data: { entry: JournalEntryData } = await response.json();
                console.log('Saved entry:', data.entry._id);
                setFeedback(response.status === 201 ? 'Created!' : 'Saved!');
                setTimeout(() => setFeedback(null), 2000);
            } else {
                const errorData = await response.json();
                console.error(`Failed to save entry (${response.status}):`, errorData.message);
                setError(`Save failed: ${errorData.message || response.statusText}`);
            }
        } catch (err) {
            console.error('Network or other error saving entry:', err);
            setError('A network error occurred while saving.');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async () => {
        if (isDeleting || !editorRef.current || isLoading) return; // Prevent delete while loading
        if (!window.confirm(`Delete entry for ${format(selectedDate, 'MMMM d, yyyy')}?`)) return;
        setIsDeleting(true); setError(null); setFeedback(null);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        console.log(`Deleting journal entry for: ${formattedDate}`);
        try {
            const response = await fetch(`/api/features/journal/${formattedDate}`, { method: 'DELETE' });
            if (response.ok) {
                console.log(`Successfully deleted entry for ${formattedDate}`);
                setFeedback('Deleted!');
                editorRef.current.commands.setContent('<p></p>');
                setTimeout(() => setFeedback(null), 2000);
            } else if (response.status === 404) {
                console.warn(`Attempted to delete non-existent entry for ${formattedDate}`);
                setError('Entry not found.');
                editorRef.current.commands.setContent('<p></p>');
            } else {
                const errorData = await response.json();
                console.error(`Failed to delete entry (${response.status}):`, errorData.message);
                setError(`Delete failed: ${errorData.message || response.statusText}`);
            }
        } catch (err) {
            console.error('Network or other error deleting entry:', err);
            setError('A network error occurred while deleting.');
        } finally { setIsDeleting(false); }
    };
    // --- End API Logic ---

    // --- NEW: Week Navigation Handlers ---
     const handlePreviousWeek = () => {
        if (isLoading || isSaving || isDeleting) return;
        const newDate = subWeeks(selectedDate, 1);
        setSelectedDate(newDate);
        // displayMonthDate will be updated by the useEffect watching selectedDate
    };

    const handleNextWeek = () => {
        if (isLoading || isSaving || isDeleting) return;
        const newDate = addWeeks(selectedDate, 1);
        setSelectedDate(newDate);
        // displayMonthDate will be updated by the useEffect watching selectedDate
    };
    // --- End Week Navigation ---

    // --- Date Selection & Calculation ---
    const handleDateSelect = (date: Date) => {
        if (isLoading || isSaving || isDeleting) return;
        setSelectedDate(date);
         // displayMonthDate will be updated by the useEffect watching selectedDate
    };

    // Calculate week days based only on the selectedDate
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    const getDayLabel = (dayIndex: number): string => {
        const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return labels[dayIndex];
    };
    // --- End Date Selection ---

    if (!editor) { return <div className="flex items-center justify-center h-full w-full">Loading editor...</div>; }

    // --- JSX Structure ---
    return (
        <div className="flex flex-col h-full w-full overflow-hidden  text-gray-900 dark:text-gray-100">

            {/* Main Content Area */}
            <div className="flex flex-1 gap-4 p-3 md:p-4 overflow-hidden">
                 {/* Sidebar: Weekday Selector + Integrated Week/Month Navigation */}
                 {/* Using w-20 (80px) for slightly more space */}
                <div className="flex flex-col w-20 flex-shrink-0">
                    {/* NEW: Week Navigation & Month Display */}
                    <div className="flex items-center justify-between w-full mb-3 px-1"> {/* Added px-1 to prevent edge overflow */}
                        <button
                            onClick={handlePreviousWeek} // Use week handler
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                            aria-label="Previous week"
                            disabled={isLoading || isSaving || isDeleting}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {/* Display uses displayMonthDate state */}
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center whitespace-nowrap" title={format(displayMonthDate, 'MMMM yyyy')}>
                            {format(displayMonthDate, 'MMM yy')} {/* Format updated for brevity */}
                        </span>
                        <button
                            onClick={handleNextWeek} // Use week handler
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-30"
                            aria-label="Next week"
                            disabled={isLoading || isSaving || isDeleting}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day Buttons */}
                    <div className="flex flex-col gap-2">
                        {daysInWeek.map((day) => {
                            const dayOfWeekIndex = getDay(day);
                            const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                            const isTodayDate = isToday(day);

                            return (
                                <button
                                    key={format(day, 'yyyy-MM-dd')}
                                    onClick={() => handleDateSelect(day)}
                                    disabled={isLoading || isSaving || isDeleting}
                                    className={` /* Styling mostly unchanged */
                                        flex flex-col items-center p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900 focus:ring-black dark:focus:ring-white
                                        ${isSelected ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-300'}
                                        ${isTodayDate && !isSelected ? 'border border-gray-400 dark:border-zinc-600' : 'border border-transparent'}
                                        ${(isLoading || isSaving || isDeleting) ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <span className="text-xs font-medium opacity-80">{getDayLabel(dayOfWeekIndex)}</span>
                                    <span className="text-sm font-semibold mt-0.5">{format(day, 'd')}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Separator */}
                <div className="w-px bg-gray-200 dark:bg-zinc-700 opacity-50 flex-shrink-0" />

                {/* Editor Area (RELATIVE positioning is key here) */}
                <div className="relative flex-1 bg-white dark:bg-zinc-800/50 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col overflow-hidden">
                    {/* Editor Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200/50 dark:border-zinc-700/50 flex-shrink-0">
                         <h1 className="text-xs font-medium text-gray-500 dark:text-gray-400 opacity-80 tracking-wider uppercase">
                            Daily Journal
                        </h1>
                         <div className="text-sm text-gray-500 dark:text-gray-400 opacity-80">
                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                    </div>

                    {/* Loading Overlay - Placed before scroll container to cover header too if needed */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 flex items-center justify-center z-20"> {/* Increased z-index */}
                            <Loader2 size={24} className="animate-spin text-gray-600 dark:text-gray-400" />
                        </div>
                    )}

                    {/* Editor Content Scrollable Container */}
                    {/* Added padding-bottom (pb-16) to prevent content being hidden under the buttons */}
                    <div className="flex-grow overflow-y-auto prose dark:prose-invert max-w-none focus:outline-none relative px-4 pb-16">
                        <EditorContent editor={editor} className="min-h-[200px]" /> {/* min-h ensures some space */}
                        <ContextMenu editor={editor} />
                    </div>

                     {/* MOVED Buttons - Absolute positioning within the main editor container */}
                     {/* z-10 ensures they are above content but below loading overlay */}
                     <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                        {/* Feedback Messages */}
                        {error && <span className="text-xs text-red-500 bg-white/80 dark:bg-zinc-800/80 px-2 py-1 rounded shadow">{error}</span>}
                        {feedback && <span className="text-xs text-green-500 bg-white/80 dark:bg-zinc-800/80 px-2 py-1 rounded shadow">{feedback}</span>}

                        {/* Delete Button */}
                        <button
                            onClick={handleDelete}
                            className={`p-2 text-red-600 dark:text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm`}
                            aria-label="Delete journal entry"
                            title="Delete Entry"
                            disabled={isLoading || isSaving || isDeleting}
                        >
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className={`flex items-center gap-1 px-3 py-2 bg-black/80 text-white dark:bg-white/80 dark:text-black rounded-lg hover:bg-black dark:hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow backdrop-blur-sm`}
                            aria-label="Save journal entry"
                            disabled={isLoading || isSaving || isDeleting}
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
                            <span className="sm:hidden">{/* Icon only on small screens */}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Journal;