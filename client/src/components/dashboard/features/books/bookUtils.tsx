import { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Extension } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import typescript from "highlight.js/lib/languages/typescript";
import javascript from "highlight.js/lib/languages/javascript";
import { SlashCommands } from "../../recyclable/markdown/SlashCommands";
import { format as formatDateFns } from "date-fns";

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

export const lowlight = createLowlight();
lowlight.register("typescript", typescript);
lowlight.register("javascript", javascript);

export const slashCommandItems = [
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
    command: ({ }: { editor: Editor }) => { },
    icon: <span>😊</span>,
  },
];

export const editorExtensions = [
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
];

export const getStatusLabel = (status: Book["status"]) => {
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

export const getStatusColor = (status: Book["status"]) => {
  switch (status) {
    case "not-started":
      return "bg-gray-500";
    case "in-progress":
      return "bg-yellow-500";
    case "completed":
      return "bg-green-500";
    default:
      return "bg-gray-500";
  }
};

export const formatDate = (dateString: string | Date) => {
  if (!dateString) return "Not specified";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  return formatDateFns(date, "MMMM d, yyyy");
};