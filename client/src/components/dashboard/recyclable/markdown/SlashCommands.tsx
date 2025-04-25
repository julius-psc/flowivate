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
            // Filtering logic remains the same
            if (query.toLowerCase() !== 'emoji'.substring(0, query.length)) {
               const emojiItem = commands.find(item => item.title === 'Emoji');
               const otherItems = commands.filter(item => item.title !== 'Emoji');
               const filteredItems = otherItems.filter((item) =>
                item.title.toLowerCase().startsWith(query.toLowerCase())
               );
               if (emojiItem && (query === '' || 'emoji'.toLowerCase().startsWith(query.toLowerCase()))) {
                 return [emojiItem, ...filteredItems];
               }
               return filteredItems;
            }
            return commands.filter((item) =>
              item.title.toLowerCase().startsWith(query.toLowerCase())
            );
          },
          render: () => {
            let popup: HTMLElement | null = null;
            let emojiPickerContainer: HTMLElement | null = null;
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
              if (emojiPickerContainer) {
                emojiPickerContainer.remove();
                emojiPickerContainer = null;
              }
              if (popup) {
                // Remove click outside listener before removing popup
                document.removeEventListener('mousedown', handleClickOutside);
                popup.remove();
                popup = null;
              }
            };

            // --- Click Outside Handler ---
            // Defined here so it can be added/removed correctly in onStart/cleanup
            const handleClickOutside = (event: MouseEvent) => {
                // Check if popup exists and if the click target is outside BOTH popup and emoji picker
                if (popup && !popup.contains(event.target as Node) &&
                    (!emojiPickerContainer || !emojiPickerContainer.contains(event.target as Node))) {
                    cleanup();
                    // No need to remove listener here, cleanup does it
                }
            };


            const createPopup = () => {
              // Popup creation logic remains the same
              const popupElement = document.createElement("div");
              popupElement.classList.add(
                "absolute", "z-50", "rounded-lg", "border", "border-white/30",
                "bg-white/75", "backdrop-blur-lg", "shadow-lg", "py-2",
                "max-h-64", "overflow-y-auto", "w-56"
              );
              popupElement.style.minWidth = "200px";
              return popupElement;
            };

            const showEmojiPicker = (editor: Editor, range: { from: number; to: number }) => {
              // Emoji picker logic remains the same
              if (emojiRoot) emojiRoot.unmount();
              if (emojiPickerContainer) emojiPickerContainer.remove();

              emojiPickerContainer = document.createElement("div");
              emojiPickerContainer.classList.add(
                "absolute", "z-[51]", "mt-2", "rounded-lg", "border",
                "border-white/30", "bg-white/75", "backdrop-blur-lg",
                "shadow-lg", "overflow-hidden"
              );
              emojiRoot = createRoot(emojiPickerContainer);

              const handleEmojiClick = (emojiData: EmojiClickData) => {
                editor.chain().focus().deleteRange(range).insertContent(emojiData.emoji).run();
                cleanup();
              };

              emojiRoot.render(<EmojiPicker onEmojiClick={handleEmojiClick} />);
              popup?.appendChild(emojiPickerContainer);
              emojiPickerContainer.style.top = `100%`;
              emojiPickerContainer.style.left = `0px`;
            };


            const updatePopup = (
              items: CommandItem[],
              editor: Editor,
              range: { from: number; to: number }
            ) => {
              // Update popup content logic remains largely the same
              currentItems = items;
              if (!popup) return;

              if (emojiPickerContainer) {
                  emojiPickerContainer.remove();
                  emojiPickerContainer = null;
                  if(emojiRoot) emojiRoot.unmount();
                  emojiRoot = null;
              }

              popup.innerHTML = "";

              if (items.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.classList.add("px-3", "py-2", "text-sm", "text-neutral-600");
                emptyMessage.textContent = "No commands found";
                popup.appendChild(emptyMessage);
                return;
              }

              items.forEach((item, index) => {
                const button = document.createElement("button");
                button.classList.add(
                  "flex", "items-center", "w-full", "px-3", "py-1.5", "text-sm",
                  "text-left", "hover:bg-white/20", "gap-2.5", "transition-colors",
                  "duration-150", "rounded-md", "text-neutral-800"
                );
                if (index === selectedIndex) {
                  button.classList.add("bg-white/30");
                }

                const iconContainer = document.createElement("div");
                iconContainer.classList.add("flex", "items-center", "justify-center", "w-5", "h-5", "text-neutral-700");

                if (item.icon) {
                  if (isValidElement(item.icon)) {
                    const iconElement = item.icon as ReactElement<{ className?: string }>;
                    const root = createRoot(iconContainer);
                    root.render(cloneElement(iconElement, { className: "w-5 h-5" }));
                    iconRoots.set(iconContainer, root);
                  }
                } else {
                  iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd" /></svg>`;
                }

                const textContainer = document.createElement("div");
                textContainer.classList.add("flex-1", "truncate", "text-neutral-800");
                textContainer.textContent = item.title;

                button.appendChild(iconContainer);
                button.appendChild(textContainer);

                button.addEventListener("click", () => {
                   if (item.title !== "Emoji" && emojiPickerContainer) {
                     cleanup(); // Use cleanup to remove everything
                   }

                  if (item.title === "Emoji") {
                    if (!emojiPickerContainer) {
                      showEmojiPicker(editor, range);
                    }
                  } else {
                    item.command({ editor });
                    cleanup();
                  }
                });
                popup?.appendChild(button);
              });
            };

            // --- Function to set Popup Position ---
