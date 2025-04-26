"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  IconSquareRoundedPlus2,
  IconCopyPlus,
  IconTrash,
  IconEdit,
  IconFlag,
  IconFlagFilled,
  IconChevronDown,
  IconChevronRight,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Checkbox from "../../recyclable/Checkbox";
import * as tasksApi from "../../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";

// --- Helper Functions ---
const createNewTask = (name: string): Task => ({
  id: crypto.randomUUID(), // Use crypto.randomUUID for temporary client-side IDs if needed
  name: name.trim(),
  completed: false,
  priority: 0,
  subtasks: [],
});

const priorityLevels = [
  {
    level: 0,
    label: "None",
    icon: IconFlag,
    color: "text-gray-400 dark:text-gray-500 opacity-50",
  },
  {
    level: 1,
    label: "Low (!)",
    icon: IconFlagFilled,
    color: "text-yellow-500",
  },
  {
    level: 2,
    label: "Medium (!!)",
    icon: IconFlagFilled,
    color: "text-orange-500",
  },
  {
    level: 3,
    label: "High (!!!)",
    icon: IconFlagFilled,
    color: "text-red-500",
  },
];

const PriorityIconDisplay: React.FC<{ level: number }> = ({ level }) => {
  const config = priorityLevels.find((p) => p.level === level);
  const DisplayIcon = config?.icon || IconFlag;
  const displayColor =
    level !== 0 && config?.color
      ? config.color
      : "text-gray-400 dark:text-gray-600 opacity-50";
  return (
    <DisplayIcon
      size={16}
      className={`${displayColor} transition-colors flex-shrink-0`}
    />
  );
};

// You might not need this if useQuery's placeholder handles the initial state
const placeholderTaskLists: TaskList[] = [
  {
    _id: "placeholder-1",
    name: "Getting Started",
    tasks: [
      createNewTask("Click the '+' button below to add a list"),
      createNewTask("Double-click a task to edit it"),
      { ...createNewTask("Click flag icon to set priority"), priority: 1 },
      {
        ...createNewTask("Tasks can have subtasks"),
        subtasks: [createNewTask("Subtasks use pink checkbox")],
      },
      createNewTask("Check me off when done!"),
    ],
  },
];

// --- Priority Dropdown Component ---
interface PriorityDropdownProps {
  taskId: string;
  listId: string;
  currentPriority: number;
  onSetPriority: (listId: string, taskId: string, priority: number) => void;
  onClose: () => void;
}

