"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { IconFlag, IconFlagFilled, IconCheck } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Checkbox from "../../recyclable/Checkbox";
import Link from "next/link";
import * as tasksApi from "../../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";
import { toast } from "sonner";
import { useGlobalStore } from "@/hooks/useGlobalStore";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { Skeleton } from "@/components/ui/Skeleton";

const TasksSkeleton: React.FC<{ isSpecialTheme: boolean }> = ({ isSpecialTheme }) => {
  const numberOfPlaceholderTasks = 3;
  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl border flex flex-col ${isSpecialTheme
        ? "dark bg-zinc-900/50 border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-7 w-28 rounded-md" />
      </div>
      <Skeleton className="h-4 w-3/5 rounded mb-3 mx-auto" />
      <div className="space-y-2 flex-grow">
        {[...Array(numberOfPlaceholderTasks)].map((_, index) => (
          <div
            key={index}
            className="flex items-center p-2 rounded-lg bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent"
          >
            <Skeleton className="w-5 h-5 rounded mr-3 flex-shrink-0" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="w-5 h-5 rounded ml-auto flex-shrink-0" />
          </div>
        ))}
      </div>
      <div className="mt-3 text-center flex-shrink-0">
        <Skeleton className="h-3 w-20 rounded mx-auto" />
      </div>
    </div>
  );
};

const priorityLevels = [
  { level: 0, label: "None", icon: IconFlag, color: "text-gray-400 dark:text-gray-500 opacity-50" },
  { level: 1, label: "Low (!)", icon: IconFlagFilled, color: "text-yellow-500" },
  { level: 2, label: "Medium (!!)", icon: IconFlagFilled, color: "text-orange-500" },
  { level: 3, label: "High (!!!)", icon: IconFlagFilled, color: "text-red-500" },
];

const PriorityIconDisplay: React.FC<{ level: number }> = ({ level }) => {
  const config = priorityLevels.find((p) => p.level === level);
  const DisplayIcon = config?.icon || IconFlag;
  const displayColor = level !== 0 && config?.color ? config.color : "text-gray-400 dark:text-gray-600 opacity-50";
  return <DisplayIcon size={16} className={`${displayColor} transition-colors flex-shrink-0`} />;
};

const placeholderTaskLists: TaskList[] = [
  {
    _id: "placeholder-preview",
    name: "Tasks Preview",
    tasks: [
      { id: "p1", name: "Sign in to view your tasks", completed: false, priority: 0, subtasks: [] },
      { id: "p2", name: "High priority task example", completed: false, priority: 3, subtasks: [] },
      { id: "p3", name: "Another task example", completed: false, priority: 1, subtasks: [] },
      { id: "p4", name: "A completed task example", completed: true, priority: 2, subtasks: [] },
    ],
  },
];

