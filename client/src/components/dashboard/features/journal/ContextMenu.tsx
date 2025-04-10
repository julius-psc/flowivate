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
  IconGraph,
  IconMoodSmile
} from '@tabler/icons-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface ContextMenuProps {
  editor: Editor;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ editor }) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editorElement = editor.view.dom;

    const handleContextMenu = (e: MouseEvent) => {
      if (!editor.state.selection.empty) {
        e.preventDefault();
        setPosition({ x: e.clientX, y: e.clientY });
        setMenuVisible(true);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setMenuVisible(false);
        setShowEmojiPicker(false);
      }
    };

    editorElement.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', handleClickOutside);

    return () => {
      editorElement.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [editor]);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    editor.chain()
      .focus()
      .insertContent(emojiData.emoji)
      .run();
    setShowEmojiPicker(false);
    setMenuVisible(false);
  };

  if (!menuVisible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed  rounded-md shadow-lg border border-gray-200 py-1 z-50 opacity-95 backdrop-blur-sm"
      style={{ 
        top: `${position.y}px`, 
        left: `${position.x}px`,
        transform: 'translateY(-100%)'
      }}
    >
      <div className="flex p-1 space-x-1">
        <button
          onClick={() => { editor.chain().focus().toggleBold().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('bold') ? 'bg-gray-100' : ''}`}
          title="Bold"
        >
          <IconBold size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleItalic().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('italic') ? 'bg-gray-100' : ''}`}
          title="Italic"
        >
          <IconItalic size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleStrike().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('strike') ? 'bg-gray-100' : ''}`}
          title="Strikethrough"
        >
          <IconStrikethrough size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleCode().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('code') ? 'bg-gray-100' : ''}`}
          title="Code"
        >
          <IconCode size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleHighlight().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('highlight') ? 'bg-gray-100' : ''}`}
          title="Highlight"
        >
          <IconHighlight size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`p-1.5 rounded hover:bg-gray-50 ${showEmojiPicker ? 'bg-gray-100' : ''}`}
          title="Emoji"
        >
          <IconMoodSmile size={18} className="text-gray-700" />
        </button>
      </div>
      <div className="border-t border-gray-200 my-1"></div>
      <div className="flex p-1 space-x-1">
        <button
          onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-100' : ''}`}
          title="Heading 1"
        >
          <IconH1 size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-100' : ''}`}
          title="Heading 2"
        >
          <IconH2 size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-100' : ''}`}
          title="Heading 3"
        >
          <IconH3 size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleBulletList().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('bulletList') ? 'bg-gray-100' : ''}`}
          title="Bullet List"
        >
          <IconList size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().toggleOrderedList().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('orderedList') ? 'bg-gray-100' : ''}`}
          title="Numbered List"
        >
          <IconListNumbers size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => { editor.chain().focus().setParagraph().run(); setMenuVisible(false); }}
          className={`p-1.5 rounded hover:bg-gray-50 ${editor.isActive('paragraph') ? 'bg-gray-100' : ''}`}
          title="Paragraph"
        >
          <IconGraph size={18} className="text-gray-700" />
        </button>
      </div>

      {showEmojiPicker && (
        <div 
          ref={emojiRef}
          className="absolute z-50"
          style={{
            top: '100%',
            left: 0,
          }}
        >
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default ContextMenu;