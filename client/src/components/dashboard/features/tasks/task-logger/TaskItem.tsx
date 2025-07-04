"use client";

import React, { useEffect, useMemo } from "react";
import {
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconTrash,
  IconCopyPlus,
} from "@tabler/icons-react";
import PriorityIconDisplay from "./PriorityIconDisplay";
import PriorityDropdown from "./PriorityDropdown";
import { priorityLevels } from "./priorityLevels";
import Checkbox from "../../../recyclable/Checkbox";
import type { Task } from "@/types/taskTypes";

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
  subscriptionStatus = "free", // default to free for safety
}) => {
  const MAX_SUBTASKS = 6;
  const isFreeUser = subscriptionStatus === "free";
  const isEditing = editingTaskId === task.id;
  const isExpanded = !!expandedTasks[task.id];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isPriorityDropdownOpen = openPriorityDropdown === task.id;
  const isSubtask = level > 0;
  const subtaskLimitReached =
    isFreeUser && (task.subtasks?.length || 0) >= MAX_SUBTASKS;
  const indentMultiplier = 4;
  const indentationClass = level > 0 ? `pl-${level * indentMultiplier}` : "";

  useEffect(() => {
    if (addingSubtaskTo === task.id) {
      setTimeout(() => {
        subtaskInputRef.current?.[task.id]?.focus();
      }, 0);
    }
  }, [addingSubtaskTo, task.id, subtaskInputRef]);

  const sortedSubtasks = useMemo(() => {
    return task.subtasks?.slice().sort((a, b) => b.priority - a.priority) ?? [];
  }, [task.subtasks]);

  if (isEditing) {
    return (
      <div
        key={`${task.id}-editing`}
        className={`relative ${indentationClass}`}
      >
        <div className="flex items-center p-2 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-zinc-700/60 shadow-sm transition-all duration-200">
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
            className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
            autoFocus
            disabled={isDisabled}
          />
        </div>
      </div>
    );
  }

  return (
    <div key={task.id} className={`relative group/task ${indentationClass}`}>
      <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 hover:shadow-sm transition-all duration-200">
        {/* Chevron */}
        <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
          {hasSubtasks ? (
            <button
              onClick={() => toggleTaskExpansion(task.id)}
              className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
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

        {/* Checkbox */}
        <div
          className="flex-1 mr-2 cursor-pointer"
          onDoubleClick={() => !isDisabled && handleStartEditing(listId, task)}
        >
          <Checkbox
            checked={task.completed}
            onChange={() =>
              !isDisabled && handleToggleTaskCompletion(listId, task.id)
            }
            label={task.name}
            variant={isSubtask ? "subtask" : "default"}
            disabled={isDisabled}
          />
        </div>

        {/* Action Icons */}
        {!isPlaceholder && (
          <div className="flex items-center gap-1 ml-auto pl-1 flex-shrink-0">
            <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => !isDisabled && handleStartEditing(listId, task)}
                title="Edit task"
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDisabled}
              >
                <IconEdit size={14} />
              </button>
              <button
                onClick={() => !isDisabled && handleDeleteTask(listId, task.id)}
                title="Delete task"
                className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDisabled}
              >
                <IconTrash size={14} />
              </button>
            </div>

            {/* Priority */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDisabled) togglePriorityDropdown(task.id);
                }}
                title={`Priority: ${
                  priorityLevels.find((p) => p.level === task.priority)
                    ?.label || "None"
                }`}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Subtasks */}
      {hasSubtasks && isExpanded && (
        <div className="mt-1 space-y-1">
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
            />
          ))}
        </div>
      )}

      {/* Add subtask input */}
      {!isPlaceholder && level === 0 && (
        <div className={`mt-1 mb-2 pl-${(level + 1) * indentMultiplier}`}>
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
                  if (!e.target.value.trim() && addingSubtaskTo === task.id) {
                    setAddingSubtaskTo(null);
                    setActiveTaskInputValues((prev) => {
                      const newState = { ...prev };
                      delete newState[`subtask-${task.id}`];
                      return newState;
                    });
                  }
                }, 150);
              }}
              className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:focus:ring-pink-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
              placeholder="New subtask..."
              disabled={isDisabled}
              autoFocus
            />
          ) : (
            <div className="group-hover/task:flex hidden items-center gap-1">
              {!subtaskLimitReached && (
                <button
                  onClick={() => !isDisabled && setAddingSubtaskTo(task.id)}
                  className="flex items-center gap-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 text-sm transition-colors duration-200 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add subtask"
                  disabled={isDisabled}
                >
                  <IconCopyPlus size={14} /> <span>Add subtask</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskItem;
