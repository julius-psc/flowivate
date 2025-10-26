"use client";

import React, { useState, useRef, useEffect } from "react";
import { IconFlag, IconFlagFilled, IconCheck } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Checkbox from "../../recyclable/Checkbox"; 
import Link from "next/link";
import * as tasksApi from "../../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";
import { toast } from "sonner";
import { useGlobalStore } from "@/hooks/useGlobalStore";

// --- Skeleton Component (Unchanged) ---
const TasksSkeleton = () => {
  const numberOfPlaceholderTasks = 3;
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col animate-pulse">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded"></div>
        <div className="h-7 w-28 bg-gray-300 dark:bg-zinc-600 rounded-md"></div>
      </div>
      <div className="h-4 w-3/5 bg-gray-200 dark:bg-zinc-700 rounded mb-3 mx-auto"></div>
      <div className="space-y-2 flex-grow">
        {[...Array(numberOfPlaceholderTasks)].map((_, index) => (
          <div
            key={index}
            className="flex items-center p-2 rounded-lg bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent"
          >
            <div className="w-5 h-5 bg-gray-300 dark:bg-zinc-600 rounded mr-3 flex-shrink-0"></div>
            <div className="h-4 flex-1 bg-gray-200 dark:bg-zinc-700 rounded"></div>
            <div className="w-5 h-5 bg-gray-300 dark:bg-zinc-600 rounded ml-auto flex-shrink-0"></div>
          </div>
        ))}
      </div>
      <div className="mt-3 text-center flex-shrink-0">
        <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded mx-auto"></div>
      </div>
    </div>
  );
};

// --- Priority Configuration and Display (Unchanged) ---
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

