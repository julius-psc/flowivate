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
  IconSparkles,
  IconLoader2,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import Checkbox from "../../recyclable/Checkbox"; // Assuming path is correct
import * as tasksApi from "../../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";
import { toast } from "sonner";

// --- Helper Functions and Data (Unchanged) ---
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
      className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 rounded-lg shadow-lg z-[1000] py-1.5 transition-all duration-200 ease-out animate-fade-in"
    >
      {" "}
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
          {" "}
          <Icon
            size={16}
            className={level === 0 ? "opacity-50 text-slate-400" : color}
          />{" "}
          <span>{label}</span>{" "}
        </button>
      ))}{" "}
    </div>
  );
};

// --- Type Definition (Unchanged) ---
type UpdateTaskListVariables = {
  id: string;
  tasks?: Task[];
  name?: string;
};

// --- Main TaskLogger Component ---
const TaskLogger: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const queryKey: QueryKey = ["tasks"];

  // State Hooks (Unchanged)
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
  const [activeTaskInputValues, setActiveTaskInputValues] = useState<
    Record<string, string>
  >({});
  const [aiBreakdownState, setAiBreakdownState] = useState<{
    listId: string | null;
    isLoading: boolean;
  }>({ listId: null, isLoading: false });
  const [aiPrimedListId, setAiPrimedListId] = useState<string | null>(null);

  // Refs (Unchanged)
  const editInputRef = useRef<HTMLInputElement>(null);
  const listNameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  const taskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Data Fetching and Mutations (Unchanged logic)
  const {
    data: taskLists = [],
    isLoading: isLoadingLists,
    isError: isErrorLists,
    error: errorLists,
  } = useQuery<TaskList[], Error>({
    queryKey: queryKey,
    queryFn: tasksApi.getTaskLists,
    enabled: status === "authenticated",
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    placeholderData:
      status !== "authenticated" ? placeholderTaskLists : undefined,
  });
  useEffect(() => {
    if (isErrorLists && errorLists) {
      toast.error(
        `Error loading tasks: ${errorLists?.message || "Unknown error"}`
      );
    }
  }, [isErrorLists, errorLists]);
  const addListMutation = useMutation({
    mutationFn: tasksApi.addTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      setIsAddingList(false);
      setNewListName("");
      toast.success("List added successfully!");
    },
    onError: (error) => {
      console.error("Error adding list:", error);
      toast.error(
        `Failed to add list: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
  });
  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onMutate: async (variables: UpdateTaskListVariables) => {
      if (!variables.tasks && !variables.name) {
        const previousTaskLists =
          queryClient.getQueryData<TaskList[]>(queryKey);
        return { previousTaskLists };
      }
      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTaskLists = queryClient.getQueryData<TaskList[]>(queryKey);
      if (previousTaskLists) {
        queryClient.setQueryData<TaskList[]>(
          queryKey,
          (old) =>
            old?.map((list) => {
              if (list._id === variables.id) {
                return {
                  ...list,
                  ...(variables.tasks && { tasks: variables.tasks }),
                  ...(variables.name && { name: variables.name }),
                };
              }
              return list;
            }) ?? []
        );
      }
      return { previousTaskLists };
    },
    onError: (err, variables, context) => {
      console.error(`Error updating list ${variables.id}:`, err);
      if (context?.previousTaskLists) {
        queryClient.setQueryData(queryKey, context.previousTaskLists);
      }
      if (aiBreakdownState.listId !== variables.id) {
        toast.error(
          `Failed to update list: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
      if (aiBreakdownState.listId === variables.id) {
        setAiBreakdownState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey });
      if (!error || (error && aiBreakdownState.listId !== variables.id)) {
        if (editingTaskId) {
          setEditingTaskId(null);
          setEditingTaskValue("");
        }
        if (listAddingTaskId === variables.id) {
          setActiveTaskInputValues((prev) => {
            const newState = { ...prev };
            delete newState[variables.id];
            return newState;
          });
          setListAddingTaskId(null);
          setAiPrimedListId(null);
        }
        if (aiBreakdownState.listId === variables.id) {
          setActiveTaskInputValues((prev) => {
            const newState = { ...prev };
            delete newState[variables.id];
            return newState;
          });
          setAiBreakdownState({ listId: null, isLoading: false });
          setAiPrimedListId(null);
        }
        if (addingSubtaskTo) {
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
      toast.error(
        `Failed to delete list: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  // Task Manipulation Helpers (Unchanged logic)
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
    let taskFoundInSubtasks = false;
    const initialLength = tasks.length;
    const finalFiltered = tasks
      .filter((task) => task.id !== taskId)
      .map((task) => {
        if (task.subtasks?.length) {
          const result = findAndDeleteTask(task.subtasks, taskId);
          if (result.taskFound) taskFoundInSubtasks = true;
          return { ...task, subtasks: result.updatedTasks };
        }
        return task;
      });
    const taskFound =
      initialLength !== finalFiltered.length || taskFoundInSubtasks;
    return { updatedTasks: finalFiltered, taskFound: taskFound };
  };

  // Event Handlers (Unchanged logic, except where noted)
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
      if (aiBreakdownState.listId === listId) {
        setAiBreakdownState({ listId: null, isLoading: false });
      }
    }
  };
  const handleAddTask = (listId: string, parentTaskId?: string) => {
    let taskName = "";
    let inputStateKey = "";
    if (parentTaskId) {
      inputStateKey = `subtask-${parentTaskId}`;
      const subInput = document.getElementById(
        `subtask-input-${parentTaskId}`
      ) as HTMLInputElement;
      taskName = subInput?.value?.trim() ?? "";
    } else {
      inputStateKey = listId;
      taskName = activeTaskInputValues[inputStateKey]?.trim();
    }
    if (!taskName) return;
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;
    const newTask = createNewTask(taskName);
    let finalTasks: Task[];
    if (parentTaskId) {
      const result = findAndUpdateTask(
        [...list.tasks],
        parentTaskId,
        (task) => ({ ...task, subtasks: [...(task.subtasks || []), newTask] })
      );
      if (!result.taskFound) return;
      finalTasks = result.updatedTasks;
      setExpandedTasks((prev) => ({ ...prev, [parentTaskId]: true }));
      setAddingSubtaskTo(null);
    } else {
      finalTasks = [...list.tasks, newTask];
    }
    triggerListUpdate(listId, finalTasks);
  };
  const handleAiBreakdown = async (listId: string) => {
    const taskName = activeTaskInputValues[listId]?.trim();
    if (!taskName) return;
    const list = taskLists.find((l) => l._id === listId);
    if (!list || list._id?.startsWith("placeholder-")) return;
    setAiBreakdownState({ listId, isLoading: true });
    /* Keep listAddingTaskId set */ try {
      const response = await fetch("/api/claude/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskDescription: taskName }),
      });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to parse error response" }));
        throw new Error(
          errorData.message || `AI API Error: ${response.status}`
        );
      }
      const data = await response.json();
      let subtasks: Task[] = [];
      try {
        if (!data.response || typeof data.response !== "string")
          throw new Error("Invalid response structure received from AI API.");
        let jsonText = data.response.trim();
        if (jsonText.startsWith("```json") && jsonText.endsWith("```"))
          jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        else if (jsonText.startsWith("```") && jsonText.endsWith("```"))
          jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        const parsedSubtasks = JSON.parse(jsonText);
        if (!Array.isArray(parsedSubtasks))
          throw new Error("AI response is not a valid JSON array.");
        subtasks = parsedSubtasks
          .map((item: { name: string; priority: number }): Task | null => {
            if (
              item &&
              typeof item.name === "string" &&
              item.name.trim() &&
              typeof item.priority === "number" &&
              item.priority >= 0 &&
              item.priority <= 3
            ) {
              const newTask = createNewTask(item.name);
              newTask.priority = item.priority;
              return newTask;
            }
            return null;
          })
          .filter((task): task is Task => task !== null);
        if (subtasks.length === 0 && parsedSubtasks.length > 0) {
          toast.warning("AI format unclear. Added main task only.");
        } else if (subtasks.length === 0 && parsedSubtasks.length === 0) {
          console.log("AI returned an empty array, adding main task only.");
        }
      } catch (parseError: unknown) {
        console.error("Failed to parse AI subtask JSON response:", parseError);
        subtasks = [];
        toast.warning("AI format issue. Added main task only.");
      }
      const mainTask = createNewTask(taskName);
      mainTask.subtasks = subtasks;
      const finalTasks = [...list.tasks, mainTask];
      if (subtasks.length > 0) {
        setExpandedTasks((prev) => ({ ...prev, [mainTask.id]: true }));
      }
      triggerListUpdate(listId, finalTasks);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown AI breakdown error.";
      toast.error(`AI Breakdown Failed: ${errorMessage}`);
      setAiBreakdownState({ listId, isLoading: false });
    }
  };
  const handleKeyDownTaskInput = (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string,
    parentTaskId?: string
  ) => {
    const taskValue = activeTaskInputValues[listId]?.trim();
    const isAiPrimed = aiPrimedListId === listId;
    const isAiCurrentlyLoading =
      aiBreakdownState.isLoading && aiBreakdownState.listId === listId;
    if (e.key === "Enter" && !isAiCurrentlyLoading) {
      e.preventDefault();
      if (parentTaskId) {
        /* Handle subtask */
      } else if (taskValue) {
        if (isAiPrimed) {
          handleAiBreakdown(
            listId
          ); /* Don't reset priming here, let onSettled handle it */
        } else {
          handleAddTask(listId);
        }
      }
    } else if (e.key === "Escape") {
      if (isAiPrimed) {
        setAiPrimedListId(null);
      }
      if (parentTaskId) {
        setAddingSubtaskTo(null);
      } else {
        setActiveTaskInputValues((prev) => {
          const newState = { ...prev };
          delete newState[listId];
          return newState;
        });
        setListAddingTaskId(null);
        setAiBreakdownState({ listId: null, isLoading: false });
      }
      e.currentTarget?.blur();
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
      if (openPriorityDropdown === taskId) setOpenPriorityDropdown(null);
    }
  };
  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;
    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      taskId,
      (task) => ({ ...task, completed: !task.completed })
    );
    if (taskFound) triggerListUpdate(listId, updatedTasks);
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
      (task) => ({ ...task, priority: newPriority })
    );
    if (taskFound) triggerListUpdate(listId, updatedTasks);
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
      handleCancelEditing();
      return;
    }
    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      editingTaskId,
      (task) => ({ ...task, name: trimmedValue })
    );
    if (taskFound) triggerListUpdate(listId, updatedTasks);
    else handleCancelEditing();
  };
  const handleEditInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string
  ) => {
    if (e.key === "Enter") handleSaveEditing(listId);
    else if (e.key === "Escape") handleCancelEditing();
  };
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };
  const togglePriorityDropdown = (taskId: string) => {
    setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId));
  };
  const getCompletionRatio = (tasks: Task[] = []): string => {
    let totalTasks = 0;
    let completedTasks = 0;
    const countTasks = (taskList: Task[]) => {
      taskList.forEach((task) => {
        totalTasks++;
        if (task.completed) completedTasks++;
        if (task.subtasks?.length > 0) countTasks(task.subtasks);
      });
    };
    countTasks(tasks);
    return totalTasks > 0 ? `${completedTasks}/${totalTasks}` : `0/0`;
  };

  // Focus UseEffects (Unchanged)
  useEffect(() => {
    if (listAddingTaskId) {
      setTimeout(() => {
        taskInputRefs.current[listAddingTaskId!]?.focus();
      }, 0);
    }
  }, [listAddingTaskId]);
  useEffect(() => {
    if (addingSubtaskTo) {
      setTimeout(() => {
        const inputElement = document.getElementById(
          `subtask-input-${addingSubtaskTo}`
        );
        inputElement?.focus();
      }, 0);
    }
  }, [addingSubtaskTo]);

  // --- Render Task Function (MODIFIED Icon Order) ---
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
    const indentMultiplier = 3;
    const indentationClass = level > 0 ? `pl-${level * indentMultiplier}` : "";
    const isPlaceholder = listId.startsWith("placeholder-");
    const isListMutating =
      updateListMutation.isPending &&
      updateListMutation.variables?.id === listId;
    const isAiProcessingList =
      aiBreakdownState.isLoading && aiBreakdownState.listId === listId;
    const isDisabled = isPlaceholder || isListMutating || isAiProcessingList;

    // Editing View
    if (isEditing) {
      return (
        <div
          key={`${task.id}-editing`}
          className={`relative ${indentationClass}`}
        >
          {" "}
          <div className="flex items-center p-2 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-zinc-700/60 shadow-sm transition-all duration-200">
            {" "}
            <div
              className="w-5 mr-2 flex-shrink-0"
              aria-hidden="true"
            ></div>{" "}
            <input
              ref={editInputRef}
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
              onBlur={() => handleSaveEditing(listId)}
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus
              disabled={isListMutating}
            />{" "}
            <div className="flex items-center gap-1 ml-auto pl-2 flex-shrink-0 invisible">
              {" "}
              <div className="p-1">
                <IconEdit size={14} />
              </div>{" "}
              <div className="p-1">
                <IconTrash size={14} />
              </div>{" "}
              <div className="p-1 relative">
                <IconFlag size={16} />
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      );
    }

    // Default Task View
    return (
      <div key={task.id} className={`relative group/task ${indentationClass}`}>
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 hover:shadow-sm transition-all duration-200">
          {/* Chevron */}
          <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
            {" "}
            {hasSubtasks ? (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label={
                  isExpanded ? "Collapse subtasks" : "Expand subtasks"
                }
                aria-expanded={isExpanded}
                disabled={isDisabled}
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
            )}{" "}
          </div>
          {/* Checkbox */}
          <div
            className="flex-1 mr-2 cursor-pointer"
            onDoubleClick={() =>
              !isDisabled && handleStartEditing(listId, task)
            }
            title={!isPlaceholder ? "Double-click to edit" : ""}
          >
            {" "}
            <Checkbox
              checked={task.completed}
              onChange={() =>
                !isDisabled && handleToggleTaskCompletion(listId, task.id)
              }
              label={task.name}
              variant={isSubtask ? "subtask" : "default"}
              disabled={isDisabled}
            />{" "}
          </div>

          {/* --- MODIFIED Action Icons Area (Order Changed) --- */}
          {!isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-1 flex-shrink-0">
              {/* 1. Edit/Trash Buttons (Hover Visible Group) */}
              <div className="flex items-center gap-1 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() =>
                    !isDisabled && handleStartEditing(listId, task)
                  }
                  title="Edit task"
                  className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled}
                >
                  {" "}
                  <IconEdit size={14} />{" "}
                </button>
                <button
                  onClick={() =>
                    !isDisabled && handleDeleteTask(listId, task.id)
                  }
                  title="Delete task"
                  className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled}
                >
                  {" "}
                  <IconTrash size={14} />{" "}
                </button>
              </div>
              {/* 2. Priority Button (Always Visible) */}
              <div className="relative z-10">
                {" "}
                {/* Ensure dropdown is clickable */}
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
                  {" "}
                  <PriorityIconDisplay level={task.priority} />{" "}
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
            </div>
          )}
          {/* Placeholder spacing */}
          {isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-1 flex-shrink-0 invisible">
              {" "}
              <div className="p-1">
                <IconEdit size={14} />
              </div>{" "}
              <div className="p-1">
                <IconTrash size={14} />
              </div>{" "}
              <div className="p-1 relative">
                <IconFlag size={16} />
              </div>{" "}
            </div>
          )}
          {/* --- END MODIFIED Action Icons Area --- */}
        </div>{" "}
        {/* End InnerFlexDiv */}
        {/* Subtasks and Add Subtask Input (Unchanged) */}
        {hasSubtasks && isExpanded && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {" "}
            {task.subtasks
              .sort((a, b) => b.priority - a.priority)
              .map((subtask) => renderTask(subtask, listId, level + 1))}{" "}
          </div>
        )}
        {!isPlaceholder && level === 0 && (
          <div className={`mt-1 mb-2 pl-${(level + 1) * indentMultiplier}`}>
            {" "}
            {addingSubtaskTo === task.id ? (
              <input
                ref={subtaskInputRef}
                id={`subtask-input-${task.id}`}
                type="text"
                onKeyDown={(e) => handleKeyDownTaskInput(e, listId, task.id)}
                onBlur={(e) => {
                  setTimeout(() => {
                    if (!e.target.value.trim() && addingSubtaskTo === task.id)
                      setAddingSubtaskTo(null);
                  }, 150);
                }}
                className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:focus:ring-pink-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
                placeholder="New subtask..."
                disabled={isListMutating}
                autoFocus
              />
            ) : (
              <button
                onClick={() => !isDisabled && setAddingSubtaskTo(task.id)}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 text-sm transition-colors duration-200 py-1 opacity-0 group-hover/task:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Add subtask"
                disabled={isDisabled}
              >
                {" "}
                <IconCopyPlus size={14} /> <span>Add subtask</span>{" "}
              </button>
            )}{" "}
          </div>
        )}
      </div> // End OuterDiv
    );
  }; // End of renderTask

  // --- Main Return JSX ---
  if (
    status === "loading" ||
    (status === "authenticated" && isLoadingLists && !taskLists.length)
  ) {
    /* ... Loading ... */ return (
      <div className="p-4 text-center text-slate-500 dark:text-slate-400">
        {" "}
        Loading Tasks...{" "}
      </div>
    );
  }
  const listsToDisplay =
    status === "authenticated" ? taskLists : placeholderTaskLists;
  const showNoListsMessage =
    status === "authenticated" &&
    !isLoadingLists &&
    !isErrorLists &&
    taskLists.length === 0 &&
    !isAddingList;
  const showSignInMessage =
    status === "unauthenticated" &&
    (!placeholderTaskLists || placeholderTaskLists.length === 0);

  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 max-w-3xl mx-auto w-full px-2">
        {" "}
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          {" "}
          My Tasks{" "}
        </h1>{" "}
        {updateListMutation.isPending && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse flex items-center gap-1">
            {" "}
            <IconLoader2 size={12} className="animate-spin" /> Saving...{" "}
          </span>
        )}{" "}
      </div>

      {/* Task Lists Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-2">
          {showNoListsMessage && (
            <div className="text-center text-slate-400 dark:text-slate-500 py-10">
              {" "}
              No task lists yet. Add one below!{" "}
            </div>
          )}
          {showSignInMessage && (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              {" "}
              Please sign in to manage your tasks.{" "}
            </div>
          )}

          {/* Map through lists */}
          {listsToDisplay.map((list) => (
            <div key={list._id || list.name} className="mb-6 group/list">
              {/* List Header */}
              <div className="flex items-center justify-between mb-3">
                {" "}
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">
                  {" "}
                  {list.name}{" "}
                </h2>{" "}
                <div className="flex-1 mx-3 border-t border-slate-200 dark:border-zinc-700 border-dashed"></div>{" "}
                <div className="flex items-center gap-2">
                  {" "}
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
                    {" "}
                    {getCompletionRatio(list.tasks)}{" "}
                  </span>{" "}
                  {!list._id?.startsWith("placeholder-") && (
                    <button
                      onClick={() => handleDeleteList(list._id)}
                      title={`Delete list "${list.name}"`}
                      className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover/list:opacity-100 focus-within:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={
                        deleteListMutation.isPending &&
                        deleteListMutation.variables === list._id
                      }
                    >
                      {" "}
                      {deleteListMutation.isPending &&
                      deleteListMutation.variables === list._id ? (
                        <IconLoader2 size={16} className="animate-spin" />
                      ) : (
                        <IconTrash size={16} />
                      )}{" "}
                    </button>
                  )}{" "}
                </div>{" "}
              </div>

              {/* Render Tasks */}
              {(list.tasks || [])
                .sort((a, b) => b.priority - a.priority)
                .map((task) => renderTask(task, list._id!, 0))}

              {/* Add Task Input Area (MODIFIED - Added Spinner) */}
              {!list._id?.startsWith("placeholder-") && (
                <>
                  {listAddingTaskId === list._id && (
                    <div className="mt-2 flex items-center gap-2 relative">
                      {/* AI Button */}
                      <button
                        onClick={() => {
                          setAiPrimedListId(list._id!);
                          taskInputRefs.current[list._id!]?.focus();
                        }}
                        title="Prime AI Task Breakdown"
                        className={`p-2 rounded text-slate-500 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          aiPrimedListId === list._id
                            ? "text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30"
                            : ""
                        }`}
                        // Disable button completely while AI is processing
                        disabled={
                          updateListMutation.isPending ||
                          (aiBreakdownState.isLoading &&
                            aiBreakdownState.listId === list._id)
                        }
                      >
                        {/* Show loader ONLY in button if AI is loading - Keep it simple */}
                        {aiBreakdownState.isLoading &&
                        aiBreakdownState.listId === list._id ? (
                          <IconLoader2 size={16} className="animate-spin" />
                        ) : (
                          <IconSparkles size={16} />
                        )}
                      </button>

                      {/* Task Input */}
                      <input
                        ref={(el) => {
                          taskInputRefs.current[list._id!] = el;
                        }}
                        id={`task-input-${list._id}`}
                        type="text"
                        value={activeTaskInputValues[list._id] ?? ""}
                        onChange={(e) => {
                          const { value } = e.target;
                          setActiveTaskInputValues((prev) => ({
                            ...prev,
                            [list._id!]: value,
                          }));
                        }}
                        onKeyDown={(e) => handleKeyDownTaskInput(e, list._id!)}
                        onBlur={(e) => {
                          setTimeout(() => {
                            const aiButton = e.target.previousElementSibling;
                            const targetStillFocused =
                              document.activeElement === e.target ||
                              document.activeElement === aiButton;
                            if (
                              !targetStillFocused &&
                              !e.target.value.trim() &&
                              listAddingTaskId === list._id &&
                              !aiBreakdownState.isLoading &&
                              aiPrimedListId !== list._id
                            ) {
                              setListAddingTaskId(null);
                              setActiveTaskInputValues((prev) => {
                                const newState = { ...prev };
                                delete newState[list._id!];
                                return newState;
                              });
                            }
                          }, 150);
                        }}
                        className={`flex-1 w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50 ${
                          aiPrimedListId === list._id
                            ? "ring-1 ring-blue-500 dark:ring-blue-400"
                            : ""
                        }`}
                        placeholder={
                          aiPrimedListId === list._id
                            ? "Enter goal for AI breakdown..."
                            : "New task..."
                        }
                        disabled={
                          updateListMutation.isPending ||
                          (aiBreakdownState.isLoading &&
                            aiBreakdownState.listId === list._id)
                        } // Disable input during AI processing
                      />

                      {/* --- ADDED Minimalist Loader Indicator (Optional: if button loader isn't enough) --- */}
                      {/* You can uncomment this if you prefer a spinner next to the input instead of ONLY in the button */}
                      {/* {(aiBreakdownState.isLoading && aiBreakdownState.listId === list._id) && (
                           <div className="pl-2">
                               <IconLoader2 size={16} className="animate-spin text-blue-500 dark:text-blue-400" />
                           </div>
                       )} */}
                      {/* --- */}
                    </div>
                  )}
                  {/* Add Task Button */}
                  {listAddingTaskId !== list._id && (
                    <button
                      onClick={() => {
                        if (!updateListMutation.isPending) {
                          setListAddingTaskId(list._id!);
                          setAiPrimedListId(null);
                          setActiveTaskInputValues((prev) => ({
                            ...prev,
                            [list._id!]: "",
                          }));
                          setAiBreakdownState({
                            listId: null,
                            isLoading: false,
                          });
                        }
                      }}
                      className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Add task manually"
                      disabled={updateListMutation.isPending}
                    >
                      {" "}
                      <IconCopyPlus size={14} /> <span>Add task</span>{" "}
                    </button>
                  )}
                </>
              )}
            </div> // End list group div
          ))}

          {/* Add New List Input Area */}
          {status === "authenticated" && isAddingList && (
            <div className="mb-6 mt-4">
              {" "}
              <input
                ref={listNameInputRef}
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleAddList}
                onBlur={() => {
                  setTimeout(() => {
                    if (!newListName.trim() && isAddingList) {
                      setIsAddingList(false);
                      setNewListName("");
                    }
                  }, 100);
                }}
                className="w-full text-lg font-medium text-slate-700 dark:text-slate-300 bg-transparent border-b-2 border-slate-300/50 dark:border-zinc-600/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 disabled:opacity-50"
                placeholder="New list name..."
                autoFocus
                disabled={addListMutation.isPending}
              />{" "}
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {" "}
                Press Enter to save or Escape to cancel{" "}
              </p>{" "}
            </div>
          )}
        </div>
      </div>

      {/* Add List Button */}
      {status === "authenticated" && (
        <div className="max-w-3xl mx-auto w-full px-2 mt-4 flex-shrink-0">
          {" "}
          {!isAddingList && (
            <button
              onClick={() => {
                if (!addListMutation.isPending) {
                  setIsAddingList(true);
                  setTimeout(() => listNameInputRef.current?.focus(), 0);
                }
              }}
              className="flex items-center justify-center p-2 w-full rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={addListMutation.isPending}
              title="Add a new task list"
            >
              {" "}
              {addListMutation.isPending ? (
                <>
                  {" "}
                  <IconLoader2 size={18} className="mr-2 animate-spin" />{" "}
                  <span>Adding...</span>{" "}
                </>
              ) : (
                <>
                  {" "}
                  <IconSquareRoundedPlus2 size={18} className="mr-2" />{" "}
                  <span className="font-medium">Add new list</span>{" "}
                </>
              )}{" "}
            </button>
          )}{" "}
        </div>
      )}
    </div> // End component div
  );
};

export default TaskLogger;