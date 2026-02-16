"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconCopyPlus,
  IconGripVertical,
} from "@tabler/icons-react";
import PriorityIconDisplay from "./PriorityIconDisplay";
import PriorityDropdown from "./PriorityDropdown";
import { priorityLevels } from "./priorityLevels";
import Checkbox from "../../../recyclable/Checkbox";
import type { Task } from "@/types/taskTypes";
import { motion, AnimatePresence } from "motion/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

interface TaskItemProps {
  task: Task;
  listId: string;
  level: number;
  expandedTasks: Record<string, boolean>;
  toggleTaskExpansion: (taskId: string) => void;
  editingTaskId: string | null;
  editingTaskValue: string;
  editInputRef: React.RefObject<Record<string, HTMLInputElement | null>>;
  handleStartEditing: (listId: string, task: Task) => void;
  setEditingTaskValue?: React.Dispatch<React.SetStateAction<string>>;
  handleEditInputKeyDown: (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string
  ) => void;
  handleSaveEditing: (listId: string) => void;
  handleCancelEditing: () => void;
  openPriorityDropdown: string | null;
  togglePriorityDropdown: (taskId: string) => void;
  handleToggleTaskCompletion: (listId: string, taskId: string) => void;
  handleDeleteTask: (listId: string, taskId: string) => void;
  handleSetPriority: (
    listId: string,
    taskId: string,
    newPriority: number
  ) => void;
  addingSubtaskTo: string | null;
  setAddingSubtaskTo: (taskId: string | null) => void;
  subtaskInputRef: React.RefObject<Record<string, HTMLInputElement | null>>;
  activeTaskInputValues: Record<string, string>;
  setActiveTaskInputValues: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
  handleKeyDownTaskInput: (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string,
    parentTaskId?: string
  ) => void;
  isPlaceholder: boolean;
  isDisabled: boolean;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "free";
  isSpecialTheme: boolean;
  isDraggable?: boolean;
  onSubtaskReorder?: (parentTaskId: string, reorderedSubtasks: Task[]) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  listId,
  level,
  expandedTasks,
  toggleTaskExpansion,
  editingTaskId,
  editingTaskValue,
  editInputRef,
  handleStartEditing,
  setEditingTaskValue,
  handleEditInputKeyDown,
  handleSaveEditing,
  handleCancelEditing,
  openPriorityDropdown,
  togglePriorityDropdown,
  handleToggleTaskCompletion,
  handleDeleteTask,
  handleSetPriority,
  addingSubtaskTo,
  setAddingSubtaskTo,
  subtaskInputRef,
  activeTaskInputValues,
  setActiveTaskInputValues,
  handleKeyDownTaskInput,
  isPlaceholder,
  isDisabled,
  subscriptionStatus = "free",
  isSpecialTheme,
  isDraggable = false,
  onSubtaskReorder,
}) => {
  const MAX_SUBTASKS = 6;
  const MAX_TASK_NAME_LENGTH = 255;
  const isFreeUser = subscriptionStatus === "free";
  const isEditing = editingTaskId === task.id;
  const isExpanded = !!expandedTasks[task.id];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isPriorityDropdownOpen = openPriorityDropdown === task.id;
  const isSubtask = level > 0;
  const subtaskLimitReached =
    isFreeUser && (task.subtasks?.length || 0) >= MAX_SUBTASKS;

  const [isHovered, setIsHovered] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  // Check if text overflows (is actually truncated)
  useEffect(() => {
    const el = textRef.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [task.name]);

  const indentSize = 2.5;
  const indentStyle = { paddingLeft: `${level * indentSize}rem` };
  const addSubtaskIndentStyle = {
    paddingLeft: `${(level + 1) * indentSize}rem`,
  };

  // DnD sensors for subtask reordering
  const subtaskSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubtaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !task.subtasks) return;

    const oldIndex = task.subtasks.findIndex((t) => t.id === active.id);
    const newIndex = task.subtasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(task.subtasks, oldIndex, newIndex);
    onSubtaskReorder?.(task.id, reordered);
  };

  const taskItemRef = useRef<HTMLDivElement>(null);

  // Sortable hook for drag-and-drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortableTransition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !isDraggable || isDisabled || isPlaceholder,
  });

  const sortableStyle: React.CSSProperties = {
    transform: CSS.Translate.toString(transform) || undefined,
    transition: sortableTransition || undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const itemBg = isSpecialTheme
    ? "bg-white/5 dark:bg-white/5"
    : "bg-white/90 dark:bg-zinc-800/90";
  const itemBorder = isSpecialTheme
    ? "border-white/10 dark:border-white/10"
    : "border-slate-100/50 dark:border-zinc-700/50";
  const itemHoverBorder = isSpecialTheme
    ? "hover:border-white/20 dark:hover:border-white/20"
    : "hover:border-slate-200/70 dark:hover:border-zinc-600/70";
  const itemHoverShadow = isSpecialTheme
    ? ""
    : "hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.2)]";

  const buttonHoverBg = isSpecialTheme
    ? "hover:bg-white/10 dark:hover:bg-white/10"
    : "hover:bg-slate-100/80 dark:hover:bg-zinc-700/80";
  const iconColor = isSpecialTheme
    ? "text-white/60 dark:text-white/60"
    : "text-slate-500 dark:text-slate-400";

  const deleteHoverBg = isSpecialTheme
    ? "hover:bg-red-500/20 dark:hover:bg-red-500/20"
    : "hover:bg-red-100/80 dark:hover:bg-red-900/50";
  const deleteIconColor = isSpecialTheme
    ? "text-red-400 dark:text-red-400"
    : "text-red-500 dark:text-red-400";

  const editInputBg = isSpecialTheme
    ? "bg-zinc-900/60 dark:bg-zinc-900/60"
    : "bg-white/95 dark:bg-zinc-800/95";
  const editInputBorder = isSpecialTheme
    ? "border-white/20 dark:border-white/20"
    : "border-slate-200/60 dark:border-zinc-700/60";
  const editInputText = isSpecialTheme
    ? "text-white/90 dark:text-white/90"
    : "text-slate-900 dark:text-slate-200";

  const subtaskInputBg = isSpecialTheme
    ? "bg-black/10 dark:bg-black/10"
    : "bg-slate-50/90 dark:bg-zinc-800/90";
  const subtaskInputBorder = isSpecialTheme
    ? "border-white/15 dark:border-white/15"
    : "border-slate-200/50 dark:border-zinc-700/50";
  const subtaskInputText = isSpecialTheme
    ? "text-white/90 dark:text-white/90"
    : "text-slate-900 dark:text-slate-200";
  const subtaskInputFocusRing = isSpecialTheme
    ? "focus:ring-white/50 dark:focus:ring-white/50"
    : "focus:ring-pink-500 dark:focus:ring-pink-400";

  const addSubtaskText = isSpecialTheme
    ? "text-white/60 hover:text-white/80"
    : "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100";

  useEffect(() => {
    if (addingSubtaskTo === task.id) {
      setTimeout(() => {
        subtaskInputRef.current?.[task.id]?.focus();
      }, 0);
    }
  }, [addingSubtaskTo, task.id, subtaskInputRef]);

  // Sort subtasks: incomplete first (by priority desc), completed at bottom
  const sortedSubtasks = useMemo(() => {
    if (!task.subtasks) return [];
    const incomplete = task.subtasks
      .filter((s) => !s.completed)
      .sort((a, b) => b.priority - a.priority);
    const completed = task.subtasks.filter((s) => s.completed);
    return [...incomplete, ...completed];
  }, [task.subtasks]);

  const prevSubtaskCountRef = useRef(task.subtasks?.length || 0);
  useEffect(() => {
    const currentSubtaskCount = task.subtasks?.length || 0;
    if (prevSubtaskCountRef.current === 0 && currentSubtaskCount === 1) {
      if (!isExpanded) {
        toggleTaskExpansion(task.id);
      }
    }
    prevSubtaskCountRef.current = currentSubtaskCount;
  }, [task.subtasks, task.id, isExpanded, toggleTaskExpansion]);

  if (isEditing) {
    return (
      <motion.div
        layout
        key={`${task.id}-editing`}
        className="relative"
        style={indentStyle}
      >
        <div
          className={`flex items-center p-2 rounded-lg ${editInputBg} ${editInputBorder} backdrop-blur-sm shadow-sm transition-all duration-200`}
        >
          <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>
          <input
            ref={(el) => {
              if (editInputRef.current) {
                editInputRef.current[task.id] = el;
              }
            }}
            type="text"
            value={editingTaskValue}
            onChange={(e) => setEditingTaskValue?.(e.target.value)}
            onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
            onBlur={() => handleSaveEditing(listId)}
            maxLength={MAX_TASK_NAME_LENGTH}
            className={`flex-1 min-w-0 bg-transparent focus:outline-none text-sm font-medium ${editInputText}`}
            autoFocus
            disabled={isDisabled}
          />
        </div>
      </motion.div>
    );
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (taskItemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={{ ...indentStyle, ...sortableStyle }}
      className={`relative group/task ${isDragging ? "z-50" : isPriorityDropdownOpen ? "z-[9999]" : ""}`}
    >
      <motion.div
        layout={!isDragging}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        transition={{ duration: 0.2, layout: { duration: 0.2 } }}
      >
        <div
          className={`flex items-start p-2 rounded-lg border ${itemBg} ${itemBorder} ${itemHoverBorder} ${itemHoverShadow} backdrop-blur-md transition-all duration-200`}
        >
          {/* Drag handle */}
          {isDraggable && !isPlaceholder && (
            <div
              {...attributes}
              {...listeners}
              className={`flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 mr-1 mt-1 rounded opacity-0 group-hover/task:opacity-60 hover:!opacity-100 transition-opacity ${iconColor}`}
              aria-label="Drag to reorder"
            >
              <IconGripVertical size={14} />
            </div>
          )}

          <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2 mt-1">
            {hasSubtasks ? (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className={`p-1 rounded ${buttonHoverBg} ${iconColor} transition-colors`}
                aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={isExpanded}
                disabled={isDisabled}
              >
                {isExpanded ? (
                  <IconChevronDown size={14} />
                ) : (
                  <IconChevronRight size={14} />
                )}
              </button>
            ) : (
              <div className="w-5" aria-hidden="true"></div>
            )}
          </div>

          <div
            className="flex-1 mr-2 cursor-pointer min-w-0"
            onDoubleClick={() => !isDisabled && handleStartEditing(listId, task)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Checkbox
              checked={task.completed}
              onChange={() =>
                !isDisabled && handleToggleTaskCompletion(listId, task.id)
              }
              label={task.name}
              variant={isSubtask ? "subtask" : "default"}
              disabled={isDisabled}
              truncate={!isHovered || !isTruncated}
              textRef={textRef}
            />
          </div>

          {!isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-1 flex-shrink-0">
              <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => !isDisabled && handleStartEditing(listId, task)}
                  title="Edit task"
                  className={`p-1 rounded ${buttonHoverBg} ${iconColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isDisabled}
                >
                  <IconEdit size={14} />
                </button>
                <button
                  onClick={() => !isDisabled && handleDeleteTask(listId, task.id)}
                  title="Delete task"
                  className={`p-1 rounded ${deleteHoverBg} ${deleteIconColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  disabled={isDisabled}
                >
                  <IconTrash size={14} />
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (!isDisabled) togglePriorityDropdown(task.id);
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  title={`Priority: ${priorityLevels.find((p) => p.level === task.priority)?.label ||
                    "None"
                    }`}
                  className={`p-1 rounded ${buttonHoverBg} ${iconColor} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                  aria-haspopup="true"
                  aria-expanded={isPriorityDropdownOpen}
                  disabled={isDisabled}
                >
                  <PriorityIconDisplay level={task.priority} />
                </button>
                {isPriorityDropdownOpen && (
                  <PriorityDropdown
                    taskId={task.id}
                    listId={listId}
                    currentPriority={task.priority}
                    onSetPriority={handleSetPriority}
                    onClose={() => togglePriorityDropdown(task.id)}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence initial={false}>
          {hasSubtasks && isExpanded && (
            <motion.div
              key="subtasks-container"
              initial={{ height: 0, opacity: 0, overflow: "hidden" }}
              animate={{ height: "auto", opacity: 1, overflow: "visible" }}
              exit={{ height: 0, opacity: 0, overflow: "hidden" }}
              transition={{ duration: 0.2, overflow: { delay: 0.2 } }}
              className="mt-1 space-y-1"
            >
              <DndContext
                sensors={subtaskSensors}
                collisionDetection={closestCenter}
                modifiers={[restrictToVerticalAxis]}
                onDragEnd={handleSubtaskDragEnd}
              >
                <SortableContext
                  items={sortedSubtasks.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sortedSubtasks.map((subtask: Task) => (
                    <TaskItem
                      key={subtask.id}
                      task={subtask}
                      listId={listId}
                      level={level + 1}
                      expandedTasks={expandedTasks}
                      toggleTaskExpansion={toggleTaskExpansion}
                      editingTaskId={editingTaskId}
                      editingTaskValue={editingTaskValue}
                      editInputRef={editInputRef}
                      handleStartEditing={handleStartEditing}
                      setEditingTaskValue={setEditingTaskValue}
                      handleEditInputKeyDown={handleEditInputKeyDown}
                      handleSaveEditing={handleSaveEditing}
                      handleCancelEditing={handleCancelEditing}
                      openPriorityDropdown={openPriorityDropdown}
                      togglePriorityDropdown={togglePriorityDropdown}
                      handleToggleTaskCompletion={handleToggleTaskCompletion}
                      handleDeleteTask={handleDeleteTask}
                      handleSetPriority={handleSetPriority}
                      addingSubtaskTo={addingSubtaskTo}
                      setAddingSubtaskTo={setAddingSubtaskTo}
                      subtaskInputRef={subtaskInputRef}
                      activeTaskInputValues={activeTaskInputValues}
                      setActiveTaskInputValues={setActiveTaskInputValues}
                      handleKeyDownTaskInput={handleKeyDownTaskInput}
                      isPlaceholder={isPlaceholder}
                      isDisabled={isDisabled}
                      subscriptionStatus={subscriptionStatus}
                      isSpecialTheme={isSpecialTheme}
                      isDraggable={!isPlaceholder && !isDisabled}
                      onSubtaskReorder={onSubtaskReorder}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </motion.div>
          )}
        </AnimatePresence>

        {!isPlaceholder && level === 0 && (
          <motion.div
            layout={!isDragging}
            className={`mt-1 overflow-hidden transition-all duration-200 ease-in-out ${addingSubtaskTo === task.id
              ? "h-12 py-1"
              : "h-0 group-hover/task:h-8 group-hover/task:py-1"
              }`}
            style={{ ...addSubtaskIndentStyle, paddingRight: '0.25rem' }}
          >
            {addingSubtaskTo === task.id ? (
              <input
                ref={(el) => {
                  if (subtaskInputRef.current) {
                    subtaskInputRef.current[task.id] = el;
                  }
                }}
                id={`subtask-input-${task.id}`}
                type="text"
                value={activeTaskInputValues[`subtask-${task.id}`] ?? ""}
                onChange={(e) => {
                  const { value } = e.target;
                  setActiveTaskInputValues((prev) => ({
                    ...prev,
                    [`subtask-${task.id}`]: value,
                  }));
                }}
                onKeyDown={(e) => handleKeyDownTaskInput(e, listId, task.id)}
                onBlur={(e) => {
                  setTimeout(() => {
                    const relatedTarget =
                      (e.relatedTarget as HTMLElement) || document.activeElement;
                    const isFocusOutside =
                      !taskItemRef.current?.contains(relatedTarget);
                    if (
                      isFocusOutside &&
                      !e.target.value.trim() &&
                      addingSubtaskTo === task.id
                    ) {
                      setAddingSubtaskTo(null);
                      setActiveTaskInputValues((prev) => {
                        const newState = { ...prev };
                        delete newState[`subtask-${task.id}`];
                        return newState;
                      });
                    }
                  }, 100);
                }}
                maxLength={MAX_TASK_NAME_LENGTH}
                className={`p-2 min-w-0 box-border ${subtaskInputBg} backdrop-blur-md rounded-lg border ${subtaskInputBorder} focus:outline-none focus:ring-1 ${subtaskInputFocusRing} text-sm ${subtaskInputText} transition-all duration-200 disabled:opacity-50 block w-full`}
                placeholder="New subtask..."
                disabled={isDisabled}
                autoFocus
              />
            ) : (
              !subtaskLimitReached && (
                <button
                  onClick={() => !isDisabled && setAddingSubtaskTo(task.id)}
                  className={`flex items-center gap-1 ${addSubtaskText} text-sm transition-colors duration-200 py-1 disabled:opacity-50 disabled:cursor-not-allowed w-full h-full`}
                  title="Add subtask"
                  disabled={isDisabled}
                  tabIndex={-1}
                >
                  <IconCopyPlus size={14} /> <span>Add subtask</span>
                </button>
              )
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TaskItem;