// --- Placeholder Data (Unchanged) ---
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
      {
        id: "p2",
        name: "High priority task example",
        completed: false,
        priority: 3,
        subtasks: [],
      },
      {
        id: "p3",
        name: "Another task example",
        completed: false,
        priority: 1,
        subtasks: [],
      },
      {
        id: "p4",
        name: "A completed task example",
        completed: true,
        priority: 2,
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
      className="absolute right-0 bottom-full mb-2 w-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 rounded-lg z-[1000] py-1.5 transition-all duration-200 ease-out animate-fade-in"
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

// --- Main Tasks Component ---
interface AggregatedTask extends Task {
  listId: string;
}

type UpdateTaskListVariables = {
  id: string;
  tasks?: Task[];
  name?: string;
};

const Tasks: React.FC = () => {
  const queryClient = useQueryClient();
  const { status } = useSession();
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState<
    string | null
  >(null);
  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);
  const MAX_PREVIEW_TASKS = 5;

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
    refetchOnWindowFocus: true, // Keep refetch on focus for dashboard staleness
    placeholderData:
      status !== "authenticated" ? placeholderTaskLists : undefined,
    // Ensure structural sharing is enabled (default in v5) to minimize re-renders
    // structuralSharing: true, // (Default in TanStack Query v5+)
  });

  useEffect(() => {
    if (isErrorLists && errorLists) {
      toast.error(
        `Error loading tasks preview: ${errorLists?.message || "Unknown error"}`
      );
    }
  }, [isErrorLists, errorLists]);

  // findAndUpdateTask remains the same, crucial for locating the task
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

  // Helper function to find a task
  const findTaskById = (tasks: Task[], taskId: string): Task | null => {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findTaskById(task.subtasks, taskId);
        if (found) {
          return found;
        }
      }
    }
    return null;
  };

  // updateListMutation remains the same, handles optimistic update
  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onMutate: async (variables: UpdateTaskListVariables) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTaskLists = queryClient.getQueryData<TaskList[]>(["tasks"]);
      if (previousTaskLists && variables.tasks) {
        const optimisticTasks = variables.tasks;
        queryClient.setQueryData<TaskList[]>(
          ["tasks"],
          (old) =>
            old?.map((list) =>
              list._id === variables.id
                ? { ...list, tasks: optimisticTasks }
                : list
            ) ?? []
        );
      }
      return { previousTaskLists };
    },
    onError: (err, variables, context) => {
      console.error("Optimistic update failed:", err);
      if (context?.previousTaskLists) {
        queryClient.setQueryData(["tasks"], context.previousTaskLists);
      }
      toast.error(
        `Failed to update task: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    },
    onSettled: () => {
      // Invalidate to ensure consistency, but the displayed list order
      // should now be stable due to the change in getTopPriorityTasks sorting.
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // handleToggleTaskCompletion remains the same
  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list || !list.tasks || list._id?.startsWith("placeholder-")) return;

    // Find the task's current state
    const taskToToggle = findTaskById([...list.tasks], taskId);
    const isCompleting = taskToToggle ? !taskToToggle.completed : false;

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      taskId,
      (task) => ({ ...task, completed: !task.completed })
    );

    if (taskFound) {
      updateListMutation.mutate({ id: listId, tasks: updatedTasks });

      // Trigger event only if task is being marked as complete
      if (isCompleting) {
        triggerLumoEvent("TASK_COMPLETED");
      }
    } else {
      console.warn("Task not found for toggling:", taskId, "in list:", listId);
    }
  };

  // handleSetPriority remains the same
  const handleSetPriority = (
    listId: string,
    taskId: string,
    newPriority: number
  ) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list || !list.tasks || list._id?.startsWith("placeholder-")) return;
    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      taskId,
      (task) => ({ ...task, priority: newPriority })
    );
    if (taskFound) {
      updateListMutation.mutate({ id: listId, tasks: updatedTasks });
    } else {
      console.warn(
        "Task not found for setting priority:",
        taskId,
        "in list:",
        listId
      );
    }
    setOpenPriorityDropdown(null);
  };

  // togglePriorityDropdown remains the same
  const togglePriorityDropdown = (taskId: string) => {
    setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId));
  };

  // calculateTotalIncomplete remains the same (counts actual incomplete)
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
    const countIncompleteRecursive = (tasks: Task[]) => {
      tasks.forEach((task) => {
        if (!task.completed) {
          count++;
        }
        if (task.subtasks && task.subtasks.length > 0) {
          countIncompleteRecursive(task.subtasks);
        }
      });
    };
    allLists.forEach((list) => {
      if (!list._id?.startsWith("placeholder-") && list.tasks) {
        countIncompleteRecursive(list.tasks);
      }
    });
    return count;
  };

  // --- Aggregate and Sort Tasks (MODIFIED SORTING FOR STABILITY) ---
  const getTopPriorityTasks = (): AggregatedTask[] => {
    if (isLoadingLists || !taskLists || taskLists.length === 0) {
      return [];
    }
    const aggregatedTasks: AggregatedTask[] = [];
    const processedTaskIds = new Set<string>();

    // 1. Aggregate all tasks (including placeholders for structure)
    taskLists.forEach((list) => {
      if (list._id && list.tasks) {
        const listId = list._id;
        const collectTasks = (tasks: Task[]) => {
          tasks.forEach((task) => {
            // Include top-level tasks only for the preview list
            if (!processedTaskIds.has(task.id)) {
              aggregatedTasks.push({ ...task, listId });
              processedTaskIds.add(task.id);
            }
          });
        };
        collectTasks(list.tasks);
      }
    });

    // 2. Sort the aggregated tasks: ONLY by priority, then stable ID
    //    DO NOT sort by `completed` status here to maintain position.
    aggregatedTasks.sort((a, b) => {
      // Sort criteria:
      // - Priority descending (b.priority - a.priority)
      // - Then by ID for stable sort
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      // Use ID for a truly stable sort if names/priorities are equal
      return a.id.localeCompare(b.id);
    });

    // 3. Return top N tasks from the priority-sorted list
    //    This list might contain completed tasks if they have high priority.
    return aggregatedTasks.slice(0, MAX_PREVIEW_TASKS);
  };

  // --- Render Task Function (Unchanged) ---
  const renderTask = (task: AggregatedTask): React.ReactNode => {
    const isPriorityDropdownOpen = openPriorityDropdown === task.id;
    const isPlaceholder = task.listId.startsWith("placeholder-");
    // isListMutating check remains the same
    const isListMutating =
      updateListMutation.isPending &&
      updateListMutation.variables?.id === task.listId;

    // Placeholder rendering
    if (isPlaceholder) {
      return (
        <div key={task.id} className="relative group/task">
          <div className="flex items-center p-2 rounded-lg">
            <Checkbox
              checked={task.completed}
              onChange={() => {}}
              label={task.name}
              variant="default"
              disabled={true}
            />
            <div className="ml-auto pl-2 opacity-0 flex-shrink-0">
              <div className="p-1">
                <PriorityIconDisplay level={task.priority} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular Task Rendering
    return (
      <div key={task.id} className="relative group/task" title={task.name}>
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 transition-all duration-200">
          <Checkbox
            // The checked state comes directly from the task data (updated optimistically)
            checked={task.completed}
            onChange={() => handleToggleTaskCompletion(task.listId, task.id)}
            label={task.name}
            variant="default"
            disabled={isListMutating}
          />
          {/* Priority Button and Dropdown remain the same */}
          <div className="relative ml-auto pl-2 flex-shrink-0">
            <div className="relative">
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
                disabled={isListMutating}
              >
                <PriorityIconDisplay level={task.priority} />
              </button>
              {isPriorityDropdownOpen && (
                <PriorityDropdown
                  taskId={task.id}
                  listId={task.listId}
                  currentPriority={task.priority}
                  onSetPriority={handleSetPriority}
                  onClose={() => setOpenPriorityDropdown(null)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Main Return Block (Structure Unchanged) ---
  if (
    status === "loading" ||
    (status === "authenticated" && isLoadingLists && !taskLists?.length)
  ) {
    return <TasksSkeleton />;
  }

  const topPriorityTasks = getTopPriorityTasks(); // Gets top N by priority only
  const totalIncomplete = calculateTotalIncomplete(taskLists); // Still counts actual incomplete

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          TASKS
        </h1>
        <Link href="/dashboard/tasks" passHref legacyBehavior>
          <a className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 transition-all">
            <span>New Task</span> <IconCheck size={14} />
          </a>
        </Link>
      </div>

      {/* Incomplete Count */}
      {status === "authenticated" &&
        !isLoadingLists &&
        !isErrorLists &&
        !taskLists?.some((l) => l._id?.startsWith("placeholder-")) && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
            You have <span className="font-semibold">{totalIncomplete}</span>{" "}
            task{totalIncomplete !== 1 ? "s" : ""} remaining.
          </p>
        )}
      {status === "unauthenticated" && !isErrorLists && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center">
          Sign in to see your tasks.
        </p>
      )}

      {/* Task List */}
      <div className="space-y-1 flex-grow">
        {/* Render logic remains structurally similar */}
        {status === "authenticated" &&
          !isLoadingLists &&
          !isErrorLists &&
          topPriorityTasks.length > 0 &&
          topPriorityTasks.map((task) => renderTask(task))}
        {status === "authenticated" &&
          !isLoadingLists &&
          !isErrorLists &&
          taskLists.length > 0 &&
          topPriorityTasks.length === 0 &&
          !taskLists?.some((l) => l._id?.startsWith("placeholder-")) && (
            // This message now means "No high-priority tasks found" or "No tasks found at all"
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No tasks to display.
            </div>
          )}
        {status === "authenticated" &&
          !isLoadingLists &&
          !isErrorLists &&
          taskLists.length === 0 && (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No task lists found. Add one in the main Tasks view.
            </div>
          )}
        {/* Unauthenticated view */}
        {status === "unauthenticated" &&
          topPriorityTasks.length > 0 &&
          topPriorityTasks.map((task) => renderTask(task))}
        {status === "unauthenticated" && topPriorityTasks.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            Sign in to add and view your tasks.
          </div>
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