const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  taskId,
  listId,
  currentPriority,
  onSetPriority,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 rounded-lg shadow-lg z-10 py-1.5 transition-all duration-200 ease-out animate-fade-in"
    >
      {priorityLevels.map(({ level, label, icon: Icon, color }) => (
        <button
          key={level}
          onClick={() => {
            onSetPriority(listId, taskId, level);
            onClose();
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors ${
            currentPriority === level
              ? "bg-slate-50/80 dark:bg-zinc-700/80 font-semibold"
              : ""
          }`}
        >
          <Icon
            size={16}
            className={level === 0 ? "opacity-50 text-slate-400" : color}
          />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

// --- Main TaskLogger Component ---
const TaskLogger: React.FC = () => {
  // --- React Query Client ---
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();

  // --- Local UI State (Things not directly part of the fetched data) ---
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {}
  );
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState<
    string | null
  >(null);
  // UI state for showing the "add task" input per list
  const [listAddingTaskId, setListAddingTaskId] = useState<string | null>(null);

  // --- Refs ---
  const editInputRef = useRef<HTMLInputElement>(null);
  const listNameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const taskInputRefs = useRef<Record<string, HTMLInputElement | null>>({}); // Ref for task inputs per list

  // --- React Query: Fetching Task Lists ---
  const {
    data: taskLists = [], // Default to empty array while loading/if data is undefined
    isLoading: isLoadingLists,
    isError: isErrorLists,
    error: errorLists,
    // isFetching, // You can use this for background refresh indicators
  } = useQuery<TaskList[], Error>({
    // Specify TaskList[] and Error types
    queryKey: ["tasks"], // Unique key for this query
    queryFn: tasksApi.getTaskLists, // Function to fetch data from tasksApi.ts
    enabled: status === "authenticated", // Only run query if user is authenticated
    staleTime: 1000 * 60 * 1, // Example: 1 minute fresh time
    refetchOnWindowFocus: true,
    placeholderData:
      status !== "authenticated" ? placeholderTaskLists : undefined, // Show placeholders if not logged in
  });

  // --- React Query: Mutations ---

  // Mutation to add a new list
  const addListMutation = useMutation({
    mutationFn: tasksApi.addTaskList,
    onSuccess: (data, variables) => {
      console.log(data, variables);
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Refetch lists after adding
      setIsAddingList(false);
      setNewListName("");
    },
    onError: (error) => {
      console.error("Error adding list:", error);
      // Add user feedback (e.g., toast notification)
    },
  });

  // Mutation to update a task list (e.g., modifying tasks array or name)
  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Refetch lists after update

      // Close editing/adding states if the update was related to them
      if (editingTaskId && variables.tasks) {
        setEditingTaskId(null);
        setEditingTaskValue("");
      }
      if (listAddingTaskId && variables.tasks) {
        const inputElement = document.getElementById(
          `task-input-${listAddingTaskId}`
        ) as HTMLInputElement;
        if (inputElement) inputElement.value = ""; // Clear input on success
        setListAddingTaskId(null);
      }
      if (addingSubtaskTo && variables.tasks) {
        const inputElement = document.getElementById(
          `subtask-input-${addingSubtaskTo}`
        ) as HTMLInputElement;
        if (inputElement) inputElement.value = ""; // Clear input on success
        setAddingSubtaskTo(null);
      }
    },
    onError: (error, variables) => {
      console.error(`Error updating list ${variables.id}:`, error);
      // Add user feedback
    },
    // Consider adding onMutate and onError with context for optimistic updates if needed
  });

  // Mutation to delete a task list
  const deleteListMutation = useMutation({
    mutationFn: tasksApi.deleteTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Refetch lists after deleting
    },
    onError: (error, listId) => {
      console.error(`Error deleting list ${listId}:`, error);
      // Add user feedback
    },
  });

  // --- Task/List Management Helpers (Recursive Functions) ---
  // These operate on copies of the data before sending to mutation
  const findAndUpdateTask = (
    tasks: Task[],
    taskId: string,
    updateFn: (task: Task) => Task
  ): { updatedTasks: Task[]; taskFound: boolean } => {
    let taskFound = false;
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        taskFound = true;
        return updateFn(task);
      }
      if (task.subtasks?.length > 0) {
        const result = findAndUpdateTask(task.subtasks, taskId, updateFn);
        if (result.taskFound) {
          taskFound = true;
          return { ...task, subtasks: result.updatedTasks };
        }
      }
      return task;
    });
    return { updatedTasks, taskFound };
  };

  const findAndDeleteTask = (
    tasks: Task[],
    taskId: string
  ): { updatedTasks: Task[]; taskFound: boolean } => {
    let taskFound = false;
    const filteredTasks: Task[] = [];
    for (const task of tasks) {
      if (task.id === taskId) {
        taskFound = true;
        continue; // Skip adding this task
      }
      if (task.subtasks?.length > 0) {
        const result = findAndDeleteTask(task.subtasks, taskId);
        if (result.taskFound) taskFound = true; // Propagate found status upwards
        // Add task back with potentially modified subtasks
        filteredTasks.push({ ...task, subtasks: result.updatedTasks });
      } else {
        // Keep task if it's not the one to delete and has no subtasks to check
        filteredTasks.push(task);
      }
    }
    // This implementation needs careful review if tasks can be nested deeply
    // A recursive filter might be cleaner for deeply nested deletes.
    // However, for top-level and one-level subtasks, this should work.
    // Ensure the final top-level filter is correct.
    // Let's refine: Filter at each level.
    const finalFiltered = tasks
      .filter((task) => task.id !== taskId) // Filter top level
      .map((task) => {
        if (task.subtasks?.length) {
          const result = findAndDeleteTask(task.subtasks, taskId);
          if (result.taskFound) taskFound = true;
          return { ...task, subtasks: result.updatedTasks };
        }
        return task;
      });

    return {
      updatedTasks: finalFiltered,
      taskFound: taskFound || tasks.length !== finalFiltered.length,
    }; // Check if top-level was deleted
  };

  // --- Action Handlers (Use Mutations) ---

  const handleAddList = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newListName.trim() && session?.user?.id) {
      addListMutation.mutate({ name: newListName.trim() });
      // onSuccess will clear state
    } else if (e.key === "Escape") {
      setIsAddingList(false);
      setNewListName("");
    }
  };

  const handleDeleteList = (listId: string | undefined) => {
    if (!listId || listId.startsWith("placeholder-")) return;
    // Optional: Add confirmation dialog here
    deleteListMutation.mutate(listId);
  };

  // Helper to find list and trigger update mutation
  const triggerListUpdate = (listId: string, updatedTasks: Task[]) => {
    const list = taskLists.find((l) => l._id === listId);
    if (list && list._id && !list._id.startsWith("placeholder-")) {
      updateListMutation.mutate({ id: list._id, tasks: updatedTasks });
    } else {
      console.warn(
        `List ${listId} not found or is placeholder, cannot update.`
      );
    }
  };

  const handleAddTask = (listId: string, parentTaskId?: string) => {
    const inputId = parentTaskId
      ? `subtask-input-${parentTaskId}`
      : `task-input-${listId}`;
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (!inputElement || !inputElement.value.trim()) return;

    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const newTask = createNewTask(inputElement.value);
    let finalTasks: Task[];

    if (parentTaskId) {
      const result = findAndUpdateTask(
        [...list.tasks],
        parentTaskId,
        (task) => ({
          // Operate on a copy
          ...task,
          subtasks: [...(task.subtasks || []), newTask],
        })
      );
      if (!result.taskFound) return;
      finalTasks = result.updatedTasks;
      setExpandedTasks((prev) => ({ ...prev, [parentTaskId]: true })); // Keep UI state update
    } else {
      finalTasks = [...list.tasks, newTask];
    }

    triggerListUpdate(listId, finalTasks);
    // Don't clear input or reset state here, let onSuccess handle it
  };

  const handleKeyDownTaskInput = (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string,
    parentTaskId?: string
  ) => {
    if (e.key === "Enter") {
      handleAddTask(listId, parentTaskId);
    } else if (e.key === "Escape") {
      if (parentTaskId) {
        setAddingSubtaskTo(null);
      } else {
        setListAddingTaskId(null); // Hide input on escape
      }
      e.currentTarget.value = "";
      e.currentTarget.blur();
    }
  };

  const handleDeleteTask = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const { updatedTasks, taskFound } = findAndDeleteTask(
      [...list.tasks],
      taskId
    ); // Operate on a copy
    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
      if (openPriorityDropdown === taskId) {
        // Keep UI state update
        setOpenPriorityDropdown(null);
      }
    }
  };

  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      taskId,
      (task) => ({
        // Operate on a copy
        ...task,
        completed: !task.completed,
      })
    );
    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
    }
  };

  const handleSetPriority = (
    listId: string,
    taskId: string,
    newPriority: number
  ) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      taskId,
      (task) => ({
        // Operate on a copy
        ...task,
        priority: newPriority,
      })
    );
    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
      // Close dropdown via its own callback in JSX
    }
  };

  const handleStartEditing = (listId: string, task: Task) => {
    if (listId.startsWith("placeholder-")) return; // Don't edit placeholders
    setEditingTaskId(task.id); // Keep UI state update
    setEditingTaskValue(task.name);
    setOpenPriorityDropdown(null); // Close priority dropdown when editing starts
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEditing = () => {
    // Keep UI state update
    setEditingTaskId(null);
    setEditingTaskValue("");
  };

  const handleSaveEditing = (listId: string) => {
    if (!editingTaskId) return;
    const trimmedValue = editingTaskValue.trim();
    const list = taskLists.find((l) => l._id === listId);
    if (!list) {
      handleCancelEditing();
      return;
    }

    if (!trimmedValue) {
      handleDeleteTask(listId, editingTaskId); // Reuse delete logic if editing to empty
      handleCancelEditing(); // This will be reset by mutation success anyway, but good practice
      return;
    }

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      editingTaskId,
      (task) => ({
        // Operate on a copy
        ...task,
        name: trimmedValue,
      })
    );

    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
      // Let mutation onSuccess handle cancelling edit state
    } else {
      handleCancelEditing(); // Cancel if task wasn't found (edge case)
    }
  };

  const handleEditInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string
  ) => {
    if (e.key === "Enter") {
      handleSaveEditing(listId);
    } else if (e.key === "Escape") {
      handleCancelEditing();
    }
  };

  // --- UI State Toggles ---
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const togglePriorityDropdown = (taskId: string) => {
    setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId));
  };

  // --- UI Calculation ---
  const getCompletionRatio = (tasks: Task[]): string => {
    if (!tasks) return "0/0";
    let totalTasks = 0;
    let completedTasks = 0;
    const countTasks = (taskList: Task[]) => {
      taskList.forEach((task) => {
        totalTasks++;
        if (task.completed) completedTasks++;
        if (task.subtasks?.length > 0) {
          countTasks(task.subtasks);
        }
      });
    };
    countTasks(tasks);
    return totalTasks > 0 ? `${completedTasks}/${totalTasks}` : `0/0`;
  };

  // --- Focus Management Effects ---
  useEffect(() => {
    // Focus "Add Task" input when its state changes
    if (listAddingTaskId) {
      const inputElement = document.getElementById(
        `task-input-${listAddingTaskId}`
      );
      inputElement?.focus();
    }
  }, [listAddingTaskId]);

  useEffect(() => {
    // Focus "Add Subtask" input when its state changes
    if (addingSubtaskTo) {
      const inputElement = document.getElementById(
        `subtask-input-${addingSubtaskTo}`
      );
      inputElement?.focus();
    }
  }, [addingSubtaskTo]);

  // --- Render Task Function ---
  const renderTask = (
    task: Task,
    listId: string,
    level = 0
  ): React.ReactNode => {
    const isEditing = editingTaskId === task.id;
    const isExpanded = !!expandedTasks[task.id];
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isPriorityDropdownOpen = openPriorityDropdown === task.id;
    const isSubtask = level > 0;
    const indentationClass = level > 0 ? `pl-${level * 6}` : ""; // Tailwind only allows specific values, adjust as needed or use style prop
    const isPlaceholder = listId.startsWith("placeholder-");

    // Editing view...
    if (isEditing) {
      return (
        <div
          key={`${task.id}-editing`}
          className={`relative ${indentationClass}`}
        >
          <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 shadow-sm transition-all duration-200">
            <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>{" "}
            {/* Expansion Placeholder */}
            <input
              ref={editInputRef}
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
              onBlur={() => handleSaveEditing(listId)} // Save on blur
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus
            />
            <div className="w-20 flex-shrink-0" aria-hidden="true"></div>{" "}
            {/* Actions Placeholder */}
          </div>
        </div>
      );
    }

    // Normal task view...
    return (
      <div key={task.id} className={`relative group/task ${indentationClass}`}>
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 hover:shadow-sm transition-all duration-200">
          {/* Expansion Chevron/Placeholder */}
          <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
            {hasSubtasks ? (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label={
                  isExpanded ? "Collapse subtasks" : "Expand subtasks"
                }
                aria-expanded={isExpanded}
              >
                {isExpanded ? (
                  <IconChevronDown size={14} />
                ) : (
                  <IconChevronRight size={14} />
                )}
              </button>
            ) : (
              <div className="w-5" aria-hidden="true"></div> // Keep space consistent
            )}
          </div>

          {/* Checkbox and Task Name Area */}
          <div
            className="flex-1 mr-2 cursor-pointer"
            onDoubleClick={() =>
              !isPlaceholder && handleStartEditing(listId, task)
            }
          >
            <Checkbox
              checked={task.completed}
              onChange={() =>
                !isPlaceholder && handleToggleTaskCompletion(listId, task.id)
              }
              label={task.name}
              variant={isSubtask ? "subtask" : "default"}
              disabled={isPlaceholder || updateListMutation.isPending} // Disable if placeholder or updating
            />
          </div>

          {/* Action Buttons - Hide/disable on placeholders */}
          {!isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-2 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              {/* Priority */}
              <div className="relative z-10">
                {" "}
                {/* Ensure dropdown is above sibling elements */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePriorityDropdown(task.id);
                  }}
                  title={`Priority: ${
                    priorityLevels.find((p) => p.level === task.priority)
                      ?.label || "None"
                  }`}
                  className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
                  aria-haspopup="true"
                  aria-expanded={isPriorityDropdownOpen}
                  disabled={updateListMutation.isPending} // Disable if updating
                >
                  <PriorityIconDisplay level={task.priority} />
                </button>
                {isPriorityDropdownOpen && (
                  <PriorityDropdown
                    taskId={task.id}
                    listId={listId}
                    currentPriority={task.priority}
                    onSetPriority={handleSetPriority} // Pass mutation handler
                    onClose={() => setOpenPriorityDropdown(null)}
                  />
                )}
              </div>
              {/* Edit */}
              <button
                onClick={() => handleStartEditing(listId, task)}
                title="Edit task"
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
                disabled={updateListMutation.isPending} // Disable if updating
              >
                <IconEdit size={14} />
              </button>
              {/* Delete */}
              <button
                onClick={() => handleDeleteTask(listId, task.id)}
                title="Delete task"
                className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50"
                disabled={updateListMutation.isPending} // Disable if updating
              >
                <IconTrash size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Render Subtasks (Recursive Call) */}
        {hasSubtasks && isExpanded && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {task.subtasks
              .sort((a, b) => b.priority - a.priority) // Sort subtasks by priority
              .map((subtask) => renderTask(subtask, listId, level + 1))}{" "}
            {/* Pass listId down */}
          </div>
        )}

        {/* Add Subtask Input/Button - Disable for placeholders & level > 0 */}
        {!isPlaceholder && level === 0 && (
          <div className={`mt-1 ${indentationClass}`}>
            {addingSubtaskTo === task.id ? (
              <input
                ref={subtaskInputRef}
                id={`subtask-input-${task.id}`}
                type="text"
                onKeyDown={(e) => handleKeyDownTaskInput(e, listId, task.id)}
                onBlur={(e) => {
                  // Delay check slightly to allow Enter to process first
                  setTimeout(() => {
                    if (!e.target.value.trim() && addingSubtaskTo === task.id) {
                      setAddingSubtaskTo(null);
                    }
                  }, 150);
                }}
                className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
                placeholder="New subtask..."
                disabled={updateListMutation.isPending} // Disable if updating
                // Focus handled by useEffect
              />
            ) : (
              <button
                onClick={() => setAddingSubtaskTo(task.id)}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 pl-7 opacity-0 group-hover/task:opacity-100 disabled:opacity-50"
                title="Add subtask"
                disabled={updateListMutation.isPending} // Disable if updating
              >
                <IconCopyPlus size={14} />
                <span>Add subtask</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }; // --- End of renderTask ---

  // --- Loading and Empty States ---
  if (status === "loading" || (status === "authenticated" && isLoadingLists)) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Loading Tasks...
      </div>
    );
  }
  if (status === "unauthenticated" && !taskLists.length) {
    // Show message only if no placeholder data is shown
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Please sign in to manage your tasks.
      </div>
    );
  }
  if (isErrorLists) {
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        Error loading tasks: {errorLists?.message || "Unknown error"}
      </div>
    );
  }

  // --- Main Component Render ---
  // Use taskLists directly from useQuery (could be actual data or placeholderData)
  const listsToDisplay = taskLists;

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          My Tasks
        </h1>
        {/* Optional: Global mutation loading/error indicator */}
        {updateListMutation.isPending && (
          <span className="text-xs text-blue-500">Saving...</span>
        )}
        {updateListMutation.isError && (
          <span className="text-xs text-red-500">Save Error!</span>
        )}
      </div>
      {/* Scrollable area for task lists */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        {listsToDisplay.length === 0 &&
          !isAddingList &&
          status === "authenticated" &&
          !isLoadingLists && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-10">
              No task lists yet. Add one below!
            </div>
          )}
        {/* Map over taskLists from useQuery */}
        {listsToDisplay.map((list) => (
          <div key={list._id || list.name} className="mb-6 group/list">
            {/* List Header (Name, Ratio, Delete Button) */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
                {list.name}
              </h2>
              <div className="flex-1 mx-3 border-t border-slate-200 dark:border-zinc-700 border-dashed"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
                  {getCompletionRatio(list.tasks)}
                </span>
                {/* Delete list button */}
                {!list._id?.startsWith("placeholder-") && (
                  <button
                    onClick={() => handleDeleteList(list._id)}
                    title={`Delete list "${list.name}"`}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover/list:opacity-100 disabled:opacity-50"
                    disabled={
                      deleteListMutation.isPending &&
                      deleteListMutation.variables === list._id
                    }
                  >
                    {deleteListMutation.isPending &&
                    deleteListMutation.variables === list._id ? (
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block"></span>
                    ) : (
                      <IconTrash size={16} />
                    )}
                  </button>
                )}
              </div>
            </div>
            {/* Render Tasks for the current list */}
            {(list.tasks || []) // Add safety check for tasks array
              .sort((a, b) => b.priority - a.priority) // Sort top-level tasks
              .map((task) => renderTask(task, list._id!, 0))}{" "}
            {/* Pass list._id safely */}
            {/* Input field for adding a new task to this list */}
            {listAddingTaskId === list._id &&
              !list._id?.startsWith("placeholder-") && (
                <div className="mt-2">
                  <input
                    id={`task-input-${list._id}`}
                    ref={(el) => {
                      taskInputRefs.current[list._id!] = el;
                    }}
                    type="text"
                    onKeyDown={(e) => handleKeyDownTaskInput(e, list._id!)}
                    onBlur={(e) => {
                      setTimeout(() => {
                        const currentInput = document.getElementById(
                          `task-input-${list._id}`
                        );
                        if (
                          currentInput &&
                          !e.target.value.trim() &&
                          listAddingTaskId === list._id
                        ) {
                          setListAddingTaskId(null);
                        }
                      }, 150);
                    }}
                    className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
                    placeholder="New task..."
                    disabled={updateListMutation.isPending} // Disable if updating
                    // Focus handled by useEffect
                  />
                </div>
              )}
            {/* Button to show the 'Add task' input field */}
            {listAddingTaskId !== list._id &&
              !list._id?.startsWith("placeholder-") && (
                <button
                  onClick={() => setListAddingTaskId(list._id!)}
                  className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 mt-1 disabled:opacity-50"
                  title="Add task"
                  disabled={updateListMutation.isPending} // Disable if updating
                >
                  <IconCopyPlus size={14} />
                  <span>Add task</span>
                </button>
              )}
          </div>
        ))}{" "}
        {/* End of task list map */}
        {/* Input field for adding a new list */}
        {isAddingList && (
          <div className="mb-6 mt-4">
            <input
              ref={listNameInputRef}
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={handleAddList} // Uses mutation handler
              onBlur={() => {
                // Hide if blurred and empty
                setTimeout(() => {
                  if (
                    listNameInputRef.current &&
                    !newListName.trim() &&
                    isAddingList
                  ) {
                    setIsAddingList(false);
                    setNewListName("");
                  }
                }, 100);
              }}
              className="w-full text-lg font-medium text-slate-700 dark:text-slate-300 bg-transparent border-b-2 border-slate-300/50 dark:border-zinc-600/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 disabled:opacity-50"
              placeholder="New list name..."
              autoFocus
              disabled={addListMutation.isPending} // Disable while adding
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Press Enter to save or Escape to cancel
            </p>
            {addListMutation.isError && (
              <p className="text-xs text-red-500 mt-1">
                Error: {addListMutation.error.message}
              </p>
            )}
          </div>
        )}
      </div>{" "}
      {/* End of scrollable area */}
      {/* Footer Section - Button to add a new list */}
      {!isAddingList && (
        <button
          onClick={() => {
            setIsAddingList(true);
            setTimeout(() => listNameInputRef.current?.focus(), 0);
          }}
          className="mt-4 flex items-center justify-center p-2 w-full bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 hover:border-slate-300/70 dark:hover:border-zinc-600/70 transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={status !== "authenticated" || addListMutation.isPending}
          title={
            status !== "authenticated"
              ? "Sign in to add lists"
              : "Add a new task list"
          }
        >
          {addListMutation.isPending ? (
            <>
              <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <IconSquareRoundedPlus2 size={18} className="mr-2" />
              <span className="font-medium">Add new list</span>
            </>
          )}
        </button>
      )}
    </div> // End of outer container
  );
};

export default TaskLogger;