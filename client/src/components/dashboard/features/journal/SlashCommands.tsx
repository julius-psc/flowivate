"use client";

import { Extension } from "@tiptap/core";
import { ReactNode, isValidElement, cloneElement, ReactElement } from "react";
import { Editor } from "@tiptap/react";
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { createRoot, Root } from "react-dom/client";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

export interface CommandItem {
  title: string;
  command: ({ editor }: { editor: Editor }) => void;
  icon?: ReactNode;
}

type SlashCommandProps = CommandItem[];

export const SlashCommands = (commands: SlashCommandProps) => {
  return Extension.create({
    name: "slashCommands",

    addProseMirrorPlugins() {
      return [
        Suggestion<CommandItem>({
          editor: this.editor,
          char: "$",
          startOfLine: false,
          command: ({ editor, range, props }) => {
            if (props.command) {
              props.command({ editor });
              editor.chain().focus().deleteRange(range).run();
            }
          },
          items: ({ query }: { query: string }) => {
            return commands.filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase())
            );
          },
          render: () => {
            let popup: HTMLElement | null = null;
            let emojiPicker: HTMLElement | null = null;
            let selectedIndex = 0;
            let currentItems: CommandItem[] = [];
            const iconRoots: Map<HTMLElement, Root> = new Map();
            let emojiRoot: Root | null = null;

            const cleanup = () => {
              iconRoots.forEach((root) => root.unmount());
              iconRoots.clear();
              if (emojiRoot) {
                emojiRoot.unmount();
                emojiRoot = null;
              }
              if (emojiPicker) {
                emojiPicker.remove();
                emojiPicker = null;
              }
              if (popup) {
                popup.remove();
                popup = null;
              }
            };

            const createPopup = () => {
              const popupElement = document.createElement("div");
              popupElement.classList.add(
                "absolute",
                "z-50",
                "bg-white",
                "rounded-lg",
                "shadow-lg",
                "border",
                "border-gray-200",
                "py-1",
                "max-h-64",
                "overflow-y-auto",
                "w-56",
                "transition-opacity",
                "duration-100"
              );
              popupElement.style.minWidth = "200px";
              return popupElement;
            };

            const showEmojiPicker = (editor: Editor, range: { from: number; to: number }) => {
              cleanup(); 
              emojiPicker = document.createElement("div");
              emojiPicker.classList.add("absolute", "z-50");
              emojiRoot = createRoot(emojiPicker);
            
              const handleEmojiClick = (emojiData: EmojiClickData) => {
                editor.chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent(emojiData.emoji)
                  .run();
                cleanup();
              };
            
              emojiRoot.render(
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              );
            
              // Get cursor coordinates
              const coords = editor.view.coordsAtPos(range.from);
              
              // Calculate optimal position
              const pickerHeight = 450; 
              const pickerWidth = 350;  
              const padding = 10;
              
              let top = coords.bottom + window.scrollY + padding;
              let left = coords.left + window.scrollX;
            
              // Adjust if going off bottom of viewport
              if (top + pickerHeight > window.innerHeight + window.scrollY) {
                top = coords.top + window.scrollY - pickerHeight - padding;
              }
            
              // Adjust if going off right of viewport
              if (left + pickerWidth > window.innerWidth + window.scrollX) {
                left = window.innerWidth + window.scrollX - pickerWidth - padding;
              }
            
              // Ensure it doesn't go off top or left
              top = Math.max(padding, top);
              left = Math.max(padding, left);
            
              emojiPicker.style.top = `${top}px`;
              emojiPicker.style.left = `${left}px`;
              
              document.body.appendChild(emojiPicker);
            };

            const updatePopup = (
              items: CommandItem[],
              editor: Editor,
              range: { from: number; to: number }
            ) => {
              currentItems = items;
              if (!popup) return;

              popup.innerHTML = "";

              if (items.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.classList.add("px-3", "py-2", "text-sm", "text-gray-500");
                emptyMessage.textContent = "No commands found";
                popup.appendChild(emptyMessage);
                return;
              }

              items.forEach((item, index) => {
                const button = document.createElement("button");
                button.classList.add(
                  "flex",
                  "items-center",
                  "w-full",
                  "px-3",
                  "py-2",
                  "text-sm",
                  "text-left",
                  "hover:bg-gray-50",
                  "gap-2",
                  "transition-colors",
                  "duration-75"
                );
                if (index === selectedIndex) {
                  button.classList.add("bg-gray-50");
                }

                const iconContainer = document.createElement("div");
                iconContainer.classList.add(
                  "flex",
                  "items-center",
                  "justify-center",
                  "w-5",
                  "h-5",
                  "rounded",
                  "bg-gray-100",
                  "text-gray-600"
                );

                if (item.icon) {
                  if (isValidElement(item.icon)) {
                    const iconElement = item.icon as ReactElement<{ className?: string }>;
                    const root = createRoot(iconContainer);
                    root.render(
                      cloneElement(iconElement, {
                        className: "w-4 h-4",
                      })
                    );
                    iconRoots.set(iconContainer, root);
                  } else {
                    iconContainer.innerHTML = item.icon as string;
                  }
                } else {
                  iconContainer.innerHTML = "•";
                }

                const textContainer = document.createElement("div");
                textContainer.classList.add("flex-1", "truncate");
                textContainer.textContent = item.title;

                button.appendChild(iconContainer);
                button.appendChild(textContainer);

                button.addEventListener("click", () => {
                  if (item.title === "Emoji") {
                    showEmojiPicker(editor, range);
                  } else {
                    item.command({ editor });
                    editor.chain().focus().deleteRange(range).run();
                    cleanup();
                  }
                });

                popup?.appendChild(button);
              });
            };

            return {
              onStart: (props: SuggestionProps<CommandItem>) => {
                popup = createPopup();
                updatePopup(props.items, this.editor, props.range);

                if (props.clientRect) {
                  const rect = props.clientRect();
                  if (rect) {
                    popup.style.top = `${rect.bottom + window.scrollY}px`;
                    popup.style.left = `${rect.left + window.scrollX}px`;
                  }
                }

                document.body.appendChild(popup);
              },

              onUpdate: (props: SuggestionProps<CommandItem>) => {
                updatePopup(props.items, this.editor, props.range);
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (!popup) return false;

                const { event } = props;

                if (event.key === "ArrowDown") {
                  selectedIndex = (selectedIndex + 1) % currentItems.length;
                  updatePopup(currentItems, this.editor, props.range);
                  return true;
                }

                if (event.key === "ArrowUp") {
                  selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
                  updatePopup(currentItems, this.editor, props.range);
                  return true;
                }

                if (event.key === "Enter") {
                  const item = currentItems[selectedIndex];
                  if (item) {
                    if (item.title === "Emoji") {
                      showEmojiPicker(this.editor, props.range);
                    } else {
                      item.command({ editor: this.editor });
                      this.editor.chain().focus().deleteRange(props.range).run();
                      cleanup();
                    }
                  }
                  return true;
                }

                return false;
              },

              onExit: () => {
                cleanup();
              },
            };
          },
        }),
      ];
    },
  });
};

export default SlashCommands;