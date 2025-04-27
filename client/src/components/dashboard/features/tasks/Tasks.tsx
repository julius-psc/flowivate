"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  IconEdit,
  IconFlag,
  IconFlagFilled,
  IconChevronDown,
  IconChevronRight,
  IconArrowRight,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Checkbox from "../../recyclable/Checkbox"; // Adjust path as needed
import Link from "next/link";
import * as tasksApi from "../../../../lib/tasksApi"; // Adjust path as needed
import type { Task, TaskList } from "@/types/taskTypes"; // Adjust path as needed

// --- Skeleton Loader Component ---
const TasksSkeleton = () => {
  const numberOfPlaceholderTasks = 3; // Number of skeleton rows to show

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>{" "}
        {/* "TASKS" placeholder */}
        <div className="h-7 w-28 bg-gray-300 dark:bg-zinc-600 rounded-md"></div>{" "}
        {/* "Go to Tasks" button placeholder */}
      </div>
      {/* Summary Message Skeleton */}
      <div className="h-4 w-3/5 bg-gray-200 dark:bg-zinc-700 rounded mb-3 mx-auto"></div>{" "}
      {/* Summary text placeholder */}
      {/* Task Items Skeleton */}
      <div className="space-y-2 flex-grow">
        {[...Array(numberOfPlaceholderTasks)].map((_, index) => (
          <div
            key={index}
            className="flex items-center p-2 rounded-lg bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent"
          >
            <div className="w-5 h-5 bg-gray-300 dark:bg-zinc-600 rounded mr-3 flex-shrink-0"></div>{" "}
            {/* Checkbox placeholder */}
            <div className="h-4 flex-1 bg-gray-200 dark:bg-zinc-700 rounded"></div>{" "}
            {/* Task Name placeholder */}
          </div>
        ))}
      </div>
      {/* Footer Link Skeleton */}
      <div className="mt-3 text-center flex-shrink-0">
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded mx-auto"></div>{" "}
        {/* "View all tasks" placeholder */}
      </div>
    </div>
  );
};

// --- Helper Functions (Unchanged) ---
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

// Minimal placeholder for logged-out state (Unchanged)
const placeholderTaskLists: TaskList[] = [
  {
    _id: "placeholder-preview",
    name: "Tasks Preview",
    tasks: [
      {
        id: "p1",
        name: "Sign in to view your tasks",
        completed: false,
        priority: 0,
        subtasks: [],
      },
    ],
  },
];

// --- Priority Dropdown Component (Unchanged) ---
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
      className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 rounded-lg z-20 py-1.5 transition-all duration-200 ease-out animate-fade-in" // Higher z-index maybe needed
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