interface PriorityDropdownProps {
  taskId: string;
  listId: string;
  currentPriority: number;
  onSetPriority: (listId: string, taskId: string, priority: number) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  taskId,
  listId,
  currentPriority,
  onSetPriority,
  onClose,
  position,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If click is inside the dropdown, ignore
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      // If it's outside, close
      onClose();
    };

    // Use setTimeout to skip the initial click that opened the dropdown
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={dropdownRef}
      style={{ top: position.top, left: position.left }}
      className="fixed w-40 bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl border border-slate-200/60 dark:border-zinc-700/60 rounded-lg z-[99999] py-1.5 animate-in fade-in slide-in-from-left-1 duration-150 shadow-xl"
    >
      {priorityLevels.map(({ level, label, icon: Icon, color }) => (
        <button
          key={level}
          onClick={(e) => {
            e.stopPropagation(); // Stop propagation so we don't trigger outside click immediately
            onSetPriority(listId, taskId, level);
            onClose();
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors ${currentPriority === level ? "bg-slate-50/80 dark:bg-zinc-700/80 font-semibold" : ""
            }`}
        >
          <Icon size={16} className={level === 0 ? "opacity-50 text-slate-400" : color} />
          <span>{label}</span>
        </button>
      ))}
    </div>,
    document.body
  );
};

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
  const [priorityDropdownState, setPriorityDropdownState] = useState<{
    taskId: string;
    listId: string;
    priority: number;
    position: { top: number; left: number };
  } | null>(null);
  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);
  const MAX_PREVIEW_TASKS = 5;

  const { theme } = useTheme();
  const isSpecialTheme =
    theme && specialSceneThemeNames.includes(theme as (typeof specialSceneThemeNames)[number]);

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
    placeholderData: status !== "authenticated" ? placeholderTaskLists : undefined,
  });

  useEffect(() => {
    if (isErrorLists && errorLists) {
      toast.error(`Error loading tasks preview: ${errorLists?.message || "Unknown error"}`);
    }
  }, [isErrorLists, errorLists]);

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

  const findTaskById = (tasks: Task[], taskId: string): Task | null => {
    for (const task of tasks) {
      if (task.id === taskId) return task;
      if (task.subtasks && task.subtasks.length > 0) {
        const found = findTaskById(task.subtasks, taskId);
        if (found) return found;
      }
    }
    return null;
  };

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
            old?.map((list) => (list._id === variables.id ? { ...list, tasks: optimisticTasks } : list)) ?? []
        );
      }
      return { previousTaskLists };
    },
    onError: (err, _variables, context) => {
      if (context?.previousTaskLists) {
        queryClient.setQueryData(["tasks"], context.previousTaskLists);
      }
      toast.error(`Failed to update task: ${err instanceof Error ? err.message : "Unknown error"}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list || !list.tasks || list._id?.startsWith("placeholder-")) return;

    const taskToToggle = findTaskById([...list.tasks], taskId);
    const isCompleting = taskToToggle ? !taskToToggle.completed : false;

    const { updatedTasks, taskFound } = findAndUpdateTask([...list.tasks], taskId, (task) => ({
      ...task,
      completed: !task.completed,
    }));

    if (taskFound) {
      updateListMutation.mutate({ id: listId, tasks: updatedTasks });
      if (isCompleting) {
        triggerLumoEvent("TASK_COMPLETED");
      }
    }
  };

  const handleSetPriority = (listId: string, taskId: string, newPriority: number) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list || !list.tasks || list._id?.startsWith("placeholder-")) return;
    const { updatedTasks, taskFound } = findAndUpdateTask([...list.tasks], taskId, (task) => ({
      ...task,
      priority: newPriority,
    }));
    if (taskFound) {
      updateListMutation.mutate({ id: listId, tasks: updatedTasks });
    }
    setPriorityDropdownState(null);
  };

  const handleOpenDropdown = (e: React.MouseEvent, task: AggregatedTask) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const DROP_WIDTH = 160; // w-40
    setPriorityDropdownState({
      taskId: task.id,
      listId: task.listId,
      priority: task.priority,
      position: {
        top: rect.bottom + 5, // 5px gap
        left: rect.right - DROP_WIDTH, // Align right edge
      }
    });
  };

  const calculateTotalIncomplete = (allLists: TaskList[] | undefined): number => {
    if (!allLists || allLists.length === 0 || allLists.some((l) => l._id?.startsWith("placeholder-"))) return 0;
    let count = 0;
    const countIncompleteRecursive = (tasks: Task[]) => {
      tasks.forEach((task) => {
        if (!task.completed) count++;
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

  const getTopPriorityTasks = (): AggregatedTask[] => {
    if (isLoadingLists || !taskLists || taskLists.length === 0) return [];
    const aggregatedTasks: AggregatedTask[] = [];
    const processedTaskIds = new Set<string>();
    taskLists.forEach((list) => {
      if (list._id && list.tasks) {
        const listId = list._id;
        const collectTasks = (tasks: Task[]) => {
          tasks.forEach((task) => {
            if (!processedTaskIds.has(task.id) && !task.completed) {
              aggregatedTasks.push({ ...task, listId });
              processedTaskIds.add(task.id);
            }
          });
        };
        collectTasks(list.tasks);
      }
    });
    aggregatedTasks.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.id.localeCompare(b.id);
    });
    return aggregatedTasks.slice(0, MAX_PREVIEW_TASKS);
  };

  const renderTask = (task: AggregatedTask): React.ReactNode => {
    const isPlaceholder = task.listId.startsWith("placeholder-");
    const isListMutating = updateListMutation.isPending && updateListMutation.variables?.id === task.listId;

    if (isPlaceholder) {
      return (
        <div key={task.id} className="relative group/task">
          <div className="flex items-center p-2 rounded-lg">
            <Checkbox checked={task.completed} onChange={() => { }} label={task.name} variant="default" disabled className="flex-1 min-w-0" />
            <div className="ml-auto pl-2 opacity-0 flex-shrink-0">
              <div className="p-1">
                <PriorityIconDisplay level={task.priority} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} className="relative group/task" title={task.name}>
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-secondary-black backdrop-blur-md border border-slate-100/50 dark:border-white/5 hover:border-slate-200/70 dark:hover:border-white/10 transition-all duration-200">
          <Checkbox
            checked={task.completed}
            onChange={() => handleToggleTaskCompletion(task.listId, task.id)}
            label={task.name}
            variant="default"
            disabled={isListMutating}
            className="flex-1 min-w-0"
          />
          <div className="relative ml-auto pl-2 flex-shrink-0">
            <div className="relative">
              <button
                onClick={(e) => handleOpenDropdown(e, task)}
                title={`Priority: ${priorityLevels.find((p) => p.level === task.priority)?.label || "None"}`}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
                aria-haspopup="true"
                disabled={isListMutating}
              >
                <PriorityIconDisplay level={task.priority} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (status === "loading" || (status === "authenticated" && isLoadingLists && !taskLists?.length)) {
    return <TasksSkeleton isSpecialTheme={!!isSpecialTheme} />;
  }

  const topPriorityTasks = getTopPriorityTasks();
  const totalIncomplete = calculateTotalIncomplete(taskLists);

  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl border flex flex-col ${isSpecialTheme
        ? "dark bg-zinc-900/50 border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">TASKS</h1>
        <Link
          href="/dashboard/tasks"
          className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 transition-all"
          aria-label="Create a new task"
        >
          <span>New Task</span>
          <IconCheck size={14} />
        </Link>
      </div>

      {status === "authenticated" &&
        !isLoadingLists &&
        !isErrorLists &&
        !taskLists?.some((l) => l._id?.startsWith("placeholder-")) && (
          <p className="text-xs text-slate-500 dark:text-zinc-600 mb-3 text-center">
            You have <span className="font-semibold">{totalIncomplete}</span> task{totalIncomplete !== 1 ? "s" : ""} remaining.
          </p>
        )}
      {status === "unauthenticated" && !isErrorLists && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-center">Sign in to see your tasks.</p>
      )}

      <div className="space-y-1 flex-grow">
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
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">No tasks to display.</div>
          )}
        {status === "authenticated" && !isLoadingLists && !isErrorLists && taskLists.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No task lists found. Add one in the main Tasks view.
          </div>
        )}
        {status === "unauthenticated" &&
          topPriorityTasks.length > 0 &&
          topPriorityTasks.map((task) => renderTask(task))}
        {status === "unauthenticated" && topPriorityTasks.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            Sign in to add and view your tasks.
          </div>
        )}
      </div>

      <div className="mt-3 text-center flex-shrink-0">
        <Link
          href="/dashboard/tasks"
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          View all tasks
        </Link>
      </div>

      {priorityDropdownState && (
        <PriorityDropdown
          taskId={priorityDropdownState.taskId}
          listId={priorityDropdownState.listId}
          currentPriority={priorityDropdownState.priority}
          onSetPriority={handleSetPriority}
          onClose={() => setPriorityDropdownState(null)}
          position={priorityDropdownState.position}
        />
      )}
    </div>
  );
};

export default Tasks;