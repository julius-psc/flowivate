"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import Checkbox from "../recyclable/Checkbox";

// --- Interfaces ---
// Defines the structure for a single task, including subtasks
interface Task {
  id: string;
  name: string;
  completed: boolean;
  priority: number;
  subtasks: Task[];
}

// Defines the structure for a list of tasks
interface TaskList {
  _id?: string; // Optional database ID
  name: string;
  tasks: Task[];
  isAddingTask?: boolean; // UI state flag for showing the add task input
}

// --- Helper Functions ---
// Factory function to create a new task object
const createNewTask = (name: string): Task => ({
  id: crypto.randomUUID(), // Generate a unique ID for the task
  name: name.trim(),
  completed: false,
  priority: 0, // Default priority
  subtasks: [],
});

// Configuration for different priority levels
const priorityLevels = [
  { level: 0, label: "None", icon: IconFlag, color: "text-gray-400 dark:text-gray-500 opacity-50" },
  { level: 1, label: "Low (!)", icon: IconFlagFilled, color: "text-yellow-500" },
  { level: 2, label: "Medium (!!)", icon: IconFlagFilled, color: "text-orange-500" },
  { level: 3, label: "High (!!!)", icon: IconFlagFilled, color: "text-red-500" },
];

// Component to display the correct priority flag icon and color
const PriorityIconDisplay: React.FC<{ level: number }> = ({ level }) => {
  const config = priorityLevels.find((p) => p.level === level);
  const DisplayIcon = config?.icon || IconFlag;
  const displayColor = level !== 0 && config?.color ? config.color : "text-gray-400 dark:text-gray-600 opacity-50";
  return <DisplayIcon size={16} className={`${displayColor} transition-colors flex-shrink-0`} />;
};

// Placeholder data shown when no user lists are found or user is not logged in
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
// Dropdown menu for selecting task priority
interface PriorityDropdownProps {
  taskId: string;
  listIndex: number;
  currentPriority: number;
  onSetPriority: (listIndex: number, taskId: string, priority: number) => void;
  onClose: () => void;
}

