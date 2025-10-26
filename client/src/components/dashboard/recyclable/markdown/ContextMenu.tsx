"use client";

import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconHighlight,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconMoodSmile,
} from "@tabler/icons-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface ContextMenuProps {
  editor: Editor;
}

const getButtonClasses = (isActive: boolean) =>
  `flex items-center justify-center w-7 h-7 text-sm hover:bg-gray-50 dark:hover:bg-[#1a1a1c] transition-colors duration-100 rounded text-gray-700 dark:text-gray-300 cursor-pointer ${
    isActive ? "bg-gray-50 dark:bg-[#1a1a1c] text-gray-900 dark:text-white" : ""
  }`;

export const ContextMenu: React.FC<ContextMenuProps> = ({ editor }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor) return;
    const editorElement = editor.view.dom;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      const { from, to } = editor.state.selection;
      if (from === to) {
        setMenuVisible(false);
        setShowEmojiPicker(false);
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const selectionRect = range.getBoundingClientRect();
      const containerRect = editorElement.getBoundingClientRect();

      const menuWidth = 208;
      const menuHeight = 48;
      const xPos =
        selectionRect.left -
        containerRect.left +
        selectionRect.width / 2 -
        menuWidth / 2;
      let yPos = selectionRect.top - containerRect.top - menuHeight - 8;

      if (yPos < 0) {
        yPos = selectionRect.bottom - containerRect.top + 8;
      }

      setPosition({
        x: Math.max(0, xPos),
        y: Math.max(0, yPos),
      });

      setMenuVisible(true);
      setShowEmojiPicker(false);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuVisible &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        (!emojiRef.current || !emojiRef.current.contains(e.target as Node))
      ) {
        setMenuVisible(false);
        setShowEmojiPicker(false);
      }
    };

    editorElement.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("click", handleClickOutside, true);

    const handleSelectionUpdate = () => {
      if (editor.state.selection.empty) {
        setMenuVisible(false);
        setShowEmojiPicker(false);
      }
    };
    editor.on("selectionUpdate", handleSelectionUpdate);

    return () => {
      editorElement.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("click", handleClickOutside, true);
      editor.off("selectionUpdate", handleSelectionUpdate);
    };
  }, [editor, menuVisible]);

  const handleAction = (action: () => void) => {
    action();
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    editor.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
    setMenuVisible(false);
  };

  if (!menuVisible || !editor) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214] p-1.5 w-52"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-wrap gap-0.5 mb-1">
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleBold().run())
          }
          className={getButtonClasses(editor.isActive("bold"))}
          title="Bold (Ctrl+B)"
        >
          <IconBold size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleItalic().run())
          }
          className={getButtonClasses(editor.isActive("italic"))}
          title="Italic (Ctrl+I)"
        >
          <IconItalic size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleStrike().run())
          }
          className={getButtonClasses(editor.isActive("strike"))}
          title="Strikethrough (Ctrl+Shift+X)"
        >
          <IconStrikethrough size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleCode().run())
          }
          className={getButtonClasses(editor.isActive("code"))}
          title="Code (Ctrl+E)"
        >
          <IconCode size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleHighlight().run())
          }
          className={getButtonClasses(editor.isActive("highlight"))}
          title="Highlight"
        >
          <IconHighlight size={16} />
        </button>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={getButtonClasses(showEmojiPicker)}
          title="Emoji"
        >
          <IconMoodSmile size={16} />
        </button>
      </div>

      <div className="flex flex-wrap gap-0.5">
        <button
          onClick={() =>
            handleAction(() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            )
          }
          className={getButtonClasses(editor.isActive("heading", { level: 1 }))}
          title="Heading 1 (Ctrl+Alt+1)"
        >
          <IconH1 size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            )
          }
          className={getButtonClasses(editor.isActive("heading", { level: 2 }))}
          title="Heading 2 (Ctrl+Alt+2)"
        >
          <IconH2 size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            )
          }
          className={getButtonClasses(editor.isActive("heading", { level: 3 }))}
          title="Heading 3 (Ctrl+Alt+3)"
        >
          <IconH3 size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().setParagraph().run())
          }
          className={getButtonClasses(editor.isActive("paragraph"))}
          title="Paragraph (Ctrl+Alt+0)"
        >
          <span className="text-xs font-medium">p</span>
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleBulletList().run())
          }
          className={getButtonClasses(editor.isActive("bulletList"))}
          title="Bullet List (Ctrl+Shift+8)"
        >
          <IconList size={16} />
        </button>
        <button
          onClick={() =>
            handleAction(() => editor.chain().focus().toggleOrderedList().run())
          }
          className={getButtonClasses(editor.isActive("orderedList"))}
          title="Numbered List (Ctrl+Shift+7)"
        >
          <IconListNumbers size={16} />
        </button>
      </div>

      {showEmojiPicker && (
        <div
          ref={emojiRef}
          className="absolute z-[51] rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121214]"
          style={{
            top: `${
              position.y < 0 ? position.y + 48 + 8 : position.y + 48 + 8
            }px`,
            left: `${position.x}px`,
            width: "350px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            width="100%"
            height="100%"
          />
        </div>
      )}
    </div>
  );
};

export default ContextMenu;