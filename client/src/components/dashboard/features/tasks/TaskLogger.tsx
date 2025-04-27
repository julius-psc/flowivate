"use client"; // Ensure this is at the very top

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
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import Checkbox from "../../recyclable/Checkbox"; // Adjust path if needed
import * as tasksApi from "../../../../lib/tasksApi"; // Adjust path if needed
import type { Task, TaskList } from "@/types/taskTypes"; // Adjust path if needed

// --- Helper Functions ---
const createNewTask = (name: string): Task => ({
  id: crypto.randomUUID(),
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
      className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 rounded-lg shadow-lg z-[1000] py-1.5 transition-all duration-200 ease-out animate-fade-in" // Increased z-index
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
  const queryKey: QueryKey = ["tasks"]; // Define query key for reuse

  // --- Local UI State ---
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
  const [listAddingTaskId, setListAddingTaskId] = useState<string | null>(null);

  // --- Refs ---
  const editInputRef = useRef<HTMLInputElement>(null);
  const listNameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const taskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // --- React Query: Fetching Task Lists ---
  const {
    data: taskLists = [],
    isLoading: isLoadingLists,
    isError: isErrorLists,
    error: errorLists,
  } = useQuery<TaskList[], Error>({
    queryKey: queryKey,
    queryFn: tasksApi.getTaskLists,
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5, // Use a reasonable stale time
    refetchOnWindowFocus: true,
    placeholderData:
      status !== "authenticated" ? placeholderTaskLists : undefined,
  });

  // --- React Query: Mutations ---

  const addListMutation = useMutation({
    mutationFn: tasksApi.addTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setIsAddingList(false);
      setNewListName("");
    },
    onError: (error) => {
      console.error("Error adding list:", error);
      // Consider user feedback (e.g., toast)
    },
  });

  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onMutate: async (variables: {
      id: string;
      tasks?: Task[];
      name?: string;
    }) => {
      // Handle mutations that might only include 'name' or other fields later
      if (!variables.tasks) {
        console.warn("Optimistic update skipped: tasks not provided.");
        // Still snapshot previous data for potential rollback of other fields
        const previousTaskLists =
          queryClient.getQueryData<TaskList[]>(queryKey);
        return { previousTaskLists };
      }
      // Proceed with optimistic update for tasks
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTaskLists = queryClient.getQueryData<TaskList[]>(queryKey);
      if (previousTaskLists) {
        queryClient.setQueryData<TaskList[]>(
          queryKey,
          (old) =>
            old?.map((list) =>
              list._id === variables.id
                ? { ...list, tasks: variables.tasks as Task[] }
                : list
            ) ?? []
        );
      }
      return { previousTaskLists };
    },
    onError: (err, variables, context) => {
      console.error(`Error updating list ${variables.id}:`, err);
      if (context?.previousTaskLists) {
        queryClient.setQueryData(queryKey, context.previousTaskLists);
      }
      // Consider user feedback
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      // Clean up UI state *after* mutation settles
      if (variables.tasks) {
        const listContext = taskLists.find((l) => l._id === variables.id); // Get current list data
        const wasEditingThisListTask = listContext?.tasks?.some(
          (t) => t.id === editingTaskId
        );
        if (editingTaskId && wasEditingThisListTask) {
          setEditingTaskId(null);
          setEditingTaskValue("");
        }
        if (listAddingTaskId === variables.id) {
          const input = document.getElementById(
            `task-input-${listAddingTaskId}`
          ) as HTMLInputElement;
          if (input) input.value = "";
          setListAddingTaskId(null);
        }
        const wasAddingSubtaskToThisList = listContext?.tasks?.some(
          (t) =>
            t.id === addingSubtaskTo ||
            t.subtasks?.some((st) => st.id === addingSubtaskTo)
        );
        if (addingSubtaskTo && wasAddingSubtaskToThisList) {
          const input = document.getElementById(
            `subtask-input-${addingSubtaskTo}`
          ) as HTMLInputElement;
          if (input) input.value = "";
          setAddingSubtaskTo(null);
        }
      }
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: tasksApi.deleteTaskList,
    onMutate: async (listIdToDelete) => {
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTaskLists = queryClient.getQueryData<TaskList[]>(queryKey);
      if (previousTaskLists) {
        queryClient.setQueryData(
          queryKey,
          previousTaskLists.filter((list) => list._id !== listIdToDelete)
        );
      }
      return { previousTaskLists };
    },
    onError: (err, listId, context) => {
      console.error(`Error deleting list ${listId}:`, err);
      if (context?.previousTaskLists) {
        queryClient.setQueryData(queryKey, context.previousTaskLists);
      }
      // Consider user feedback
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  // --- Task/List Management Helpers (Recursive Functions) ---
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
    };
  };

  // --- Action Handlers (Use Mutations) ---

  const handleAddList = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newListName.trim() && session?.user?.id) {
      addListMutation.mutate({ name: newListName.trim() });
    } else if (e.key === "Escape") {
      setIsAddingList(false);
      setNewListName("");
    }
  };

  const handleDeleteList = (listId: string | undefined) => {
    if (!listId || listId.startsWith("placeholder-")) return;
    deleteListMutation.mutate(listId);
  };

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
          ...task,
          subtasks: [...(task.subtasks || []), newTask],
        })
      );
      if (!result.taskFound) return;
      finalTasks = result.updatedTasks;
      setExpandedTasks((prev) => ({ ...prev, [parentTaskId]: true })); // Keep parent expanded
    } else {
      finalTasks = [...list.tasks, newTask];
    }

    triggerListUpdate(listId, finalTasks);
    // onSettled will clear input
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
        setListAddingTaskId(null);
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
    );
    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
      if (openPriorityDropdown === taskId) {
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
        ...task,
        priority: newPriority,
      })
    );
    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
    }
  };

  const handleStartEditing = (listId: string, task: Task) => {
    if (listId.startsWith("placeholder-")) return;
    setEditingTaskId(task.id);
    setEditingTaskValue(task.name);
    setOpenPriorityDropdown(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEditing = () => {
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
      handleDeleteTask(listId, editingTaskId);
      handleCancelEditing(); // Cancel locally
      return;
    }

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      editingTaskId,
      (task) => ({
        ...task,
        name: trimmedValue,
      })
    );

    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
      // Let onSettled handle cancelling edit state UI
    } else {
      handleCancelEditing();
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
    if (listAddingTaskId) {
      const inputElement = document.getElementById(
        `task-input-${listAddingTaskId}`
      );
      inputElement?.focus();
    }
  }, [listAddingTaskId]);

  useEffect(() => {
    if (addingSubtaskTo) {
      const inputElement = document.getElementById(
        `subtask-input-${addingSubtaskTo}`
      );
      inputElement?.focus();
    }
  }, [addingSubtaskTo]);

  // --- Render Task Function (Keeps internal task styling) ---
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
    const indentationClass = level > 0 ? `pl-${level * 4}` : ""; // Adjusted indent
    const isPlaceholder = listId.startsWith("placeholder-");
    const isMutating =
      updateListMutation.isPending &&
      updateListMutation.variables?.id === listId;

    // Editing view (Keep internal styling)
    if (isEditing) {
      return (
        <div
          key={`${task.id}-editing`}
          className={`relative ${indentationClass}`}
        >
          <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 shadow-sm transition-all duration-200">
            <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>
            <input
              ref={editInputRef}
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
              onBlur={() => handleSaveEditing(listId)} // Save on blur is common
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus
              disabled={isMutating}
            />
            <div className="w-20 flex-shrink-0" aria-hidden="true"></div>
          </div>
        </div>
      );
    }

    // Normal task view (Keep internal styling)
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
                {" "}
                {isExpanded ? (
                  <IconChevronDown size={14} />
                ) : (
                  <IconChevronRight size={14} />
                )}{" "}
              </button>
            ) : (
              <div className="w-5" aria-hidden="true"></div>
            )}
          </div>

          {/* Checkbox and Task Name */}
          <div
            className="flex-1 mr-2 cursor-pointer"
            onDoubleClick={() =>
              !isPlaceholder && !isMutating && handleStartEditing(listId, task)
            }
            title={!isPlaceholder ? "Double-click to edit" : ""}
          >
            <Checkbox
              checked={task.completed}
              onChange={() =>
                !isPlaceholder &&
                !isMutating &&
                handleToggleTaskCompletion(listId, task.id)
              }
              label={task.name}
              variant={isSubtask ? "subtask" : "default"}
              disabled={isPlaceholder || isMutating}
            />
          </div>

          {/* Priority Button (Always Visible) */}
          {!isPlaceholder && (
            <div className="relative z-10 mr-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isMutating) togglePriorityDropdown(task.id);
                }}
                title={`Priority: ${
                  priorityLevels.find((p) => p.level === task.priority)
                    ?.label || "None"
                }`}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-haspopup="true"
                aria-expanded={isPriorityDropdownOpen}
                disabled={isMutating}
              >
                <PriorityIconDisplay level={task.priority} />
              </button>
              {isPriorityDropdownOpen && (
                <PriorityDropdown
                  taskId={task.id}
                  listId={listId}
                  currentPriority={task.priority}
                  onSetPriority={handleSetPriority}
                  onClose={() => setOpenPriorityDropdown(null)}
                />
              )}
            </div>
          )}

          {/* Action Buttons (Edit/Delete) - Remain Hover-Activated */}
          {!isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-2 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => !isMutating && handleStartEditing(listId, task)}
                title="Edit task"
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isMutating}
              >
                {" "}
                <IconEdit size={14} />{" "}
              </button>
              <button
                onClick={() => !isMutating && handleDeleteTask(listId, task.id)}
                title="Delete task"
                className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isMutating}
              >
                {" "}
                <IconTrash size={14} />{" "}
              </button>
            </div>
          )}
        </div>

        {/* Render Subtasks */}
        {hasSubtasks && isExpanded && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {" "}
            {task.subtasks
              .sort((a, b) => b.priority - a.priority)
              .map((subtask) => renderTask(subtask, listId, level + 1))}{" "}
          </div>
        )}

        {/* Add Subtask Input/Button */}
        {!isPlaceholder && level === 0 && (
          <div className={`mt-1 ${indentationClass}`}>
            {addingSubtaskTo === task.id ? (
              <input
                ref={subtaskInputRef}
                id={`subtask-input-${task.id}`}
                type="text"
                onKeyDown={(e) => handleKeyDownTaskInput(e, listId, task.id)}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (!e.target.value.trim() && addingSubtaskTo === task.id) {
                      setAddingSubtaskTo(null);
                    }
                  }, 150);
                }}
                className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
                placeholder="New subtask..."
                disabled={isMutating}
              />
            ) : (
              <button
                onClick={() => !isMutating && setAddingSubtaskTo(task.id)}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 pl-7 opacity-0 group-hover/task:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add subtask"
                disabled={isMutating}
              >
                {" "}
                <IconCopyPlus size={14} /> <span>Add subtask</span>{" "}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }; // --- End of renderTask ---

  // --- Loading and Empty States ---
  if (
    status === "loading" ||
    (status === "authenticated" && isLoadingLists && !taskLists.length)
  ) {
    return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        Loading Tasks...
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

  // Determine lists to display (handle unauthenticated state with placeholders)
  const listsToDisplay =
    status === "authenticated" ? taskLists : placeholderTaskLists;
  // Handle case where user is logged in but query returns empty (and not loading)
  const showNoListsMessage =
    status === "authenticated" &&
    !isLoadingLists &&
    !isErrorLists &&
    taskLists.length === 0 &&
    !isAddingList;
  // Handle case where user is not logged in and there are no placeholders
  const showSignInMessage =
    status === "unauthenticated" &&
    (!placeholderTaskLists || placeholderTaskLists.length === 0);

  return (
    // Outer container: No background/border, just padding and flex structure
    <div className="p-4 flex flex-col h-full">
      {/* Header: Centered with max-width */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 max-w-3xl mx-auto w-full px-2">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          My Tasks
        </h1>
        {updateListMutation.isPending && (
          <span className="text-xs text-blue-500 animate-pulse">Saving...</span>
        )}
      </div>
      {/* Scrollable area: No visible scrollbar styling */}
      <div className="flex-1 overflow-y-auto">
        {/* Centering and Max Width Container for Lists */}
        <div className="max-w-3xl mx-auto w-full px-2">
          {showNoListsMessage && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-10">
              {" "}
              No task lists yet. Add one below!{" "}
            </div>
          )}
          {showSignInMessage && (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              Please sign in to manage tasks.
            </div>
          )}

          {/* Map over taskLists */}
          {listsToDisplay.map((list) => (
            <div key={list._id || list.name} className="mb-6 group/list">
              {/* List Header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  {" "}
                  {list.name}{" "}
                </h2>
                <div className="flex-1 mx-3 border-t border-slate-200 dark:border-zinc-700 border-dashed"></div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
                    {" "}
                    {getCompletionRatio(list.tasks)}{" "}
                  </span>
                  {/* Delete button only if not placeholder */}
                  {!list._id?.startsWith("placeholder-") && (
                    <button
                      onClick={() => handleDeleteList(list._id)}
                      title={`Delete list "${list.name}"`}
                      className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover/list:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
              {/* Render Tasks */}
              {(list.tasks || [])
                .sort((a, b) => b.priority - a.priority)
                .map((task) => renderTask(task, list._id!, 0))}

              {/* Add Task Input/Button (only if not placeholder) */}
              {!list._id?.startsWith("placeholder-") && (
                <>
                  {listAddingTaskId === list._id && (
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
                            if (
                              !e.target.value.trim() &&
                              listAddingTaskId === list._id
                            ) {
                              setListAddingTaskId(null);
                            }
                          }, 150);
                        }}
                        className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
                        placeholder="New task..."
                        disabled={updateListMutation.isPending}
                      />
                    </div>
                  )}
                  {listAddingTaskId !== list._id && (
                    <button
                      onClick={() =>
                        !updateListMutation.isPending &&
                        setListAddingTaskId(list._id!)
                      }
                      className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add task"
                      disabled={updateListMutation.isPending}
                    >
                      <IconCopyPlus size={14} /> <span>Add task</span>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Add New List Input (only if authenticated) */}
          {status === "authenticated" && isAddingList && (
            <div className="mb-6 mt-4">
              <input
                ref={listNameInputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleAddList}
                onBlur={() => {
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
                disabled={addListMutation.isPending}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {" "}
                Press Enter to save or Escape to cancel{" "}
              </p>
              {addListMutation.isError && (
                <p className="text-xs text-red-500 mt-1">
                  {" "}
                  Error: {addListMutation.error.message}{" "}
                </p>
              )}
            </div>
          )}
        </div>{" "}
        {/* End Centering Container */}
      </div>{" "}
      {/* End Scrollable Area */}
      {/* Footer Section: Add List Button (Centered, only if authenticated) */}
      {status === "authenticated" && (
        <div className="max-w-3xl mx-auto w-full px-2 mt-4 flex-shrink-0">
          {!isAddingList && (
            <button
              onClick={() => {
                if (!addListMutation.isPending) {
                  setIsAddingList(true);
                  setTimeout(() => listNameInputRef.current?.focus(), 0);
                }
              }}
              // Simplified styling
              className="flex items-center justify-center p-2 w-full rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={addListMutation.isPending}
              title="Add a new task list"
            >
              {addListMutation.isPending ? (
                <>
                  {" "}
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></span>{" "}
                  <span>Adding...</span>{" "}
                </>
              ) : (
                <>
                  {" "}
                  <IconSquareRoundedPlus2 size={18} className="mr-2" />{" "}
                  <span className="font-medium">Add new list</span>{" "}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div> // End Outer Container
  );
};

export default TaskLogger;