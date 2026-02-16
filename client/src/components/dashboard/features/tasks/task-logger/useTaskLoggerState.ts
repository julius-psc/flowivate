"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import * as tasksApi from "../../../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";
import useSubscriptionStatus from "../../../../../hooks/useSubscriptionStatus";
import {
  createNewTask,
  findAndUpdateTask,
  findAndDeleteTask,
  getCompletionRatio,
} from "./helpers";
import { placeholderTaskLists } from "./placeholderTaskLists";
import { useGlobalStore } from "@/hooks/useGlobalStore";

export const useTaskLoggerState = () => {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const { status: subscriptionStatus } = useSubscriptionStatus();
  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);
  const queryKey: QueryKey = ["tasks"];

  // States
  const [mounted, setMounted] = useState(false);
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
  }>({
    listId: null,
    isLoading: false,
  });
  const [aiPrimedListId, setAiPrimedListId] = useState<string | null>(null);

  // Refs
  const taskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editInputRef = useRef<Record<string, HTMLInputElement | null>>({});
  const subtaskInputRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Query
  const {
    data: taskLists = [],
    isLoading: isLoadingLists,
    isError: isErrorLists,
    error: errorLists,
  } = useQuery<TaskList[], Error>({
    queryKey,
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

  // Mutations
  const addListMutation = useMutation({
    mutationFn: tasksApi.addTaskList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsAddingList(false);
      setNewListName("");
      toast.success("List added successfully!");
    },
    onError: (error) => {
      console.error("Error adding list:", error);
      toast.error(
        `Failed to add list: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
  });

  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onMutate: async (updateData) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousTaskLists = queryClient.getQueryData<TaskList[]>(queryKey);

      // Optimistically update the cache
      if (previousTaskLists) {
        queryClient.setQueryData(
          queryKey,
          previousTaskLists.map((list) =>
            list._id === updateData.id
              ? {
                ...list,
                ...(updateData.tasks !== undefined && { tasks: updateData.tasks }),
                ...(updateData.name !== undefined && { name: updateData.name }),
              }
              : list
          )
        );
      }

      return { previousTaskLists };
    },
    onError: (error, _updateData, context) => {
      console.error("Error updating list:", error);
      // Revert to the previous state on error
      if (context?.previousTaskLists) {
        queryClient.setQueryData(queryKey, context.previousTaskLists);
      }
      toast.error(
        `Failed to update list: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    },
    onSettled: () => {
      // Always refetch after error or success to ensure server state is in sync
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: tasksApi.deleteTaskList,
    onMutate: async (listIdToDelete) => {
      await queryClient.cancelQueries({ queryKey });
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
        `Failed to delete list: ${err instanceof Error ? err.message : "Unknown error"
        }`
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Helper function
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

  const areAllTasksComplete = (tasks: Task[]): boolean => {
    if (!tasks || tasks.length === 0) {
      return true;
    }
    for (const task of tasks) {
      if (!task.completed) {
        return false;
      }
      if (task.subtasks && task.subtasks.length > 0) {
        if (!areAllTasksComplete(task.subtasks)) {
          return false;
        }
      }
    }
    return true;
  };

  // Handlers
  const handleAddTask = (listId: string, parentTaskId?: string) => {
    let taskName = "";
    let inputStateKey = "";

    if (parentTaskId) {
      inputStateKey = `subtask-${parentTaskId}`;
      taskName = activeTaskInputValues[inputStateKey]?.trim() ?? "";
    } else {
      inputStateKey = listId;
      taskName = activeTaskInputValues[inputStateKey]?.trim();
    }

    if (!taskName) return;

    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const isAddingTopLevelTask = !parentTaskId;
    const isFreeUser = subscriptionStatus === "free";

    // Unlimited tasks for all users
    // if (isAddingTopLevelTask && isFreeUser && list.tasks.length >= 4) {
    //   toast.error(
    //     "Free users can only have 4 tasks per list. Upgrade for more!"
    //   );
    //   return;
    // }

    const newTask = createNewTask(taskName);

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
      setAddingSubtaskTo(null);
    } else {
      finalTasks = [...list.tasks, newTask];
    }

    triggerListUpdate(listId, finalTasks);

    // Reset input state
    setActiveTaskInputValues((prev) => {
      const newState = { ...prev };
      delete newState[inputStateKey];
      return newState;
    });

    if (!parentTaskId) {
      setListAddingTaskId(null);
      setAiPrimedListId(null);
    }
  };

  const handleAiBreakdown = async (listId: string) => {
    const taskName = activeTaskInputValues[listId]?.trim();
    if (!taskName) return;

    const list = taskLists.find((l) => l._id === listId);
    if (!list || list._id?.startsWith("placeholder-")) return;

    setAiBreakdownState({ listId, isLoading: true });

    try {
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
      } catch (parseError: unknown) {
        console.error("Failed to parse AI subtask JSON response:", parseError);
        subtasks = [];
        toast.warning("AI format issue. Added main task only.");
      }

      const mainTask = createNewTask(taskName);
      mainTask.subtasks = subtasks;

      const finalTasks = [...list.tasks, mainTask];
      triggerListUpdate(listId, finalTasks);
      setExpandedTasks((prev) => ({ ...prev, [mainTask.id]: true }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown AI breakdown error.";
      toast.error(`AI Breakdown Failed: ${errorMessage}`);
    } finally {
      setAiBreakdownState({ listId: null, isLoading: false });
      setAiPrimedListId(null);
      setActiveTaskInputValues((prev) => {
        const newState = { ...prev };
        delete newState[listId];
        return newState;
      });
      setListAddingTaskId(null);
    }
  };

  const handleKeyDownTaskInput = (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string,
    parentTaskId?: string
  ) => {
    const taskValue = parentTaskId
      ? activeTaskInputValues[`subtask-${parentTaskId}`]?.trim()
      : activeTaskInputValues[listId]?.trim();

    const isAiPrimed = aiPrimedListId === listId;
    const isAiCurrentlyLoading =
      aiBreakdownState.isLoading && aiBreakdownState.listId === listId;

    if (e.key === "Enter" && !isAiCurrentlyLoading) {
      e.preventDefault();
      if (taskValue) {
        if (parentTaskId) {
          handleAddTask(listId, parentTaskId);
        } else if (isAiPrimed) {
          handleAiBreakdown(listId);
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
        setActiveTaskInputValues((prev) => {
          const newState = { ...prev };
          delete newState[`subtask-${parentTaskId}`];
          return newState;
        });
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

  const handleAddList = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isFreeUser = subscriptionStatus === "free";
    const canAddList = !isFreeUser || taskLists.length < 3;

    if (
      e.key === "Enter" &&
      newListName.trim() &&
      session?.user?.id &&
      canAddList
    ) {
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

  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    // Find the task's current state
    const taskToToggle = findTaskById([...list.tasks], taskId);
    const isCompleting = taskToToggle ? !taskToToggle.completed : false;

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

      if (isCompleting) {
        triggerLumoEvent("TASK_COMPLETED");

        if (areAllTasksComplete(updatedTasks)) {
          triggerLumoEvent("TASK_LIST_COMPLETED");
        }
      }
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

  const handleSetPriority = (
    listId: string,
    taskId: string,
    priority: number
  ) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      taskId,
      (task) => ({
        ...task,
        priority,
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
    setTimeout(() => {
      const input = editInputRef.current?.[task.id];
      if (input) {
        input.focus();
      }
    }, 0);
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
      (task) => ({
        ...task,
        name: trimmedValue,
      })
    );

    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
      handleCancelEditing();
    } else {
      handleCancelEditing(); // fallback
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

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const togglePriorityDropdown = (taskId: string) => {
    setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId));
  };

  const handleSubtaskReorder = (
    listId: string,
    parentTaskId: string,
    reorderedSubtasks: Task[]
  ) => {
    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      parentTaskId,
      (task) => ({
        ...task,
        subtasks: reorderedSubtasks,
      })
    );

    if (taskFound) {
      triggerListUpdate(listId, updatedTasks);
    }
  };

  return {
    mounted,
    isAddingList,
    setIsAddingList,
    newListName,
    setNewListName,
    editingTaskId,
    setEditingTaskId,
    editingTaskValue,
    setEditingTaskValue,
    addingSubtaskTo,
    setAddingSubtaskTo,
    expandedTasks,
    setExpandedTasks,
    openPriorityDropdown,
    setOpenPriorityDropdown,
    listAddingTaskId,
    setListAddingTaskId,
    activeTaskInputValues,
    setActiveTaskInputValues,
    aiBreakdownState,
    setAiBreakdownState,
    aiPrimedListId,
    setAiPrimedListId,
    taskInputRefs,
    editInputRef,
    subtaskInputRef,
    taskLists,
    isLoadingLists,
    isErrorLists,
    errorLists,
    subscriptionStatus,
    status,
    addListMutation,
    updateListMutation,
    deleteListMutation,
    getCompletionRatio,
    handleAddList,
    handleDeleteList,
    triggerListUpdate,
    handleAiBreakdown,
    handleKeyDownTaskInput,
    handleToggleTaskCompletion,
    handleDeleteTask,
    handleSetPriority,
    handleStartEditing,
    handleCancelEditing,
    handleSaveEditing,
    handleEditInputKeyDown,
    toggleTaskExpansion,
    togglePriorityDropdown,
    handleSubtaskReorder,
  };
};