const PriorityDropdown: React.FC<PriorityDropdownProps> = ({
  taskId,
  listIndex,
  currentPriority,
  onSetPriority,
  onClose,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Effect to close the dropdown when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
      {/* Map through priority levels to create buttons */}
      {priorityLevels.map(({ level, label, icon: Icon, color }) => (
        <button
          key={level}
          onClick={() => {
            onSetPriority(listIndex, taskId, level); // Set the priority for the task
            onClose(); // Close the dropdown
          }}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 transition-colors ${
            currentPriority === level ? "bg-slate-50/80 dark:bg-zinc-700/80 font-semibold" : "" // Highlight current priority
          }`}
        >
          <Icon size={16} className={level === 0 ? "opacity-50 text-slate-400" : color} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

// --- Main Tasks Component ---
// This component manages and displays all task lists and tasks
const Tasks: React.FC = () => {
  // --- State & Refs ---
  const [taskLists, setTaskLists] = useState<TaskList[]>([]); // Holds all task lists
  const [isAddingList, setIsAddingList] = useState(false); // Flag to show the add new list input
  const [newListName, setNewListName] = useState(""); // Input state for the new list name
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null); // ID of the task currently being edited
  const [editingTaskValue, setEditingTaskValue] = useState(""); // Input state for the editing task name
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null); // ID of the parent task for which a subtask is being added
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({}); // Tracks which tasks have their subtasks expanded
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState<string | null>(null); // ID of the task whose priority dropdown is open
  const [loading, setLoading] = useState(true); // Loading state for fetching data
  const [showPlaceholders, setShowPlaceholders] = useState(false); // Flag to show placeholder content
  const { data: session, status } = useSession(); // NextAuth session status
  const editInputRef = useRef<HTMLInputElement>(null); // Ref for the task edit input
  const listNameInputRef = useRef<HTMLInputElement>(null); // Ref for the new list name input
  const subtaskInputRef = useRef<HTMLInputElement>(null); // Ref for the new subtask input

  // --- API & Data Fetching ---
  // Function to update tasks for a specific list on the server
  const updateTaskListTasks = useCallback(async (listId: string | undefined, updatedTasks: Task[]) => {
    if (!listId || listId.startsWith("placeholder-")) return; // Don't update placeholders
    try {
      const res = await fetch("/api/features/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId, tasks: updatedTasks }),
        credentials: "include", // Important for sending session cookie
      });
      if (!res.ok) throw new Error(`Failed to update tasks on server: ${res.statusText}`);
    } catch (error) {
      console.error("Error updating tasks:", error);
      // TODO: Add user feedback for failed updates (e.g., toast notification)
    }
  }, []);

  // Function to fetch all task lists for the logged-in user
  const fetchTaskLists = useCallback(async () => {
    // Handle loading and unauthenticated states
    if (status === "loading" || !session?.user?.id) {
      setLoading(status === "loading");
      setShowPlaceholders(status === "unauthenticated");
      if (status === "unauthenticated") setTaskLists([]);
      return;
    }
    setLoading(true);
    setShowPlaceholders(false);
    try {
      const res = await fetch("/api/features/tasks", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to fetch task lists: ${res.statusText}`);
      let data = await res.json();

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn("Fetched data is not an array:", data);
        data = [];
      }

      // If authenticated user has no lists, show placeholders
      if (data.length === 0 && status === "authenticated") {
        setTaskLists(placeholderTaskLists);
        setShowPlaceholders(true);
      } else {
        // Map fetched data to TaskList/Task structure, providing defaults for missing fields
        data = data.map((list: Partial<TaskList>): TaskList => ({
          _id: list._id,
          name: list.name || "Unnamed List",
          isAddingTask: false,
          tasks: (list.tasks || []).map(
            (task: Partial<Task>): Task => ({
              id: task.id || crypto.randomUUID(), // Ensure ID exists
              name: task.name || "",
              completed: task.completed || false,
              priority: typeof task.priority === "number" ? task.priority : 0, // Ensure priority is number
              subtasks: (task.subtasks || []).map(
                (sub: Partial<Task>): Task => ({ // Map subtasks similarly
                  id: sub.id || crypto.randomUUID(),
                  name: sub.name || "",
                  completed: sub.completed || false,
                  priority: typeof sub.priority === "number" ? sub.priority : 0,
                  subtasks: [], // Subtasks don't have further nesting in this structure
                })
              ),
            })
          ),
        }));
        setTaskLists(data);
        setShowPlaceholders(false);
      }
    } catch (error) {
      console.error("Failed to fetch task lists:", error);
      setTaskLists([]); // Clear lists on error
      setShowPlaceholders(false);
       // TODO: Add user feedback for fetch errors
    } finally {
      setLoading(false);
    }
  }, [session, status]); // Dependencies for the fetch function

  // Effect to fetch task lists when session status changes or component mounts
  useEffect(() => {
    fetchTaskLists();
  }, [fetchTaskLists]);

  // --- List Management ---
  // Handles adding a new task list (on Enter key press)
  const handleAddList = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newListName.trim() && session?.user?.id) {
      const listName = newListName.trim();
      // Optimistic UI update: create list object without DB ID yet
      const optimisticList: Omit<TaskList, "_id" | "isAddingTask"> = { name: listName, tasks: [] };
      const listToUpdate = showPlaceholders ? [] : taskLists; // If showing placeholders, start fresh
      const tempId = `temp-${crypto.randomUUID()}`; // Temporary ID for UI
      const newUiList: TaskList = { ...optimisticList, _id: tempId, isAddingTask: false };
      const updatedLists = [...listToUpdate, newUiList];

      // Update state immediately
      setTaskLists(updatedLists);
      setShowPlaceholders(false);
      const oldListName = newListName; // Keep name in case of error
      setNewListName("");
      setIsAddingList(false);

      // Send request to the server
      try {
        const res = await fetch("/api/features/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optimisticList),
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to add task list: ${res.statusText}`);
        const { id: dbId } = await res.json(); // Get the real database ID
        // Update the list with the real ID
        setTaskLists((prev) =>
          prev.map((list) => (list._id === tempId ? { ...list, _id: dbId } : list))
        );
      } catch (error) {
        console.error("Error adding task list:", error);
        // Revert optimistic update on error
        setTaskLists((prev) => prev.filter((list) => list._id !== tempId));
        setNewListName(oldListName); // Restore input value
        setIsAddingList(true); // Re-open input
        // TODO: Add user feedback for failed list creation
      }
    } else if (e.key === "Escape") {
      // Cancel adding list
      setIsAddingList(false);
      setNewListName("");
    }
  };

  // Handles deleting a task list
  const handleDeleteList = async (listIndex: number) => {
    const listToDelete = taskLists[listIndex];
    // Prevent deleting placeholders or non-existent lists
    if (!listToDelete?._id || listToDelete._id.startsWith("placeholder-")) return;

    const originalLists = [...taskLists]; // Backup for potential rollback
    // Optimistic UI update
    const remainingLists = taskLists.filter((_, index) => index !== listIndex);
    setTaskLists(remainingLists);

    // Send delete request to the server
    try {
      const res = await fetch("/api/features/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listToDelete._id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to delete task list: ${res.statusText}`);
      // If all lists are deleted, show placeholders again
      if (remainingLists.length === 0) {
        setTaskLists(placeholderTaskLists)
        setShowPlaceholders(true);
      }
    } catch (error) {
      console.error("Error deleting task list:", error);
      // Revert UI update on error
      setTaskLists(originalLists);
      // TODO: Add user feedback for failed deletion
    }
  };

  // --- Task Management Helpers ---
  // Recursive helper to find a task (or subtask) by ID and apply an update function
  const findAndUpdateTask = (tasks: Task[], taskId: string, updateFn: (task: Task) => Task): { updatedTasks: Task[]; taskFound: boolean } => {
    let taskFound = false;
    const updatedTasks = tasks.map((task) => {
      // Found the task at the current level
      if (task.id === taskId) {
        taskFound = true;
        return updateFn(task); // Apply the update
      }
      // Check subtasks recursively
      if (task.subtasks?.length > 0) {
        let subtaskFound = false;
        const updatedSubtasks = task.subtasks.map((sub) => {
          if (sub.id === taskId) {
            subtaskFound = true; // Mark subtask found
            taskFound = true;    // Mark task found overall
            return updateFn(sub); // Apply update to subtask
          }
          return sub; // Return unchanged subtask
        });
        // If a subtask was updated, return the parent task with updated subtasks
        if (subtaskFound) {
          return { ...task, subtasks: updatedSubtasks };
        }
      }
      // Return unchanged task if not the target and no subtask was the target
      return task;
    });
    return { updatedTasks, taskFound };
  };

  // Recursive helper to find and delete a task (or subtask) by ID
  const findAndDeleteTask = (tasks: Task[], taskId: string): { updatedTasks: Task[]; taskFound: boolean } => {
    let taskFound = false;
    const filteredTasks: Task[] = [];
    for (const task of tasks) {
      // If current task is the one to delete, skip adding it to filteredTasks
      if (task.id === taskId) {
        taskFound = true;
        continue; // Skip this task
      }
      // Check subtasks recursively
      if (task.subtasks?.length > 0) {
        const filteredSubtasks = task.subtasks.filter((sub) => {
          if (sub.id === taskId) {
            taskFound = true; // Mark as found
            return false; // Exclude this subtask
          }
          return true; // Keep this subtask
        });
        // Add the task back with potentially filtered subtasks
        filteredTasks.push({ ...task, subtasks: filteredSubtasks || [] });
      } else {
        // Add the task back if it's not the target and has no subtasks to check
        filteredTasks.push(task);
      }
    }
    return { updatedTasks: filteredTasks, taskFound };
  };

  // --- Task Actions ---
  // Handles adding a new task or subtask
  const handleAddTask = (listIndex: number, parentTaskId?: string) => {
    // Determine which input element to read from (main task or subtask)
    const inputId = parentTaskId ? `subtask-input-${parentTaskId}` : `task-input-${listIndex}`;
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (!inputElement || !inputElement.value.trim()) return; // Ignore if input is empty

    const newTask = createNewTask(inputElement.value); // Create the task object
    const list = taskLists[listIndex];
    if (!list) return; // Should not happen, but good practice

    let updatedTasks: Task[];
    // If adding a subtask
    if (parentTaskId) {
      const result = findAndUpdateTask(list.tasks, parentTaskId, (task) => ({
        ...task,
        subtasks: [...(task.subtasks || []), newTask], // Add new subtask to parent
      }));
      if (!result.taskFound) return; // Parent task not found
      updatedTasks = result.updatedTasks;
      setExpandedTasks((prev) => ({ ...prev, [parentTaskId]: true })); // Expand parent
      setAddingSubtaskTo(null); // Hide subtask input
    } else {
      // If adding a main task
      updatedTasks = [...list.tasks, newTask]; // Add to the end of the list
    }

    // Update component state
    const updatedLists = [...taskLists];
    if (updatedLists[listIndex]) {
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      // Hide the main task input if adding a main task
      if (!parentTaskId) {
        updatedLists[listIndex].isAddingTask = false;
      }
      setTaskLists(updatedLists);
      // Persist changes to the server (if not a placeholder list)
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
    inputElement.value = ""; // Clear the input field
  };

  // Handles key presses (Enter, Escape) in task/subtask input fields
  const handleKeyDownTaskInput = (e: React.KeyboardEvent<HTMLInputElement>, listIndex: number, parentTaskId?: string) => {
    if (e.key === "Enter") {
      handleAddTask(listIndex, parentTaskId); // Add task on Enter
    } else if (e.key === "Escape") {
      // Cancel adding
      if (parentTaskId) {
        setAddingSubtaskTo(null); // Hide subtask input
      } else {
        // Hide main task input for the specific list
        const updatedLists = [...taskLists];
        if (updatedLists[listIndex]) {
          updatedLists[listIndex].isAddingTask = false;
          setTaskLists(updatedLists);
        }
      }
      e.currentTarget.value = ""; // Clear input
      e.currentTarget.blur(); // Remove focus
    }
  };

  // Handles deleting a specific task or subtask
  const handleDeleteTask = (listIndex: number, taskId: string) => {
    const list = taskLists[listIndex];
    if (!list) return;

    // Use the helper function to find and delete the task/subtask
    const { updatedTasks, taskFound } = findAndDeleteTask(list.tasks, taskId);
    if (taskFound) {
      // Update state
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      // Persist changes
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
      // Close priority dropdown if it was open for the deleted task
      if (openPriorityDropdown === taskId) {
        setOpenPriorityDropdown(null);
      }
    }
  };

  // Handles toggling the completion status of a task/subtask
  const handleToggleTaskCompletion = (listIndex: number, taskId: string) => {
    const list = taskLists[listIndex];
    if (!list) return;

    // Use helper to find and update the task's 'completed' status
    const { updatedTasks, taskFound } = findAndUpdateTask(list.tasks, taskId, (task) => ({
      ...task,
      completed: !task.completed, // Toggle status
    }));
    if (taskFound) {
      // Update state and persist
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
  };

  // Handles setting the priority of a task/subtask
  const handleSetPriority = (listIndex: number, taskId: string, newPriority: number) => {
    const list = taskLists[listIndex];
    if (!list) return;

    // Use helper to find and update the task's 'priority'
    const { updatedTasks, taskFound } = findAndUpdateTask(list.tasks, taskId, (task) => ({
      ...task,
      priority: newPriority, // Set new priority
    }));
    if (taskFound) {
      // Update state and persist
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
  };

  // Initiates the editing mode for a task
  const handleStartEditing = (task: Task) => {
    setEditingTaskId(task.id); // Set the ID of the task being edited
    setEditingTaskValue(task.name); // Populate input with current name
    setOpenPriorityDropdown(null); // Close priority dropdown if open
    // Focus the input field after a short delay to allow rendering
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  // Cancels the editing mode
  const handleCancelEditing = () => {
    setEditingTaskId(null);
    setEditingTaskValue("");
  };

  // Saves the edited task name
  const handleSaveEditing = (listIndex: number) => {
    if (!editingTaskId) return; // Exit if no task is being edited
    const trimmedValue = editingTaskValue.trim(); // Get trimmed value
    const list = taskLists[listIndex];
    if (!list) return;

    // If the name is empty after trimming, delete the task instead
    if (!trimmedValue) {
      handleDeleteTask(listIndex, editingTaskId);
      handleCancelEditing(); // Reset editing state
      return;
    }

    // Use helper to find and update the task's 'name'
    const { updatedTasks, taskFound } = findAndUpdateTask(list.tasks, editingTaskId, (task) => ({
      ...task,
      name: trimmedValue, // Set new name
    }));
    if (taskFound) {
      // Update state and persist
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
    handleCancelEditing(); // Exit editing mode
  };

  // Handles key presses (Enter, Escape) in the edit input field
  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, listIndex: number) => {
    if (e.key === "Enter") {
      handleSaveEditing(listIndex); // Save on Enter
    } else if (e.key === "Escape") {
      handleCancelEditing(); // Cancel on Escape
    }
  };

  // Toggles the expansion state for subtasks
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Toggles the visibility of the priority dropdown for a task
  const togglePriorityDropdown = (taskId: string) => {
    setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId)); // Toggle: open if closed, close if open for this task ID
  };

  // --- UI Calculation ---
  // Calculates the completion ratio (e.g., "3/5") for a list, including subtasks
  const getCompletionRatio = (tasks: Task[]): string => {
    let totalTasks = 0;
    let completedTasks = 0;
    // Recursive function to count tasks and completed tasks
    const countTasks = (taskList: Task[]) => {
      taskList.forEach((task) => {
        totalTasks++;
        if (task.completed) completedTasks++;
        // Recursively count subtasks
        if (task.subtasks?.length > 0) {
          countTasks(task.subtasks);
        }
      });
    };
    countTasks(tasks); // Start counting from the top level
    return totalTasks > 0 ? `${completedTasks}/${totalTasks}` : `0/0`; // Format the ratio string
  };

  // Recursively renders a task and its subtasks.
  // `level` indicates the nesting depth (0 for top-level tasks, 1 for first-level subtasks, etc.)
  const renderTask = (task: Task, listIndex: number, level = 0): React.ReactNode => {
    const isEditing = editingTaskId === task.id;
    const isExpanded = !!expandedTasks[task.id];
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isPriorityDropdownOpen = openPriorityDropdown === task.id;
    const isSubtask = level > 0;

    // Calculate indentation based on the nesting level for subtasks
    const indentationClass = level > 0 ? `pl-${level * 6}` : ""; // e.g., pl-6, pl-12

    // --- Render Edit Mode ---
    // If the task is currently being edited, render an input field instead of the task view.
    if (isEditing) {
      return (
        <div key={`${task.id}-editing`} className={`relative ${indentationClass}`}>
          {/* Container for the edit input */}
          <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 shadow-sm transition-all duration-200">
            {/* Placeholder for chevron/checkbox space */}
            <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>
            {/* The actual input field for editing the task name */}
            <input
              ref={editInputRef} // Ref to focus the input
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listIndex)} // Handle Enter/Escape
              onBlur={() => handleSaveEditing(listIndex)} // Save when focus is lost
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus // Focus when rendered
            />
             {/* Placeholder for action buttons space */}
            <div className="w-20 flex-shrink-0" aria-hidden="true"></div>
          </div>
        </div>
      );
    }

    // --- Render Normal Task View ---
    // Renders the standard view for a task (not in edit mode).
    return (
      <div key={task.id} className={`relative group/task ${indentationClass}`}>
        {/* Main container for a single task row. Includes hover effects and group identifier. */}
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 hover:shadow-sm transition-all duration-200">

          {/* Expansion Chevron/Placeholder */}
          <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
            {hasSubtasks ? (
              // Render expand/collapse button if the task has subtasks
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </button>
            ) : (
              // Render an empty div to maintain alignment if there are no subtasks
              <div className="w-5" aria-hidden="true"></div>
            )}
          </div>

          {/* Checkbox and Task Name */}
          <Checkbox
            checked={task.completed}
            onChange={() => handleToggleTaskCompletion(listIndex, task.id)}
            label={task.name} // The task name is rendered within the Checkbox component
            variant={isSubtask ? "subtask" : "default"} // Apply different styling for subtask checkboxes
            // Add onDoubleClick handler here if you implement double-click to edit
            // onDoubleClick={() => handleStartEditing(task)} // Example implementation
          />

          {/* Action Buttons (Priority, Edit, Delete) - appear on hover typically */}
          <div className="flex items-center gap-1 ml-auto pl-2 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
            {/* Priority Button & Dropdown */}
            <div className="relative"> {/* Relative positioning for dropdown */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering other clicks (like edit maybe)
                  togglePriorityDropdown(task.id);
                }}
                title={`Priority: ${priorityLevels.find((p) => p.level === task.priority)?.label || "None"}`}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
                aria-haspopup="true"
                aria-expanded={isPriorityDropdownOpen}
              >
                <PriorityIconDisplay level={task.priority} />
              </button>
              {/* Render the priority dropdown conditionally */}
              {isPriorityDropdownOpen && (
                <PriorityDropdown
                  taskId={task.id}
                  listIndex={listIndex}
                  currentPriority={task.priority}
                  onSetPriority={handleSetPriority}
                  onClose={() => setOpenPriorityDropdown(null)} // Close dropdown handler
                />
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => handleStartEditing(task)}
              title="Edit task"
              className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <IconEdit size={14} />
            </button>

            {/* Delete Button */}
            <button
              onClick={() => handleDeleteTask(listIndex, task.id)}
              title="Delete task"
              className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors"
            >
              <IconTrash size={14} />
            </button>
          </div>
        </div>

        {/* --- Render Subtasks --- */}
        {/* If the task has subtasks and is expanded, recursively render them */}
        {hasSubtasks && isExpanded && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {task.subtasks
              .sort((a, b) => b.priority - a.priority) // Sort subtasks by priority (descending)
              .map((subtask) => renderTask(subtask, listIndex, level + 1))} {/* Recursive call with increased level */}
          </div>
        )}

        {/* --- Render Add Subtask Input/Button --- */}
        {/* Only show the 'Add subtask' option for top-level tasks (level === 0) */}
        {level === 0 && (
          <div className={`mt-1 ${indentationClass}`}>
            {addingSubtaskTo === task.id ? (
              // If currently adding a subtask to *this* task, show the input field
              <input
                ref={subtaskInputRef} // Ref to focus
                id={`subtask-input-${task.id}`} // Unique ID for the input
                type="text"
                onKeyDown={(e) => handleKeyDownTaskInput(e, listIndex, task.id)} // Handle Enter/Escape
                onBlur={(e) => {
                  // Hide input if blurred and empty
                  if (!e.target.value.trim()) setAddingSubtaskTo(null);
                }}
                className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200"
                placeholder="New subtask..."
                autoFocus // Focus when rendered
              />
            ) : (
              // Otherwise, show the 'Add subtask' button (appears on parent task hover)
              <button
                onClick={() => {
                  setAddingSubtaskTo(task.id); // Set state to show input for this task
                  // Focus the input after it renders
                  setTimeout(() => subtaskInputRef.current?.focus(), 0);
                }}
                // Button appears on hover of the parent task (group/task)
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 pl-7 opacity-0 group-hover/task:opacity-100"
                title="Add subtask"
              >
                <IconCopyPlus size={14} />
                <span>Add subtask</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }; // --- End of renderTask Function ---


  // --- Loading and Empty States ---
  if (loading) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Loading Tasks...</div>;
  }
  // Show message if user is not logged in (and not showing placeholders)
  if (status === "unauthenticated" && !showPlaceholders) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Please sign in to manage your tasks.</div>;
  }

  // --- Main Component Render ---
  return (
    // Outer container for the entire tasks component
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">MY TASKS</h1>
      </div>

      {/* Scrollable area for task lists */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        {/* Message shown when authenticated but no lists exist */}
        {taskLists.length === 0 && !isAddingList && !showPlaceholders && status === "authenticated" && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-10">No task lists yet. Add one below!</div>
        )}

        {/* Iterate over each task list */}
        {taskLists.map((list, listIndex) => (
          <div key={list._id || `list-${listIndex}`} className="mb-6 group/list"> {/* Use DB ID or index as key */}
            {/* List Header (Name, Separator, Completion Ratio, Delete Button) */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">{list.name}</h2>
              <div className="flex-1 mx-3 border-t border-slate-200 dark:border-zinc-700 border-dashed"></div> {/* Dashed separator */}
              <div className="flex items-center gap-2">
                {/* Display completion ratio */}
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
                  {getCompletionRatio(list.tasks)}
                </span>
                {/* Show delete button only for non-placeholder lists */}
                {!list._id?.startsWith("placeholder-") && (
                  <button
                    onClick={() => handleDeleteList(listIndex)}
                    title={`Delete list "${list.name}"`}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1 opacity-0 group-hover/list:opacity-100" // Visible on list hover
                  >
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Render Tasks for the current list */}
            {/* Sort tasks by priority (desc) then map using the renderTask function */}
            {list.tasks
              .sort((a, b) => b.priority - a.priority) // Higher priority first
              .map((task) => renderTask(task, listIndex, 0))} {/* Start rendering at level 0 */}

            {/* Input field for adding a new task to this list */}
            {list.isAddingTask && (
              <div className="mt-2">
                <input
                  id={`task-input-${listIndex}`} // Unique ID
                  type="text"
                  onKeyDown={(e) => handleKeyDownTaskInput(e, listIndex)} // Handle Enter/Escape
                  onBlur={(e) => {
                    // Logic to hide the input if blurred and empty (with delay to allow click elsewhere)
                    const inputVal = e.target.value;
                    setTimeout(() => {
                      const currentInput = document.getElementById(`task-input-${listIndex}`);
                      // Check if the input still exists and is empty
                      if (currentInput && !inputVal.trim()) {
                        const updatedLists = [...taskLists];
                        if (updatedLists[listIndex]) {
                          updatedLists[listIndex].isAddingTask = false; // Hide input
                          setTaskLists(updatedLists);
                        }
                      }
                    }, 100); // Small delay
                  }}
                  className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200"
                  placeholder="New task..."
                  autoFocus // Focus when rendered
                />
              </div>
            )}

            {/* Button to show the 'Add task' input field */}
            {!list.isAddingTask && !list._id?.startsWith("placeholder-") && (
              <button
                onClick={() => {
                  // Set the 'isAddingTask' flag for this specific list to true
                  const updatedLists = [...taskLists];
                  if (updatedLists[listIndex]) {
                    // Close other 'add task' inputs first
                    updatedLists.forEach((l, idx) => {
                      if (idx !== listIndex) l.isAddingTask = false;
                    });
                    updatedLists[listIndex].isAddingTask = true; // Open for this list
                    setTaskLists(updatedLists);
                    // Focus the input after state update allows it to render
                    setTimeout(() => document.getElementById(`task-input-${listIndex}`)?.focus(), 0);
                  }
                }}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1 mt-1"
                title="Add task"
              >
                <IconCopyPlus size={14} />
                <span>Add task</span>
              </button>
            )}
          </div>
        ))} {/* End of task list map */}

        {/* Input field for adding a new list */}
        {isAddingList && (
          <div className="mb-6 mt-4">
            <input
              ref={listNameInputRef} // Ref to focus
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={handleAddList} // Handle Enter/Escape
              onBlur={() => {
                // Logic to hide the input if blurred and empty (with delay)
                setTimeout(() => {
                  if (listNameInputRef.current && !newListName.trim()) {
                    setIsAddingList(false);
                    setNewListName("");
                  }
                }, 100);
              }}
              className="w-full text-lg font-medium text-slate-700 dark:text-slate-300 bg-transparent border-b-2 border-slate-300/50 dark:border-zinc-600/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
              placeholder="New list name..."
              autoFocus // Focus when rendered
            />
            {/* Helper text for the input */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Press Enter to save or Escape to cancel
            </p>
          </div>
        )}
      </div> {/* End of scrollable area */}

      {/* Footer Section - Button to add a new list */}
      {!isAddingList && (
        <button
          onClick={() => {
            setIsAddingList(true); // Show the new list input
            // Focus the input after state update
            setTimeout(() => listNameInputRef.current?.focus(), 0);
          }}
          className="mt-4 flex items-center justify-center p-2 w-full bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 hover:border-slate-300/70 dark:hover:border-zinc-600/70 transition-all duration-200 flex-shrink-0"
          disabled={status !== "authenticated"} // Disable if not logged in
          title={status !== "authenticated" ? "Sign in to add lists" : "Add a new task list"}
        >
          <IconSquareRoundedPlus2 size={18} className="mr-2" />
          <span className="font-medium">Add new list</span>
        </button>
      )}
    </div> // End of outer container
  );
};

export default Tasks;