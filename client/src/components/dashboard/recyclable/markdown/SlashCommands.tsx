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
                document.removeEventListener("mousedown", handleClickOutside);
                popup.remove();
                popup = null;
              }
              selectedIndex = 0;
              currentItems = [];
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
              const popupElement = document.createElement("div");
              popupElement.classList.add(
                "absolute",
                "z-50",
                "rounded-lg",
                "border",
                "border-white/30",
                "bg-white/75",
                "backdrop-blur-lg",
                "shadow-lg",
                "py-2",
                "overflow-y-auto",
                "w-56"
              );
              popupElement.style.minWidth = "200px";
              return popupElement;
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
                "absolute",
                "z-[51]",
                "rounded-lg",
                "border",
                "border-white/30",
                "bg-white/75",
                "backdrop-blur-lg",
                "shadow-lg"
              );
              document.body.appendChild(emojiPickerContainer);
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

              if (clientRect && typeof clientRect === "function") {
                const rect = clientRect();
                if (rect) {
                  const viewportHeight = window.innerHeight;
                  const pickerHeight = 400;
                  let top = rect.bottom + window.scrollY + 5;
                  const left = rect.left + window.scrollX;

                  if (top + pickerHeight > viewportHeight) {
                    top = rect.top + window.scrollY - pickerHeight - 5;
                  }

                  emojiPickerContainer.style.top = `${top}px`;
                  emojiPickerContainer.style.left = `${left}px`;
                } else {
                  emojiPickerContainer.style.top = `50%`;
                  emojiPickerContainer.style.left = `50%`;
                  emojiPickerContainer.style.transform = `translate(-50%, -50%)`;
                }
              } else {
                emojiPickerContainer.style.top = `50%`;
                emojiPickerContainer.style.left = `50%`;
                emojiPickerContainer.style.transform = `translate(-50%, -50%)`;
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

              if (emojiPickerContainer) {
                emojiPickerContainer.remove();
                emojiPickerContainer = null;
                if (emojiRoot) emojiRoot.unmount();
                emojiRoot = null;
              }

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
                  "gap-2.5",
                  "transition-colors",
                  "duration-150",
                  "rounded-md",
                  "text-neutral-800",
                  "cursor-pointer"
                );
                if (index === selectedIndex) {
                  button.classList.add("bg-gray-100");
                }

                const iconContainer = document.createElement("div");
                iconContainer.classList.add(
                  "flex",
                  "items-center",
                  "justify-center",
                  "w-5",
                  "h-5",
                  "text-neutral-700"
                );

                if (item.icon) {
                  if (isValidElement(item.icon)) {
                    const iconElement = item.icon as ReactElement<{
                      className?: string;
                    }>;
                    const root = createRoot(iconContainer);
                    root.render(
                      cloneElement(iconElement, { className: "w-5 h-5" })
                    );
                    iconRoots.set(iconContainer, root);
                  }
                } else {
                  iconContainer.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd" /></svg>`;
                }

                const textContainer = document.createElement("div");
                textContainer.classList.add(
                  "flex-1",
                  "truncate",
                  "text-neutral-800"
                );
                textContainer.textContent = item.title;

                button.appendChild(iconContainer);
                button.appendChild(textContainer);

                button.addEventListener("click", () => {
                  if (item.title === "Emoji") {
                    if (!emojiPickerContainer) {
                      showEmojiPicker(editor, range, clientRect);
                    }
                  } else {
                    editor.chain().focus().deleteRange(range).run();
                    item.command({ editor });
                    cleanup();
                  }
                });
                popup?.appendChild(button);
              });
            };

            const setPopupPosition = (props: SuggestionPropsWithClientRect) => {
              const rect =
                props.clientRect && typeof props.clientRect === "function"
                  ? props.clientRect()
                  : null;

              if (!rect || !popup) {
                if (popup) {
                  popup.style.position = "fixed";
                  popup.style.top = "50%";
                  popup.style.left = "50%";
                  popup.style.transform = "translate(-50%, -50%)";
                }
                return;
              }

              popup.style.position = "absolute";
              popup.style.transform = "translateY(0)";

              const popupHeight = popup.offsetHeight || 150;
              const popupWidth = popup.offsetWidth || 224;
              const bodyWidth = document.body.clientWidth;
              const viewportHeight = window.innerHeight;

              let finalLeft = rect.left + window.scrollX;
              if (finalLeft + popupWidth > bodyWidth) {
                finalLeft = bodyWidth - popupWidth - 10;
              }
              if (finalLeft < 0) {
                finalLeft = 10;
              }
              popup.style.left = `${finalLeft}px`;

              const spaceBelow = viewportHeight - rect.bottom;
              const spaceAbove = rect.top;

              let finalTop = rect.bottom + window.scrollY + 5;
              if (popupHeight > spaceBelow && spaceAbove > popupHeight) {
                finalTop = rect.top + window.scrollY - popupHeight - 5;
              }

              popup.style.top = `${finalTop}px`;
            };

            return {
              onStart: (props: SuggestionPropsWithClientRect) => {
                cleanup();
                popup = createPopup();
                selectedIndex = 0;
                updatePopup(
                  props.items,
                  this.editor,
                  props.range,
                  props.clientRect
                );
                document.body.appendChild(popup);
                setPopupPosition(props);
                setTimeout(() => {
                  document.addEventListener("mousedown", handleClickOutside);
                }, 0);
              },

              onUpdate: (props: SuggestionPropsWithClientRect) => {
                if (!popup) return;
                selectedIndex = 0;
                updatePopup(
                  props.items,
                  this.editor,
                  props.range,
                  props.clientRect
                );
                setPopupPosition(props);
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                const { event, range } = props;
                const editor = this.editor;
                const clientRect = (
                  props as unknown as SuggestionPropsWithClientRect
                ).clientRect;
                const isSuggestionVisible =
                  !!clientRect &&
                  typeof clientRect === "function" &&
                  !!clientRect();

                if (event.key === "Escape") {
                  cleanup();
                  return true;
                }

                if (
                  emojiPickerContainer &&
                  document.activeElement &&
                  emojiPickerContainer.contains(document.activeElement)
                ) {
                  return false;
                }

                if (isSuggestionVisible && popup && currentItems.length > 0) {
                  if (event.key === "ArrowDown") {
                    selectedIndex = (selectedIndex + 1) % currentItems.length;
                    updatePopup(currentItems, editor, range, clientRect);
                    (
                      popup.children[selectedIndex] as HTMLElement
                    )?.scrollIntoView({
                      block: "nearest",
                    });
                    return true;
                  }

                  if (event.key === "ArrowUp") {
                    selectedIndex =
                      (selectedIndex - 1 + currentItems.length) %
                      currentItems.length;
                    updatePopup(currentItems, editor, range, clientRect);
                    (
                      popup.children[selectedIndex] as HTMLElement
                    )?.scrollIntoView({
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
                        return true;
                      } else {
                        editor.chain().focus().deleteRange(range).run();
                        item.command({ editor });
                        cleanup();
                      }
                    }
                    return true;
                  }

                  return false;
                }

                if (!isSuggestionVisible) {
                  return false;
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