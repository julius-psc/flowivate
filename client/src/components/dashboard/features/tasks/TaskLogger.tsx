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
  IconSparkles, // Import AI icon
  IconLoader2, // Import Loader icon
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
  priority: 0, // Default priority for new tasks
  subtasks: [],
});

// --- Priority Constants ---
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

// --- Priority Icon Component ---
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

// --- Placeholder Data ---
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
      className="absolute right-0 top-full mt-2 w-40 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 rounded-lg shadow-lg z-[1000] py-1.5 transition-all duration-200 ease-out animate-fade-in"
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
          />{" "}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

// --- Main TaskLogger Component ---
const TaskLogger: React.FC = () => {
  // --- React Query Client & Session ---
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const queryKey: QueryKey = ["tasks"];

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
  const [listAddingTaskId, setListAddingTaskId] = useState<string | null>(null); // Tracks which list is showing the main "add task" input

  // --- NEW STATE: For managing the value of the currently active task input ---
  const [activeTaskInputValues, setActiveTaskInputValues] = useState<
    Record<string, string>
  >({});

  // AI State
  const [aiBreakdownState, setAiBreakdownState] = useState<{
    listId: string | null;
    isLoading: boolean;
    error: string | null;
  }>({ listId: null, isLoading: false, error: null });

  // --- Refs ---
  const editInputRef = useRef<HTMLInputElement>(null);
  const listNameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  // taskInputRefs is no longer needed for reading value, keep if needed for focus/other direct manipulation
  // const taskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false, // Kept false as per original code
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
      // Consider adding user feedback here
    },
  });

  // --- UPDATE: Modified updateListMutation ---
  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onMutate: async (variables: {
      id: string;
      tasks?: Task[];
      name?: string;
      newTaskData?: { id: string; hasSubtasks: boolean }; // For optimistic expansion
    }) => {
      if (!variables.tasks && !variables.name) {
        console.warn("Optimistic update skipped: no tasks or name provided.");
        const previousTaskLists =
          queryClient.getQueryData<TaskList[]>(queryKey);
        return { previousTaskLists };
      }

      await queryClient.cancelQueries({ queryKey: queryKey });
      const previousTaskLists = queryClient.getQueryData<TaskList[]>(queryKey);

      if (previousTaskLists) {
        // Optimistically update the cache
        queryClient.setQueryData<TaskList[]>(
          queryKey,
          (old) =>
            old?.map((list) => {
              if (list._id === variables.id) {
                return {
                  ...list,
                  ...(variables.tasks && { tasks: variables.tasks }), // Update tasks if provided
                  ...(variables.name && { name: variables.name }), // Update name if provided
                };
              }
              return list;
            }) ?? []
        );

        // Update expandedTasks state for new task with subtasks during optimistic update
        if (variables.newTaskData?.id && variables.newTaskData.hasSubtasks) {
          console.log(
            "Optimistically expanding task:",
            variables.newTaskData.id
          );
          setExpandedTasks((prev) => ({
            ...prev,
            [variables.newTaskData!.id]: true,
          }));
        }
      }

      return { previousTaskLists };
    },
    onError: (err, variables, context) => {
      console.error(`Error updating list ${variables.id}:`, err);
      if (context?.previousTaskLists) {
        queryClient.setQueryData(queryKey, context.previousTaskLists); // Rollback optimistic update
      }
      // Handle error feedback for AI breakdown failure during save
      if (aiBreakdownState.listId === variables.id && variables.newTaskData) {
        setAiBreakdownState((prev) => ({
          ...prev,
          isLoading: false,
          error: `Failed to save AI-generated tasks: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
        }));
        // Keep the input value so user doesn't lose it on save error
      }
      // Handle generic update errors (e.g., editing task, toggling complete)
      // Consider adding more user-facing error messages here
    },
    onSettled: (data, error, variables) => {
      // Invalidate query to ensure consistency with backend, regardless of success/error
      queryClient.invalidateQueries({ queryKey: queryKey });

      // --- UI Cleanup ---
      // Clear editing state ONLY on success OR if the error wasn't related to AI save
      if (!error || (error && aiBreakdownState.listId !== variables.id)) {
        if (editingTaskId) {
          setEditingTaskId(null);
          setEditingTaskValue("");
        }
      }

      // Clear INPUT states only on SUCCESS or if the error wasn't an AI save error
      // Don't clear input if AI save failed, let user retry/edit
      if (!error || (error && aiBreakdownState.listId !== variables.id)) {
        // Clear manual task input state (if applicable)
        if (listAddingTaskId === variables.id) {
          setActiveTaskInputValues((prev) => {
            const newState = { ...prev };
            delete newState[variables.id];
            return newState;
          });
          setListAddingTaskId(null); // Hide the input field
        }

        // Clear AI task input state and status (if applicable)
        if (aiBreakdownState.listId === variables.id) {
          setActiveTaskInputValues((prev) => {
            const newState = { ...prev };
            delete newState[variables.id];
            return newState;
          });
          setAiBreakdownState({ listId: null, isLoading: false, error: null });
        }

        // Clear subtask input (if applicable)
        if (addingSubtaskTo) {
          // Check if the parent task still exists before clearing
          const parentTaskExists = taskLists
            .find((l) => l._id === variables.id)
            ?.tasks.some(
              (t) =>
                t.id === addingSubtaskTo ||
                t.subtasks?.some((st) => st.id === addingSubtaskTo)
            ); // Basic check
          if (parentTaskExists) {
            // Assuming subtask input also uses activeTaskInputValues with a unique key
            // OR if it uses its own state mechanism, clear that here.
            // If using same state, key might be `subtask-${parentTaskId}`
            // Clear subtask input value state here...
          }
          setAddingSubtaskTo(null); // Hide the input
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
      // Add user feedback for delete error
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey });
    },
  });

  // --- Task/List Management Helpers (Recursive Functions - Unchanged) ---
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
      .filter((task) => task.id !== taskId) // Filter top level
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

  // --- Action Handlers ---
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
    // Optional: Add confirmation dialog here
    deleteListMutation.mutate(listId);
  };

  // --- UPDATE: triggerListUpdate signature remains the same ---
  const triggerListUpdate = (
    listId: string,
    updatedTasks: Task[],
    newTaskData?: { id: string; hasSubtasks: boolean }
  ) => {
    const list = taskLists.find((l) => l._id === listId);
    if (list && list._id && !list._id.startsWith("placeholder-")) {
      updateListMutation.mutate({
        id: list._id,
        tasks: updatedTasks,
        newTaskData: newTaskData,
      });
    } else {
      console.warn(
        `List ${listId} not found or is placeholder, cannot update.`
      );
      // Reset AI state if update fails due to list not found
      if (aiBreakdownState.listId === listId) {
        setAiBreakdownState({ listId: null, isLoading: false, error: null });
      }
    }
  };

  // --- REGULAR Add Task ---
  const handleAddTask = (listId: string, parentTaskId?: string) => {
    let taskName = "";
    let inputStateKey = "";

    if (parentTaskId) {
      // Assuming subtask input uses a similar state or a dedicated one
      inputStateKey = `subtask-${parentTaskId}`; // Example key
      // taskName = activeSubtaskInputValues[inputStateKey]?.trim(); // Read from relevant state
      // Handle subtask input state clearing below...
      console.warn(
        "Subtask input state management not fully implemented in example"
      );
      // TEMPORARY - get value directly if subtask state isn't ready
      const subInput = document.getElementById(
        `subtask-input-${parentTaskId}`
      ) as HTMLInputElement;
      taskName = subInput?.value?.trim() ?? "";
    } else {
      // For main task input
      inputStateKey = listId;
      taskName = activeTaskInputValues[inputStateKey]?.trim();
    }

    if (!taskName) return; // Exit if no name entered

    const list = taskLists.find((l) => l._id === listId);
    if (!list) return;

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
      setExpandedTasks((prev) => ({ ...prev, [parentTaskId]: true })); // Expand parent
      // Clear subtask input state here...
      setAddingSubtaskTo(null); // Hide subtask input
    } else {
      finalTasks = [...list.tasks, newTask];
      // State clearing for main input happens in mutation's onSettled
    }

    triggerListUpdate(listId, finalTasks); // Call triggerListUpdate (clears state via onSettled)
  };

  // --- AI Task Breakdown Handler ---
  const handleAiBreakdown = async (listId: string) => {
    console.log("--- handleAiBreakdown ENTERED for listId:", listId); // Keep this log

    // Read value from STATE
    const taskName = activeTaskInputValues[listId]?.trim();

    // Check if taskName is valid directly from state
    if (!taskName) {
      console.log(
        "--- handleAiBreakdown RETURNING EARLY: Input empty based on state."
      );
      return;
    }

    const list = taskLists.find((l) => l._id === listId);
    console.log("List found:", list);

    if (!list || list._id?.startsWith("placeholder-")) {
      console.log(
        "--- handleAiBreakdown RETURNING EARLY: List not found or is placeholder."
      );
      return;
    }

    console.log(
      "--- handleAiBreakdown: Setting AI loading state and fetching..."
    );
    // Show loading state, keep the input field visible but disabled
    setListAddingTaskId(null); // Ensure manual add mode is off
    setAiBreakdownState({ listId, isLoading: true, error: null });

    try {
      console.log(
        "--- handleAiBreakdown: ATTEMPTING FETCH for task:",
        taskName
      );
      const response = await fetch("/api/claude/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskDescription: taskName }),
      });

      console.log(
        "--- handleAiBreakdown: Fetch response received (ok?):",
        response.ok
      );

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

      // --- Robust JSON Parsing ---
      try {
        if (!data.response || typeof data.response !== "string") {
          throw new Error("Invalid response structure received from AI API.");
        }
        let jsonText = data.response.trim();
        // Remove potential markdown code fences
        if (jsonText.startsWith("```json") && jsonText.endsWith("```")) {
          jsonText = jsonText.substring(7, jsonText.length - 3).trim();
        } else if (jsonText.startsWith("```") && jsonText.endsWith("```")) {
          jsonText = jsonText.substring(3, jsonText.length - 3).trim();
        }
        const parsedSubtasks = JSON.parse(jsonText);

        if (!Array.isArray(parsedSubtasks)) {
          throw new Error("AI response is not a valid JSON array.");
        }

        subtasks = parsedSubtasks
          .map((item: { name: string; priority: number }): Task | null => {
            // Use a specific type for item
            if (
              item && // Check if item exists
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
            console.warn("Skipping invalid subtask item from AI:", item);
            return null;
          })
          .filter((task): task is Task => task !== null); // Filter out nulls

        if (subtasks.length === 0 && parsedSubtasks.length > 0) {
          console.warn(
            "AI returned items, but none were valid subtasks after parsing."
          );
          // Set non-blocking error, main task will still be added
          setAiBreakdownState((prev) => ({
            ...prev,
            error: "AI format unclear. Added main task.",
          }));
        } else if (subtasks.length === 0 && parsedSubtasks.length === 0) {
          console.log("AI returned an empty array, adding main task only.");
        }
      } catch (parseError: unknown) {
        console.error("Failed to parse AI subtask JSON response:", parseError);
        console.log("Raw AI text response:", data.response); // Log raw response for debugging
        subtasks = []; // Ensure subtasks is empty if parsing fails
        // Set non-blocking error
        setAiBreakdownState((prev) => ({
          ...prev,
          error: "AI format issue. Added main task.",
        }));
      }
      // --- End Parsing ---

      // Create the main task regardless of subtask success
      const mainTask = createNewTask(taskName);
      mainTask.subtasks = subtasks;

      // Add the main task with its subtasks to the list
      const finalTasks = [...list.tasks, mainTask];

      // Trigger update with expansion info
      const newTaskInfo = { id: mainTask.id, hasSubtasks: subtasks.length > 0 };
      // This will call the mutation, which handles state clearing in onSettled
      triggerListUpdate(listId, finalTasks, newTaskInfo);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown AI breakdown error.";
      console.error(
        "Error during AI breakdown fetch/processing:",
        errorMessage
      );
      // Set blocking error state - mutation won't be called, state won't be cleared by onSettled
      setAiBreakdownState({ listId, isLoading: false, error: errorMessage });
      // Input value remains in `activeTaskInputValues` for user
    }
  };

  // --- KeyDown Handler for Task Input ---
  const handleKeyDownTaskInput = (
    e: React.KeyboardEvent<HTMLInputElement>,
    listId: string,
    parentTaskId?: string
  ) => {
    // Handle Enter key press
    if (
      e.key === "Enter" &&
      !(aiBreakdownState.isLoading && aiBreakdownState.listId === listId)
    ) {
      if (parentTaskId) {
        handleAddTask(listId, parentTaskId);
      } else {
        // Check if it was manual add input or AI input
        const taskValue = activeTaskInputValues[listId]?.trim();
        if (taskValue) {
          // Only add if there's text
          handleAddTask(listId);
        }
      }
    }
    // Handle Escape key press
    else if (e.key === "Escape") {
      if (parentTaskId) {
        // Clear subtask input state...
        setAddingSubtaskTo(null);
      } else {
        // Clear state for the main input field
        setActiveTaskInputValues((prev) => {
          const newState = { ...prev };
          delete newState[listId];
          return newState;
        });
        setListAddingTaskId(null); // Hide manual input field
        setAiBreakdownState({ listId: null, isLoading: false, error: null }); // Reset AI state/hide AI input
      }
      // Optional: Blur the input after Escape
      e.currentTarget?.blur();
    }
  };

  // --- Other Task Handlers (Mostly Unchanged) ---
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
        setOpenPriorityDropdown(null); // Close dropdown if open for deleted task
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
    setOpenPriorityDropdown(null); // Close priority dropdown when editing starts
    setTimeout(() => editInputRef.current?.focus(), 0); // Focus after render
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

    // If trimmed value is empty, delete the task
    if (!trimmedValue) {
      handleDeleteTask(listId, editingTaskId); // This calls triggerListUpdate
      handleCancelEditing(); // Clear editing state
      return;
    }

    // Find and update the task
    const { updatedTasks, taskFound } = findAndUpdateTask(
      [...list.tasks],
      editingTaskId,
      (task) => ({
        ...task,
        name: trimmedValue,
      })
    );

    if (taskFound) {
      // triggerListUpdate handles clearing editing state in onSettled
      triggerListUpdate(listId, updatedTasks);
    } else {
      // Task wasn't found (edge case?), cancel editing
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
  const getCompletionRatio = (tasks: Task[] = []): string => {
    // Default tasks to empty array
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
    // Focus main task input when listAddingTaskId changes
    if (listAddingTaskId) {
      // Use timeout to ensure element is rendered after state change
      setTimeout(() => {
        const inputElement = document.getElementById(
          `task-input-${listAddingTaskId}`
        );
        inputElement?.focus();
      }, 0);
    }
    // Similar logic could be added if AI state should trigger focus,
    // but currently autoFocus is only on manual add.
  }, [listAddingTaskId]);

  useEffect(() => {
    // Focus subtask input when addingSubtaskTo changes
    if (addingSubtaskTo) {
      setTimeout(() => {
        const inputElement = document.getElementById(
          `subtask-input-${addingSubtaskTo}`
        );
        inputElement?.focus();
      }, 0);
    }
  }, [addingSubtaskTo]);

  // --- Render Task Function (Recursive) ---
  const renderTask = (
    task: Task,
    listId: string,
    level = 0
  ): React.ReactNode => {
    const isEditing = editingTaskId === task.id;
    const isExpanded = !!expandedTasks[task.id]; // Read directly from state
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isPriorityDropdownOpen = openPriorityDropdown === task.id;
    const isSubtask = level > 0;
    const indentationClass = level > 0 ? `pl-${level * 4}` : ""; // Use padding for indentation
    const isPlaceholder = listId.startsWith("placeholder-");

    // Determine if the list this task belongs to is currently mutating
    const isListMutating =
      updateListMutation.isPending &&
      updateListMutation.variables?.id === listId;
    // Is AI processing for the list this task belongs to?
    const isAiProcessingList =
      aiBreakdownState.isLoading && aiBreakdownState.listId === listId;

    // Disable interactions if placeholder, list is saving, or AI is processing for the list
    const isDisabled = isPlaceholder || isListMutating || isAiProcessingList;

    // --- Editing View ---
    if (isEditing) {
      return (
        <div
          key={`${task.id}-editing`}
          className={`relative ${indentationClass}`}
        >
          <div className="flex items-center p-2 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm border border-slate-200/60 dark:border-zinc-700/60 shadow-sm transition-all duration-200">
            <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>{" "}
            {/* Chevron Placeholder */}
            <input
              ref={editInputRef} // Ref for focusing
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
              onBlur={() => handleSaveEditing(listId)} // Save on blur
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus
              disabled={isListMutating} // Disable input while saving
            />
            {/* Placeholders to maintain layout consistency */}
            <div className="flex items-center gap-1 ml-auto pl-2 flex-shrink-0 invisible">
              <div className="w-[16px] h-[16px] mx-[5px]"></div>{" "}
              {/* Priority */}
              <div className="w-[14px] h-[14px] mx-[5px]"></div> {/* Edit */}
              <div className="w-[14px] h-[14px] mx-[5px]"></div> {/* Delete */}
            </div>
          </div>
        </div>
      );
    }

    // --- Normal Task View ---
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
                disabled={isDisabled} // Disable chevron if list is busy
              >
                {isExpanded ? (
                  <IconChevronDown size={14} />
                ) : (
                  <IconChevronRight size={14} />
                )}
              </button>
            ) : (
              <div className="w-5" aria-hidden="true"></div> // Placeholder if no subtasks
            )}
          </div>

          {/* Checkbox and Task Name */}
          <div
            className="flex-1 mr-2 cursor-pointer"
            onDoubleClick={() =>
              !isDisabled && handleStartEditing(listId, task)
            }
            title={!isPlaceholder ? "Double-click to edit" : ""}
          >
            <Checkbox
              checked={task.completed}
              onChange={() =>
                !isDisabled && handleToggleTaskCompletion(listId, task.id)
              }
              label={task.name}
              variant={isSubtask ? "subtask" : "default"}
              disabled={isDisabled} // Disable checkbox if list is busy
            />
          </div>

          {/* Priority Button */}
          {!isPlaceholder && (
            <div className="relative z-10 mr-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering other handlers
                  if (!isDisabled) togglePriorityDropdown(task.id);
                }}
                title={`Priority: ${
                  priorityLevels.find((p) => p.level === task.priority)
                    ?.label || "None"
                }`}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-haspopup="true"
                aria-expanded={isPriorityDropdownOpen}
                disabled={isDisabled} // Disable priority button if list is busy
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

          {/* Action Buttons (Edit/Delete) - Appear on hover */}
          {!isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-2 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex-shrink-0">
              <button
                onClick={() => !isDisabled && handleStartEditing(listId, task)}
                title="Edit task"
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDisabled} // Disable edit button if list is busy
              >
                {" "}
                <IconEdit size={14} />{" "}
              </button>
              <button
                onClick={() => !isDisabled && handleDeleteTask(listId, task.id)}
                title="Delete task"
                className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isDisabled} // Disable delete button if list is busy
              >
                {" "}
                <IconTrash size={14} />{" "}
              </button>
            </div>
          )}
          {/* Spacer for placeholder tasks to maintain layout */}
          {isPlaceholder && (
            <div className="flex items-center gap-1 ml-auto pl-2 flex-shrink-0 invisible">
              <div className="w-[16px] h-[16px] mx-[5px]"></div>{" "}
              {/* Priority */}
              <div className="w-[14px] h-[14px] mx-[5px]"></div> {/* Edit */}
              <div className="w-[14px] h-[14px] mx-[5px]"></div> {/* Delete */}
            </div>
          )}
        </div>

        {/* Render Subtasks Recursively */}
        {hasSubtasks && isExpanded && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {task.subtasks
              .sort((a, b) => b.priority - a.priority) // Sort subtasks by priority
              .map((subtask) => renderTask(subtask, listId, level + 1))}
          </div>
        )}

        {/* Add Subtask Input/Button */}
        {!isPlaceholder &&
          level === 0 && ( // Only show for top-level tasks
            <div
              className={`mt-1 ${level > 0 ? `pl-${(level + 1) * 4}` : "pl-7"}`}
            >
              {addingSubtaskTo === task.id ? (
                // --- Subtask Input ---
                <input
                  ref={subtaskInputRef} // Ref for focusing
                  id={`subtask-input-${task.id}`}
                  type="text"
                  onKeyDown={(e) => handleKeyDownTaskInput(e, listId, task.id)}
                  onBlur={(e) => {
                    // Hide input on blur if empty
                    setTimeout(() => {
                      if (
                        !e.target.value.trim() &&
                        addingSubtaskTo === task.id
                      ) {
                        setAddingSubtaskTo(null);
                        // Clear subtask input state here if managed separately
                      }
                    }, 150);
                  }}
                  className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-pink-500 dark:focus:ring-pink-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50"
                  placeholder="New subtask..."
                  disabled={isListMutating} // Disable input while parent list is saving
                  autoFocus
                />
              ) : (
                // --- Add Subtask Button ---
                <button
                  onClick={() => !isDisabled && setAddingSubtaskTo(task.id)}
                  className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-pink-500 dark:hover:text-pink-400 text-sm transition-colors duration-200 py-1 opacity-0 group-hover/task:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Add subtask"
                  disabled={isDisabled} // Disable if list is busy
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
        Loading Tasks... {/* Consider adding a spinner icon */}
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

  // --- Determine lists to display ---
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

  // --- Main Render ---
  return (
    <div className="p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0 max-w-3xl mx-auto w-full px-2">
        <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          My Tasks
        </h1>
        {/* Saving indicator */}
        {updateListMutation.isPending && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse flex items-center gap-1">
            <IconLoader2 size={12} className="animate-spin" /> Saving...
          </span>
        )}
      </div>
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Centering and Max Width Container */}
        <div className="max-w-3xl mx-auto w-full px-2">
          {/* Empty/Sign-in Messages */}
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
                    {getCompletionRatio(list.tasks)}
                  </span>
                  {/* Delete list button */}
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
                      {deleteListMutation.isPending &&
                      deleteListMutation.variables === list._id ? (
                        <IconLoader2 size={16} className="animate-spin" />
                      ) : (
                        <IconTrash size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Render Tasks */}
              {(list.tasks || [])
                .sort((a, b) => b.priority - a.priority) // Sort top-level tasks by priority
                .map((task) => renderTask(task, list._id!, 0))}

              {/* Add Task Input/Button Area */}
              {!list._id?.startsWith("placeholder-") && (
                <>
                  {/* --- Input field & AI button (Conditionally Rendered) --- */}
                  {(listAddingTaskId === list._id ||
                    aiBreakdownState.listId === list._id) && (
                    <div className="mt-2 relative">
                      <input
                        id={`task-input-${list._id}`}
                        type="text"
                        // Control value with state
                        value={activeTaskInputValues[list._id] ?? ""}
                        // Update state on change
                        onChange={(e) => {
                          const { value } = e.target;
                          setActiveTaskInputValues((prev) => ({
                            ...prev,
                            [list._id!]: value,
                          }));
                          // Clear AI error instantly when user starts typing again
                          if (
                            aiBreakdownState.error &&
                            aiBreakdownState.listId === list._id
                          ) {
                            setAiBreakdownState((prev) => ({
                              ...prev,
                              error: null,
                            }));
                          }
                        }}
                        onKeyDown={(e) => handleKeyDownTaskInput(e, list._id!)}
                        onBlur={(e) => {
                          // Handle blur to hide input if empty
                          setTimeout(() => {
                            const targetStillFocused =
                              document.activeElement === e.target;
                            // Hide manual input if blurred, empty, and not AI loading
                            if (
                              !targetStillFocused &&
                              !e.target.value.trim() &&
                              listAddingTaskId === list._id &&
                              !aiBreakdownState.isLoading
                            ) {
                              setListAddingTaskId(null);
                              setActiveTaskInputValues((prev) => {
                                const newState = { ...prev };
                                delete newState[list._id!];
                                return newState;
                              });
                            }
                            // Maybe clear AI error if blurred and empty?
                            if (
                              !targetStillFocused &&
                              !e.target.value.trim() &&
                              aiBreakdownState.listId === list._id &&
                              aiBreakdownState.error
                            ) {
                              setAiBreakdownState((prev) => ({
                                ...prev,
                                error: null,
                              }));
                              // Do NOT hide the input if AI had an error, let user fix/retry
                            }
                          }, 150);
                        }}
                        className={`w-full p-2 pr-10 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200 disabled:opacity-50`}
                        placeholder="New task or large goal for AI..."
                        disabled={
                          // Disable input if list is saving or AI is loading for this list
                          updateListMutation.isPending ||
                          (aiBreakdownState.isLoading &&
                            aiBreakdownState.listId === list._id)
                        }
                        // Autofocus only when the manual "Add task" button specifically enables it
                        autoFocus={listAddingTaskId === list._id}
                      />
                      {/* --- AI Button --- */}
                      <button
                        onClick={() => handleAiBreakdown(list._id!)}
                        title="Break down task with AI"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-500 hover:bg-blue-100/80 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={
                          // Disable button if list saving, AI loading, OR input state is empty
                          updateListMutation.isPending ||
                          (aiBreakdownState.isLoading &&
                            aiBreakdownState.listId === list._id) ||
                          !activeTaskInputValues[list._id]?.trim() // Check state value
                        }
                      >
                        {aiBreakdownState.isLoading &&
                        aiBreakdownState.listId === list._id ? (
                          <IconLoader2 size={16} className="animate-spin" />
                        ) : (
                          <IconSparkles size={16} />
                        )}
                      </button>
                    </div>
                  )}
                  {/* --- AI Error Message --- */}
                  {aiBreakdownState.error &&
                    aiBreakdownState.listId === list._id && (
                      <p className="text-xs text-red-500 mt-1 pl-1">
                        {" "}
                        Error: {aiBreakdownState.error}{" "}
                      </p>
                    )}

                  {/* --- Manual Add Task Button (Shows when input isn't active) --- */}
                  {listAddingTaskId !== list._id &&
                    aiBreakdownState.listId !== list._id && (
                      <button
                        onClick={() => {
                          if (!updateListMutation.isPending) {
                            setListAddingTaskId(list._id!); // Show the input
                            setActiveTaskInputValues((prev) => ({
                              ...prev,
                              [list._id!]: "",
                            })); // Initialize state
                            // Ensure AI state is cleared when switching to manual add
                            setAiBreakdownState({
                              listId: null,
                              isLoading: false,
                              error: null,
                            });
                          }
                        }}
                        className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Add task manually"
                        disabled={updateListMutation.isPending} // Disable if any list is saving
                      >
                        {" "}
                        <IconCopyPlus size={14} /> <span>Add task</span>{" "}
                      </button>
                    )}
                </>
              )}
            </div> // End List Item Wrapper
          ))}{" "}
          {/* End Map Lists */}
          {/* --- Add New List Input (Conditional Render) --- */}
          {status === "authenticated" && isAddingList && (
            <div className="mb-6 mt-4">
              <input
                ref={listNameInputRef} // Ref for focusing
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleAddList}
                onBlur={() => {
                  // Hide input on blur if empty
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
                disabled={addListMutation.isPending} // Disable while adding
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {" "}
                Press Enter to save or Escape to cancel{" "}
              </p>
              {addListMutation.isError && (
                <p className="text-xs text-red-500 mt-1">
                  {" "}
                  Error:{" "}
                  {addListMutation.error instanceof Error
                    ? addListMutation.error.message
                    : "Failed to add list"}{" "}
                </p>
              )}
            </div>
          )}
        </div>{" "}
        {/* End Centering Container */}
      </div>{" "}
      {/* End Scrollable Area */}
      {/* Footer Section: Add List Button (Conditional Render) */}
      {status === "authenticated" && (
        <div className="max-w-3xl mx-auto w-full px-2 mt-4 flex-shrink-0">
          {!isAddingList && (
            <button
              onClick={() => {
                if (!addListMutation.isPending) {
                  setIsAddingList(true);
                  // Focus after state update causes render
                  setTimeout(() => listNameInputRef.current?.focus(), 0);
                }
              }}
              className="flex items-center justify-center p-2 w-full rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={addListMutation.isPending} // Disable while adding
              title="Add a new task list"
            >
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
              )}
            </button>
          )}
        </div>
      )}
    </div> // End Outer Container
  );
};

export default TaskLogger;
