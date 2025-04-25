"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
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
  IconGraph, // Assuming this is for Paragraph
  IconMoodSmile
} from '@tabler/icons-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ContextMenuProps {
  editor: Editor;
}

// Helper function to create button classes
const getButtonClasses = (isActive: boolean) => {
  const base = "p-1.5 rounded-md hover:bg-white/20 transition-colors duration-150 text-neutral-800"; // Smaller padding, updated hover/text
  const active = isActive ? "bg-white/30" : ""; // Updated active bg
  return `${base} ${active}`;
};

export const ContextMenu: React.FC<ContextMenuProps> = ({ editor }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null); // Ref for the emoji picker container

  useEffect(() => {
    if (!editor) return; // Guard clause
    const editorElement = editor.view.dom;

    const handleContextMenu = (e: MouseEvent) => {
      // Only show menu if there's a non-collapsed selection
      const { from, to } = editor.state.selection;
      if (from !== to) {
        e.preventDefault();

        // --- Calculate position ---
        const menuWidth = 300; // Estimate menu width
        const menuHeight = 100; // Estimate menu height (adjust based on content)
        let xPos = e.clientX;
        let yPos = e.clientY;

        // Adjust horizontally if too close to the right edge
        if (xPos + menuWidth > window.innerWidth) {
          xPos = window.innerWidth - menuWidth - 10; // Add some padding
        }
        // Adjust vertically: prefer above cursor, but go below if no space
        if (yPos - menuHeight < 0) {
            yPos = e.clientY + 10; // Place below cursor
        } else {
            yPos = e.clientY - menuHeight - 10; // Place above cursor
             // Readjust based on the new transform translateY(-100%) is removed now
             yPos = e.clientY - 10; // Place just above cursor
        }

        setPosition({ x: xPos, y: yPos });
        setMenuVisible(true);
        setShowEmojiPicker(false); // Close emoji picker when menu re-opens
      } else {
        // If selection is collapsed, ensure menu is hidden
        setMenuVisible(false);
        setShowEmojiPicker(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Check if click is outside the main menu AND outside the emoji picker
      if (menuVisible &&
          menuRef.current && !menuRef.current.contains(e.target as Node) &&
          (!emojiRef.current || !emojiRef.current.contains(e.target as Node)) // Only check emojiRef if it exists
         )
      {
        setMenuVisible(false);
        setShowEmojiPicker(false);
      }
    };

    editorElement.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside, true); // Use capture phase for reliability

    // Listener for selection changes to hide menu if selection collapses
    const handleSelectionUpdate = () => {
        if (editor.state.selection.empty) {
            setMenuVisible(false);
            setShowEmojiPicker(false);
        }
    };
    editor.on('selectionUpdate', handleSelectionUpdate);


    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside, true);
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, menuVisible]); // Add menuVisible dependency to re-evaluate click outside listener attachment


  const handleAction = (action: () => void) => {
    action();
    // Keep menu visible after action for potential further formatting
    // setMenuVisible(false);
    setShowEmojiPicker(false); // Close emoji picker on any action
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    editor.chain()
      .focus()
      .insertContent(emojiData.emoji)
      .run();
    setShowEmojiPicker(false);
    setMenuVisible(false); // Close main menu after inserting emoji
  };

  if (!menuVisible || !editor) return null;

  return (
    <div
      ref={menuRef}
      // --- MODIFICATION START: Main Container Styling ---
      className="fixed flex flex-col rounded-lg border border-white/30 bg-white/75 backdrop-blur-lg shadow-lg z-50 p-1.5 space-y-1" // Added flex-col, padding, space-y
      // --- MODIFICATION END: Main Container Styling ---
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
        // Removed transform: 'translateY(-100%)' - adjust positioning logic if needed
      }}
      // Prevent context menu on the menu itself
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* --- Group 1: Inline Styles --- */}
      <div className="flex px-1 space-x-1"> {/* Reduced spacing */}
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleBold().run())}
          className={getButtonClasses(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <IconBold size={18} /> {/* Slightly smaller icons */}
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleItalic().run())}
          className={getButtonClasses(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <IconItalic size={18} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleStrike().run())}
          className={getButtonClasses(editor.isActive('strike'))}
          title="Strikethrough (Ctrl+Shift+X)"
        >
          <IconStrikethrough size={18} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleCode().run())}
          className={getButtonClasses(editor.isActive('code'))}
          title="Code (Ctrl+E)"
        >
          <IconCode size={18} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleHighlight().run())}
          className={getButtonClasses(editor.isActive('highlight'))}
          title="Highlight"
        >
          <IconHighlight size={18} />
        </button>
         {/* --- MODIFICATION: Conditional divider only if Emoji button is next --- */}
        {/* <div className="border-l border-white/20 mx-1 h-5 self-center"></div> */}
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)} // Toggle emoji picker visibility
          className={getButtonClasses(showEmojiPicker)} // Style based on showEmojiPicker state
          title="Emoji"
        >
          <IconMoodSmile size={18} />
        </button>
      </div>

      {/* --- MODIFICATION: Optional Divider --- */}
      {/* <div className="border-t border-white/20 my-1 mx-1"></div> */}

      {/* --- Group 2: Block Styles --- */}
      <div className="flex px-1 space-x-1"> {/* Reduced spacing */}
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
          className={getButtonClasses(editor.isActive('heading', { level: 1 }))}
          title="Heading 1 (Ctrl+Alt+1)"
        >
          <IconH1 size={18} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
          className={getButtonClasses(editor.isActive('heading', { level: 2 }))}
          title="Heading 2 (Ctrl+Alt+2)"
        >
          <IconH2 size={18} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
          className={getButtonClasses(editor.isActive('heading', { level: 3 }))}
          title="Heading 3 (Ctrl+Alt+3)"
        >
          <IconH3 size={18} />
        </button>
         <button
          onClick={() => handleAction(() => editor.chain().focus().setParagraph().run())}
          className={getButtonClasses(editor.isActive('paragraph'))}
          title="Paragraph (Ctrl+Alt+0)"
        >
          <IconGraph size={18} /> {/* Using IconGraph for Paragraph */}
        </button>
         <button
          onClick={() => handleAction(() => editor.chain().focus().toggleBulletList().run())}
          className={getButtonClasses(editor.isActive('bulletList'))}
          title="Bullet List (Ctrl+Shift+8)"
        >
          <IconList size={18} />
        </button>
        <button
          onClick={() => handleAction(() => editor.chain().focus().toggleOrderedList().run())}
          className={getButtonClasses(editor.isActive('orderedList'))}
          title="Numbered List (Ctrl+Shift+7)"
        >
          <IconListNumbers size={18} />
        </button>
      </div>

      {/* --- Emoji Picker Section --- */}
      {showEmojiPicker && (
        <div
          ref={emojiRef} // Assign ref
          // --- MODIFICATION START: Emoji Picker Container Styling ---
          className="absolute mt-2 rounded-lg border border-white/30 bg-white/75 backdrop-blur-lg shadow-lg z-[51] overflow-hidden" // Apply glass effect, ensure z-index
          // --- MODIFICATION END: Emoji Picker Container Styling ---
          style={{
            // Position below the main menu
            top: '100%', // Place it right below the menu
            left: '0', // Align left edge with menu's left edge
            // Optional: Adjust left based on where the emoji button is, if needed
            // left: `${emojiButtonRef.current?.offsetLeft || 0}px`,
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            // Attempt to make picker background transparent if the library supports it
             // Example: pickerStyle={{ background: 'transparent', border: 'none' }}
             // Check EmojiPicker component documentation for exact props
          />
        </div>
      )}
    </div>
  );
};

export default ContextMenu;