// --- Main Tasks (Preview) Component ---
const Tasks: React.FC = () => {
  // --- React Query Client (Unchanged) ---
  const queryClient = useQueryClient();
  const { status } = useSession();

  // --- Local UI State (Unchanged) ---
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>(
    {}
  );
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState<
    string | null
  >(null);

  // --- Refs (Unchanged) ---
  const editInputRef = useRef<HTMLInputElement>(null);

  const MAX_PREVIEW_TASKS = 5;

  // --- React Query: Fetching Task Lists (Unchanged) ---
  const {
    data: taskLists = [],
    isLoading: isLoadingLists,
    isError: isErrorLists,
    error: errorLists,
  } = useQuery<TaskList[], Error>({
    queryKey: ["tasks"],
    queryFn: tasksApi.getTaskLists,
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 1,
    refetchOnWindowFocus: true,
    placeholderData:
      status !== "authenticated" ? placeholderTaskLists : undefined,
  });

  // --- React Query: Mutations (Unchanged) ---
  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (
        editingTaskId &&
        variables.tasks &&
        variables.id ===
          taskLists.find((list) =>
            list.tasks?.some((task) => task.id === editingTaskId)
          )?._id
      ) {
        setEditingTaskId(null);
        setEditingTaskValue("");
      }
    },
    onError: (error, variables) => {
      console.error(`Error updating list ${variables.id} from preview:`, error);
    },
  });

  // --- Task Management Helpers (Unchanged) ---
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
      // Ensure subtasks exist before trying to map over them
      if (task.subtasks && task.subtasks.length > 0) {
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

  const triggerListUpdate = (listId: string, updatedTasks: Task[]) => {
    const list = taskLists.find((l) => l._id === listId);
    if (list && list._id && !list._id.startsWith("placeholder-")) {
      updateListMutation.mutate({ id: list._id, tasks: updatedTasks });
    } else {
      console.warn(
        `List ${listId} not found or is placeholder, cannot update from preview.`
      );
    }
  };

  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list || !list.tasks) return; // Added check for list.tasks
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
    if (!list || !list.tasks) return; // Added check for list.tasks
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
    if (!editingTaskId || listId.startsWith("placeholder-")) return;
    const trimmedValue = editingTaskValue.trim();
    const list = taskLists.find((l) => l._id === listId);
    if (!list || !list.tasks) {
      handleCancelEditing();
      return;
    } // Added check for list.tasks

    if (!trimmedValue) {
      handleCancelEditing();
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

  // --- UI State Toggles (Unchanged) ---
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };
  const togglePriorityDropdown = (taskId: string) => {
    if (editingTaskId) return;
    setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId));
  };

  // --- UI Calculation (Unchanged) ---
  const calculateTotalIncomplete = (
    allLists: TaskList[] | undefined
  ): number => {
    if (
      !allLists ||
      allLists.length === 0 ||
      allLists.some((l) => l._id?.startsWith("placeholder-"))
    )
      return 0;

    let count = 0;
    const countIncomplete = (tasks: Task[]) => {
      tasks.forEach((task) => {
        if (!task.completed) count++;
      });
    };

    allLists.forEach((list) => {
      if (!list._id?.startsWith("placeholder-")) {
        countIncomplete(list.tasks || []);
      }
    });
    return count;
  };

  // --- Render Task Function (Unchanged) ---
  const renderTask = (
    task: Task,
    listId: string,
    level = 0
  ): React.ReactNode => {
    const isEditing = editingTaskId === task.id;
    const isExpanded = !!expandedTasks[task.id];
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isPriorityDropdownOpen = openPriorityDropdown === task.id;
    const indentationClass = level > 0 ? `pl-${level * 6}` : "";
    const isPlaceholder = listId.startsWith("placeholder-");

    if (isPlaceholder) {
      return (
        <div
          key={task.id}
          className={`relative group/task ${indentationClass}`}
        >
          <div className="flex items-center p-2 rounded-lg">
            <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
              <div className="w-5"></div>
            </div>
            <Checkbox
              checked={false}
              onChange={() => {}}
              label={task.name}
              variant="default"
              disabled={true}
            />
          </div>
        </div>
      );
    }

    if (isEditing) {
      return (
        <div
          key={`${task.id}-editing`}
          className={`relative ${indentationClass}`}
        >
          <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 transition-all duration-200">
            <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>
            <input
              ref={editInputRef}
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
              onBlur={() => handleSaveEditing(listId)}
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus
              disabled={updateListMutation.isPending}
            />
            <div className="w-16 flex-shrink-0" aria-hidden="true"></div>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} className={`relative group/task ${indentationClass}`}>
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 transition-all duration-200">
          <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
            {hasSubtasks ? (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              >
                {isExpanded ? (
                  <IconChevronDown size={14} />
                ) : (
                  <IconChevronRight size={14} />
                )}
              </button>
            ) : (
              <div className="w-5"></div>
            )}
          </div>

          <div
            className="flex-1 mr-2 cursor-pointer"
            onDoubleClick={() => handleStartEditing(listId, task)}
          >
            <Checkbox
              checked={task.completed}
              onChange={() => handleToggleTaskCompletion(listId, task.id)}
              label={task.name}
              variant="default"
              disabled={updateListMutation.isPending}
            />
          </div>

          <div className="flex items-center gap-1 ml-auto pl-2 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            <div className="relative z-10">
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
                disabled={updateListMutation.isPending}
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
            <button
              onClick={() => handleStartEditing(listId, task)}
              title="Edit task"
              className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
              disabled={updateListMutation.isPending}
            >
              <IconEdit size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // --- Loading State --- (MODIFIED TO USE SKELETON)
  // Show skeleton if session is loading OR if authenticated but query is loading AND we don't have data yet
  if (
    status === "loading" ||
    (status === "authenticated" && isLoadingLists && !taskLists?.length)
  ) {
    return <TasksSkeleton />; // <-- Use the skeleton component here
  }

  // Error state (Unchanged)
  if (isErrorLists) {
    return (
      <div className="p-4 text-center text-red-500 dark:text-red-400">
        Error loading tasks preview: {errorLists?.message || "Unknown error"}
      </div>
    );
  }

  // Data for display (Unchanged)
  const displayList =
    taskLists?.find(
      (list) => list._id && !list._id.startsWith("placeholder-")
    ) ||
    taskLists?.[0] ||
    null;
  const displayTasks = displayList
    ? (displayList.tasks || []).slice(0, MAX_PREVIEW_TASKS)
    : [];
  const totalIncomplete = calculateTotalIncomplete(taskLists);

  // --- Main Component Render (Unchanged) ---
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          TASKS
        </h1>
        <Link href="/dashboard/tasks" passHref legacyBehavior>
          <a className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 transition-all">
            <span>Go to Tasks</span>
            <IconArrowRight size={14} />
          </a>
        </Link>
      </div>

      {/* Summary Message */}
      {status === "authenticated" &&
        !isLoadingLists &&
        !isErrorLists &&
        !taskLists?.some((l) => l._id?.startsWith("placeholder-")) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
            You have <span className="font-semibold">{totalIncomplete}</span>{" "}
            task{totalIncomplete !== 1 ? "s" : ""} remaining.
          </p>
        )}
      {status === "unauthenticated" && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center">
          Sign in to see your tasks.
        </p>
      )}

      {/* Display Area */}
      <div className="space-y-1 flex-grow">
        {displayList ? (
          <>
            {displayTasks.length > 0 ? (
              displayTasks
                .sort((a, b) => b.priority - a.priority)
                .map((task) => renderTask(task, displayList._id!, 0))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                {status === "authenticated"
                  ? "No tasks found in this list."
                  : "Sign in to view tasks."}
              </div>
            )}
          </>
        ) : (
          status === "authenticated" &&
          !isLoadingLists &&
          !isErrorLists &&
          taskLists?.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No task lists found. Add one in the main Tasks view.
            </div>
          )
        )}
      </div>

      {/* Footer Link */}
      <div className="mt-3 text-center flex-shrink-0">
        <Link
          href="/dashboard/tasks"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          View all tasks
        </Link>
      </div>
    </div>
  );
};

export default Tasks;
