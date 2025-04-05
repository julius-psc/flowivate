"use client"

import { Extension } from "@tiptap/core";
import { ReactNode, isValidElement, cloneElement, ReactElement } from "react";
import { Editor } from "@tiptap/react";
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import { createRoot, Root } from 'react-dom/client';

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
        Suggestion({
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
            let selectedIndex = 0;
            let currentItems: CommandItem[] = [];
            const iconRoots: Map<HTMLElement, Root> = new Map();

            const cleanupIconRoots = () => {
              iconRoots.forEach(root => root.unmount());
              iconRoots.clear();
            };

            const createPopup = () => {
              popup = document.createElement("div");
              popup.classList.add(
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
              popup.style.minWidth = '200px';
              return popup;
            };

            const updatePopup = (items: CommandItem[]) => {
              currentItems = items;
              if (!popup) return;

              cleanupIconRoots();
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
                        className: "w-4 h-4"
                      })
                    );
                    iconRoots.set(iconContainer, root);
                  } else {
                    iconContainer.innerHTML = item.icon as string;
                  }
                } else {
                  iconContainer.innerHTML = '•';
                }

                const textContainer = document.createElement("div");
                textContainer.classList.add("flex-1", "truncate");
                textContainer.textContent = item.title;

                button.appendChild(iconContainer);
                button.appendChild(textContainer);

                button.addEventListener("click", () => {
                  item.command({ editor: this.editor });
                  // Call the suggestion command on click as well
                  this.options.suggestion.command();
                });

                if (popup) {
                  popup.appendChild(button);
                }
              });
            };

            return {
              onStart: (props: SuggestionProps<CommandItem>) => {
                popup = createPopup();
                updatePopup(props.items);

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
                updatePopup(props.items);
              },

              onKeyDown: (props: SuggestionKeyDownProps) => {
                if (!popup) return false;
              
                const { event } = props;
              
                if (event.key === "ArrowDown") {
                  selectedIndex = (selectedIndex + 1) % currentItems.length;
                  updatePopup(currentItems);
                  return true;
                }
              
                if (event.key === "ArrowUp") {
                  selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
                  updatePopup(currentItems);
                  return true;
                }
              
                if (event.key === "Enter") {
                  const item = currentItems[selectedIndex];
                  if (item) {
                    item.command({ editor: this.editor });
                    this.editor.commands.focus();
                    this.editor.commands.deleteRange(props.range); // ⬅️ ensure deletion of slash trigger
                  }
                  return true;
                }
              
                return false;
              },

              onExit: () => {
                if (popup) {
                  popup.remove();
                  popup = null;
                }
                currentItems = [];
                cleanupIconRoots();
              },
            };
          },
        }),
      ];
    },
  });
};

export default SlashCommands;