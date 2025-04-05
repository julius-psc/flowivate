"use client"

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, getDay, isToday } from 'date-fns';
import { EditorContent, useEditor, Editor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import { SlashCommands } from './SlashCommands';
import { ContextMenu } from './ContextMenu';

interface JournalProps {
  initialDate?: Date;
}

const lowlight = createLowlight();
lowlight.register('typescript', typescript);
lowlight.register('javascript', javascript);

export const Journal: React.FC<JournalProps> = ({ initialDate = new Date() }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [journalContent, setJournalContent] = useState<string>('');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

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

  const editor = useEditor({
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
          return 'Type $ for commands or start writing...';
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      Highlight,
      CodeBlockLowlight.configure({ lowlight }),
      SlashCommands(slashCommandItems),
      Extension.create({
        name: 'enterHandler',
        addKeyboardShortcuts() {
          return {
            Enter: () => {
              const { state } = this.editor;
              const { selection } = state;
              const { $from, empty } = selection;

              if (empty && $from.parent.type.name !== 'paragraph') {
                const atEnd = $from.parentOffset === $from.parent.nodeSize - 2;
                if (atEnd) {
                  return this.editor.commands.insertContent({ type: 'paragraph' });
                }
              }
              return false;
            },
          };
        },
      }),
    ],
    content: journalContent,
    onUpdate: ({ editor }) => {
      setJournalContent(editor.getHTML());
    },
  });

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  useEffect(() => {
    const newContent = `<p></p>`;
    setJournalContent(newContent);
    if (editor) {
      editor.commands.setContent(newContent);
    }
  }, [selectedDate, editor]);

  const getDayLabel = (day: number) => {
    const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    return labels[day];
  };

  if (!editor) return <div className="flex items-center justify-center h-screen">Loading editor...</div>;

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-50">
      <div className="flex flex-col w-16">
        <h3 className="text-sm font-medium text-gray-500 opacity-50 mb-4">
          {format(selectedDate, 'MMMM')}
        </h3>
        <div className="flex flex-col gap-2">
          {daysInWeek.map((day) => {
            const dayOfWeek = getDay(day);
            const isSelected = format(selectedDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
            const isTodayDate = isToday(day);

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => handleDateSelect(day)}
                className={`
                  flex flex-col items-center p-2 rounded-lg transition-colors
                  ${isSelected ? 'bg-black text-white' : 'hover:bg-gray-100'}
                  ${isTodayDate && !isSelected ? 'border border-gray-300' : ''}
                `}
              >
                <span className="text-xs font-medium">{getDayLabel(dayOfWeek)}</span>
                <span className="text-sm font-semibold">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-px h-[80vh] bg-gray-200 opacity-30" />
      <div className="w-[600px] h-[80vh] bg-white rounded-lg shadow-sm relative overflow-hidden">
        <div className="absolute top-2 right-2 text-sm text-gray-500 opacity-50 pointer-events-none">
          {format(selectedDate, 'MMMM d, yyyy')}
        </div>
        <div className="h-full w-full p-4 pt-8 overflow-y-auto">
          <EditorContent
            editor={editor}
            className="h-full w-full max-w-none focus:outline-none"
            style={{
              listStyleType: 'disc',
              paddingLeft: '1em',
            }}
          />
          <ContextMenu editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default Journal;