// --- Function to set Popup Position ---
            // Extracted for reuse in onStart and onUpdate
            const setPopupPosition = (props: SuggestionProps<CommandItem>) => {
              if (!props.clientRect || !popup) return;

              const rect = props.clientRect();
              if (!rect) {
                // Fallback positioning if rect is not available
                popup.style.position = 'fixed'; // Use fixed for center fallback
                popup.style.top = '50%';
                popup.style.left = '50%';
                popup.style.transform = 'translate(-50%, -50%)';
                return;
              }

              popup.style.position = 'absolute'; // Use absolute for positioning relative to document
              popup.style.transform = 'translateY(0)'; // Reset any previous transform

              // Measure dimensions (needed for checks and positioning)
              // Ensure popup has content before measuring for accuracy.
              const popupHeight = popup.offsetHeight || 150; // Fallback height estimate
              const popupWidth = popup.offsetWidth || 224; // Fallback width estimate (w-56 based on your CSS)
              const bodyWidth = document.body.clientWidth; // Viewport width
              const viewportHeight = window.innerHeight; // Viewport height

              // --- Horizontal Positioning (Left) --- (Remains the same)
              let finalLeft = rect.left + window.scrollX;
              // Adjust left if going off-screen right
              if (finalLeft + popupWidth > bodyWidth) {
                  finalLeft = bodyWidth - popupWidth - 10; // Adjust with padding
              }
              // Ensure left doesn't go negative (off-screen left)
              if (finalLeft < 0) {
                  finalLeft = 10; // Set a small positive padding
              }
              popup.style.left = `${finalLeft}px`;

              // --- UPDATED: Vertical Positioning (Top) ---
              const spaceBelow = viewportHeight - rect.bottom; // Space available below cursor in viewport
              const spaceAbove = rect.top; // Space available above cursor in viewport

              // Default: Try placing below the cursor (more common UI)
              let finalTop = rect.bottom + window.scrollY + 5; // 5px margin below cursor's bottom edge

              // Check if it overflows the bottom of the viewport *and* if there's enough space above
              // We prefer placing below unless it overflows *and* placing above fits better.
              if (popupHeight > spaceBelow && spaceAbove > popupHeight) {
                  // It overflows below, BUT it fits above, so place it above.
                  finalTop = rect.top + window.scrollY - popupHeight - 5; // 5px margin above cursor's top edge
              }
              // Note: If it overflows below AND overflows above, this logic will still place it below.
              // You could add further logic here to constrain max-height if necessary in extreme cases.

              popup.style.top = `${finalTop}px`;
              // --- END UPDATED Vertical Positioning ---
            };


            return {
              onStart: (props: SuggestionProps<CommandItem>) => {
                cleanup(); // Cleanup potential previous instances
                popup = createPopup();
                selectedIndex = 0; // Reset selection

                // Initial render of items (might be empty initially)
                updatePopup(props.items, this.editor, props.range);

                // Append to body *before* positioning calculation that needs offsetHeight
                document.body.appendChild(popup);

                // Set initial position
                setPopupPosition(props);

                // Add click outside listener *after* popup is created and positioned
                // Use timeout to prevent immediate closing if onStart is triggered by mousedown
                setTimeout(() => {
                  document.addEventListener('mousedown', handleClickOutside);
                }, 0);
              },

              onUpdate: (props: SuggestionProps<CommandItem>) => {
                 if (!popup) return;
                 updatePopup(props.items, this.editor, props.range);
                 // Reposition the popup based on new items/cursor position
                 setPopupPosition(props);
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                 // Keydown logic remains the same
                if (emojiPickerContainer && document.activeElement && emojiPickerContainer.contains(document.activeElement)) {
                    if (props.event.key === 'Escape') {
                       cleanup();
                       return true;
                    }
                    return false; // Let emoji picker handle other keys
                }

                if (!popup || currentItems.length === 0) return false;

                const { event } = props;

                if (event.key === "ArrowDown") {
                  selectedIndex = (selectedIndex + 1) % currentItems.length;
                  updatePopup(currentItems, this.editor, props.range);
                  popup.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
                  return true;
                }

                if (event.key === "ArrowUp") {
                  selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
                  updatePopup(currentItems, this.editor, props.range);
                  popup.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
                  return true;
                }

                if (event.key === "Enter") {
                  event.preventDefault();
                  const item = currentItems[selectedIndex];
                  if (item) {
                    if (item.title === "Emoji") {
                       if (emojiPickerContainer) {
                           cleanup();
                       } else {
                           showEmojiPicker(this.editor, props.range);
                           // Keep popup open when opening emoji picker
                           return true; // Handled, prevent default close
                       }
                    } else {
                      item.command({ editor: this.editor });
                      cleanup(); // Close after executing command
                    }
                  }
                  return true;
                }

                 if (event.key === "Escape") {
                    cleanup();
                    return true;
                 }

                return false;
              },

              onExit: () => {
                // Cleanup immediately on exit
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