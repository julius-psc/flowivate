"use client";

import { Extension } from "@tiptap/core";
import { ReactNode, isValidElement, cloneElement, ReactElement } from "react";
import { Editor } from "@tiptap/react";
import Suggestion, {
  SuggestionProps,
  SuggestionKeyDownProps,
} from "@tiptap/suggestion";
import { createRoot, Root } from "react-dom/client";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

export interface CommandItem {
  title: string;
  command: ({ editor }: { editor: Editor }) => void;
  icon?: ReactNode;
}

type SlashCommandProps = CommandItem[];

interface SuggestionPropsWithClientRect extends SuggestionProps<CommandItem> {
  clientRect?: (() => DOMRect | null) | null | undefined;
}

export const SlashCommands = (commands: SlashCommandProps) => {
  return Extension.create({
    name: "slashCommands",

    addProseMirrorPlugins() {
      return [
        Suggestion<CommandItem>({
          editor: this.editor,
          char: "$",
          startOfLine: false,
          command: ({ editor, props }) => {
            if (props.command) {
              props.command({ editor });
            }
          },
          allowSpaces: true,
          items: ({ query }: { query: string }) => {
            if (query.toLowerCase() !== "emoji".substring(0, query.length)) {
              const emojiItem = commands.find((item) => item.title === "Emoji");
              const otherItems = commands.filter(
                (item) => item.title !== "Emoji"
              );
              const filteredItems = otherItems.filter((item) =>
                item.title.toLowerCase().startsWith(query.toLowerCase())
              );
              if (
                emojiItem &&
                (query === "" ||
                  "emoji".toLowerCase().startsWith(query.toLowerCase()))
              ) {
                return [emojiItem, ...filteredItems];
              }
              return filteredItems;
            }
            return commands.filter((item) =>
              item.title.toLowerCase().startsWith(query.toLowerCase())
            );
          },
          render: () => {
            let popup: HTMLElement | null = document.createElement("div");
            let emojiPickerContainer: HTMLElement | null = null;
            let selectedIndex = 0;
            let currentItems: CommandItem[] = [];
            const iconRoots: Map<HTMLElement, Root> = new Map();
            let emojiRoot: Root | null = null;
            let activeClientRect: (() => DOMRect | null | undefined) | null =
              null;

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
                document.removeEventListener("mousedown", handleClickOutside);
                popup.remove();
                popup = null;
              }
              selectedIndex = 0;
              currentItems = [];
              activeClientRect = null;
            };

            const handleClickOutside = (event: MouseEvent) => {
              if (
                popup &&
                !popup.contains(event.target as Node) &&
                (!emojiPickerContainer ||
                  !emojiPickerContainer.contains(event.target as Node))
              ) {
                cleanup();
              }
            };

            const createPopup = () => {
              popup = document.createElement("div");
              popup.classList.add(
                "absolute",
                "z-50",
                "rounded-lg",
                "border",
                "border-white/30",
                "bg-white",
                "dark:bg-[#1f1f1f]",
                "dark:border-white/20",
                "backdrop-blur-lg",
                "shadow-lg",
                "py-2",
                "overflow-y-auto",
                "w-56"
              );
              popup.style.minWidth = "200px";
              return popup;
            };

            const setPopupPosition = (props: SuggestionPropsWithClientRect) => {
              if (!props.clientRect || !popup) return;

              const rect = props.clientRect();
              if (!rect) {
                // Fallback positioning if rect is not available
                popup.style.position = "fixed";
                popup.style.top = "50%";
                popup.style.left = "50%";
                popup.style.transform = "translate(-50%, -50%)";
                return;
              }

              popup.style.position = "absolute";
              popup.style.transform = "translateY(0)";

              // Measure dimensions
              const popupHeight = popup.offsetHeight || 150;
              const popupWidth = popup.offsetWidth || 224;
              const bodyWidth = document.body.clientWidth;
              const viewportHeight = window.innerHeight;

              // Horizontal positioning
              let finalLeft = rect.left + window.scrollX;
              if (finalLeft + popupWidth > bodyWidth) {
                finalLeft = bodyWidth - popupWidth - 10;
              }
              if (finalLeft < 0) {
                finalLeft = 10;
              }
              popup.style.left = `${finalLeft}px`;

              // Vertical positioning
              const spaceBelow = viewportHeight - rect.bottom;
              const spaceAbove = rect.top;
              let finalTop = rect.bottom + window.scrollY + 5;

              if (popupHeight > spaceBelow && spaceAbove > popupHeight) {
                finalTop = rect.top + window.scrollY - popupHeight - 5;
              }
              popup.style.top = `${finalTop}px`;
            };

            const showEmojiPicker = (
              editor: Editor,
              range: { from: number; to: number },
              clientRect?: (() => DOMRect | null | undefined) | null
            ) => {
              if (emojiRoot) emojiRoot.unmount();
              if (emojiPickerContainer) emojiPickerContainer.remove();

              emojiPickerContainer = document.createElement("div");
              emojiPickerContainer.classList.add(
                "absolute", // Changed to absolute to align with popup
                "z-[51]",
                "rounded-lg",
                "border",
                "border-white/30",
                "bg-white",
                "dark:bg-[#1f1f1f]",
                "dark:border-white/20",
                "backdrop-blur-lg",
                "shadow-lg"
              );
              popup?.appendChild(emojiPickerContainer); // Append to popup for better stacking
              emojiRoot = createRoot(emojiPickerContainer);

              const handleEmojiClick = (emojiData: EmojiClickData) => {
                editor
                  .chain()
                  .focus()
                  .deleteRange(range)
                  .insertContent(emojiData.emoji)
                  .run();
                cleanup();
              };

              emojiRoot.render(<EmojiPicker onEmojiClick={handleEmojiClick} />);

              const rect = clientRect?.();
              if (rect) {
                // Position below the popup
                emojiPickerContainer.style.top = `100%`;
                emojiPickerContainer.style.left = `0px`;
              } else {
                // Fallback to center
                emojiPickerContainer.style.top = `100%`;
                emojiPickerContainer.style.left = `0px`;
                emojiPickerContainer.style.transform = `translateY(5px)`;
              }
            };

            const updatePopup = (
              items: CommandItem[],
              editor: Editor,
              range: { from: number; to: number },
              clientRect?: (() => DOMRect | null | undefined) | null
            ) => {
              currentItems = items;
              if (!popup) return;
              popup.innerHTML = "";
              if (items.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.classList.add(
                  "px-3",
                  "py-2",
                  "text-sm",
                  "text-neutral-600"
                );
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
                  "py-1.5",
                  "text-sm",
                  "text-left",
                  "hover:bg-gray-100",
                  "dark:hover:bg-gray-700",
                  "gap-2.5",
                  "transition-colors",
                  "duration-150",
                  "rounded-md",
                  "text-neutral-800",
                  "dark:text-neutral-200",
                  "cursor-pointer"
                );
                if (index === selectedIndex) {
                  button.classList.add("bg-gray-100", "dark:bg-gray-700");
                }

                const iconContainer = document.createElement("div");
                iconContainer.classList.add(
                  "flex",
                  "items-center",
                  "justify-center",
                  "w-5",
                  "h-5"
                );

                if (item.icon && isValidElement(item.icon)) {
                  const root = createRoot(iconContainer);
                  root.render(
                    cloneElement(
                      item.icon as ReactElement<{ className?: string }>,
                      { className: "w-5 h-5" }
                    )
                  );
                  iconRoots.set(iconContainer, root);
                }

                const textContainer = document.createElement("div");
                textContainer.classList.add("flex-1", "truncate");
                textContainer.textContent = item.title;

                button.appendChild(iconContainer);
                button.appendChild(textContainer);

                button.addEventListener("click", () => {
                  if (item.title === "Emoji") {
                    showEmojiPicker(editor, range, clientRect);
                  } else {
                    editor.chain().focus().deleteRange(range).run();
                    item.command({ editor });
                    cleanup();
                  }
                });

                if (popup) {
                  popup.appendChild(button);
                }
              });
            };

            return {
              onStart: (props: SuggestionPropsWithClientRect) => {
                cleanup();
                createPopup();
                selectedIndex = 0;
                activeClientRect = props.clientRect ?? null;
                updatePopup(
                  props.items,
                  this.editor,
                  props.range,
                  props.clientRect
                );
                if (popup) {
                  document.body.appendChild(popup);
                  setPopupPosition(props); // Set initial position
                  setTimeout(
                    () =>
                      document.addEventListener(
                        "mousedown",
                        handleClickOutside
                      ),
                    0
                  );
                }
              },
              onUpdate: (props: SuggestionPropsWithClientRect) => {
                if (!popup) return;
                updatePopup(
                  props.items,
                  this.editor,
                  props.range,
                  props.clientRect
                );
                setPopupPosition(props); // Update position
              },
              onKeyDown: (props: SuggestionKeyDownProps) => {
                const { event, range } = props;
                const editor = this.editor;
                const clientRect = activeClientRect;

                if (event.key === " ") {
                  cleanup();
                  return false;
                }

                if (event.key === "Escape") {
                  cleanup();
                  return true;
                }

                if (emojiPickerContainer?.contains(document.activeElement)) {
                  return false;
                }

                if (currentItems.length > 0) {
                  if (event.key === "ArrowDown") {
                    selectedIndex = (selectedIndex + 1) % currentItems.length;
                    updatePopup(currentItems, editor, range, clientRect);
                    popup?.children[selectedIndex]?.scrollIntoView({
                      block: "nearest",
                    });
                    return true;
                  }
                  if (event.key === "ArrowUp") {
                    selectedIndex =
                      (selectedIndex - 1 + currentItems.length) %
                      currentItems.length;
                    updatePopup(currentItems, editor, range, clientRect);
                    popup?.children[selectedIndex]?.scrollIntoView({
                      block: "nearest",
                    });
                    return true;
                  }
                  if (event.key === "Enter") {
                    event.preventDefault();
                    const item = currentItems[selectedIndex];
                    if (item) {
                      if (item.title === "Emoji") {
                        showEmojiPicker(editor, range, clientRect);
                      } else {
                        editor.chain().focus().deleteRange(range).run();
                        item.command({ editor });
                        cleanup();
                      }
                    }
                    return true;
                  }
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
