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
import Checkbox from "../../recyclable/Checkbox";
import Link from "next/link";
import * as tasksApi from "../../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";

// --- Helper Functions ---
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

// Minimal placeholder for logged-out state
const placeholderTaskLists: TaskList[] = [
  {
    _id: "placeholder-preview",
    name: "Tasks Preview",
    tasks: [
      { id: 'p1', name: 'Sign in to view your tasks', completed: false, priority: 0, subtasks: [] },
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
            currentPriority === level ? "bg-slate-50/80 dark:bg-zinc-700/80 font-semibold" : ""
          }`}
        >
          <Icon size={16} className={level === 0 ? "opacity-50 text-slate-400" : color} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};


// --- Main Tasks (Preview) Component ---
const Tasks: React.FC = () => {
  // --- React Query Client ---
  const queryClient = useQueryClient();
  const { status } = useSession();

  // --- Local UI State ---
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({}); // Still needed for UI expansion
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState<string | null>(null);

  // --- Refs ---
  const editInputRef = useRef<HTMLInputElement>(null);

  const MAX_PREVIEW_TASKS = 5; // Number of tasks to show in preview

  // --- React Query: Fetching Task Lists (Uses the same query key!) ---
  const {
    data: taskLists = [], // Default to empty array
    isLoading: isLoadingLists,
    isError: isErrorLists,
    error: errorLists,
  } = useQuery<TaskList[], Error>({
    queryKey: ['tasks'], // *** Crucial: Use the same query key as TaskLogger ***
    queryFn: tasksApi.getTaskLists,
    enabled: status === 'authenticated', // Only fetch if authenticated
    staleTime: 1000 * 60 * 1, // Keep cache fresh for 1 min
    refetchOnWindowFocus: true,
    placeholderData: status !== 'authenticated' ? placeholderTaskLists : undefined, // Show placeholder if not logged in
  });

  // --- React Query: Mutations (Only need list updates for task changes) ---
  const updateListMutation = useMutation({
    mutationFn: tasksApi.updateTaskList,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Refetch lists after update
      // Close editing state if this mutation was triggered by saving an edit
      if (editingTaskId && variables.tasks && variables.id === taskLists.find(list => list.tasks.some(task => task.id === editingTaskId))?._id) {
        setEditingTaskId(null);
        setEditingTaskValue("");
      }
    },
    onError: (error, variables) => {
      console.error(`Error updating list ${variables.id} from preview:`, error);
      // Add user feedback (e.g., toast)
    },
     // Optional: Add optimistic updates for smoother UI transitions
    // onMutate: async (updatedList) => { ... },
    // onError: (err, newTodo, context) => { ... },
    // onSettled: () => { ... },
  });

  // --- Task Management Helpers (Recursive, operate on copies) ---
  // These are needed to prepare the updated tasks array for the mutation
   const findAndUpdateTask = (tasks: Task[], taskId: string, updateFn: (task: Task) => Task): { updatedTasks: Task[]; taskFound: boolean } => {
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

  // Helper to find the list and trigger the update mutation
  const triggerListUpdate = (listId: string, updatedTasks: Task[]) => {
    const list = taskLists.find(l => l._id === listId);
    if (list && list._id && !list._id.startsWith("placeholder-")) {
        updateListMutation.mutate({ id: list._id, tasks: updatedTasks });
    } else {
        console.warn(`List ${listId} not found or is placeholder, cannot update from preview.`);
    }
  };

  const handleToggleTaskCompletion = (listId: string, taskId: string) => {
      const list = taskLists.find(l => l._id === listId);
      if (!list) return;
      const { updatedTasks, taskFound } = findAndUpdateTask([...list.tasks], taskId, (task) => ({ // Operate on copy
          ...task,
          completed: !task.completed,
      }));
      if (taskFound) {
          triggerListUpdate(listId, updatedTasks);
      }
  };

  const handleSetPriority = (listId: string, taskId: string, newPriority: number) => {
      const list = taskLists.find(l => l._id === listId);
      if (!list) return;
      const { updatedTasks, taskFound } = findAndUpdateTask([...list.tasks], taskId, (task) => ({ // Operate on copy
          ...task,
          priority: newPriority,
      }));
      if (taskFound) {
          triggerListUpdate(listId, updatedTasks);
          // Dropdown closes itself via its onClose callback
      }
  };

  const handleStartEditing = (listId: string, task: Task) => {
      if (listId.startsWith("placeholder-")) return; // Cannot edit placeholder
      setEditingTaskId(task.id);
      setEditingTaskValue(task.name);
      setOpenPriorityDropdown(null); // Close priority dropdown
      setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEditing = () => {
      setEditingTaskId(null);
      setEditingTaskValue("");
  };

  const handleSaveEditing = (listId: string) => {
      if (!editingTaskId || listId.startsWith("placeholder-")) return;
      const trimmedValue = editingTaskValue.trim();
      const list = taskLists.find(l => l._id === listId);
      if (!list) { handleCancelEditing(); return; };

      // If editing to empty, treat as delete (optional behavior)
      if (!trimmedValue) {
          // handleDeleteTask(listId, editingTaskId); // Uncomment if delete is desired here
          handleCancelEditing();
          return;
      }

      const { updatedTasks, taskFound } = findAndUpdateTask([...list.tasks], editingTaskId, (task) => ({ // Operate on copy
          ...task,
          name: trimmedValue,
      }));

      if (taskFound) {
          triggerListUpdate(listId, updatedTasks);
          // Let mutation's onSuccess handle resetting edit state
      } else {
          handleCancelEditing(); // Task somehow disappeared? Cancel edit.
      }
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, listId: string) => {
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
      // Don't open if currently editing
      if (editingTaskId) return;
      setOpenPriorityDropdown((prev) => (prev === taskId ? null : taskId));
  };

  // --- UI Calculation ---
  const calculateTotalIncomplete = (allLists: TaskList[] | undefined): number => {
      if (!allLists || allLists.length === 0 || allLists.some(l => l._id?.startsWith("placeholder-"))) return 0; // Don't count placeholders or if loading

      let count = 0;
      const countIncomplete = (tasks: Task[]) => {
          tasks.forEach(task => {
              if (!task.completed) count++;
              // Recursively count subtasks if needed, depends on definition
              // if (task.subtasks?.length) countIncomplete(task.subtasks);
          });
      };

      allLists.forEach(list => {
          if (!list._id?.startsWith("placeholder-")) { // Only count real lists
              countIncomplete(list.tasks || []);
          }
      });
      return count;
  };


  // --- Render Task Function (Simplified for Preview) ---
  const renderTask = (task: Task, listId: string, level = 0): React.ReactNode => {
      const isEditing = editingTaskId === task.id;
      const isExpanded = !!expandedTasks[task.id];
      const hasSubtasks = task.subtasks && task.subtasks.length > 0;
      const isPriorityDropdownOpen = openPriorityDropdown === task.id;
      const indentationClass = level > 0 ? `pl-${level * 6}` : ""; // Adjust as needed
      const isPlaceholder = listId.startsWith("placeholder-");

      // Placeholder rendering
      if (isPlaceholder) {
          return (
              <div key={task.id} className={`relative group/task ${indentationClass}`}>
                  <div className="flex items-center p-2 rounded-lg">
                      <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2"><div className="w-5"></div></div> {/* Spacer */}
                      <Checkbox checked={false} onChange={() => {}} label={task.name} variant="default" disabled={true} />
                  </div>
              </div>
          );
      }

      // Editing view...
      if (isEditing) {
          return (
              <div key={`${task.id}-editing`} className={`relative ${indentationClass}`}>
                  <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 transition-all duration-200">
                      <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div> {/* Spacer */}
                      <input
                          ref={editInputRef}
                          type="text"
                          value={editingTaskValue}
                          onChange={(e) => setEditingTaskValue(e.target.value)}
                          onKeyDown={(e) => handleEditInputKeyDown(e, listId)}
                          onBlur={() => handleSaveEditing(listId)} // Save on blur
                          className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
                          autoFocus
                          disabled={updateListMutation.isPending} // Disable while saving
                      />
                      <div className="w-16 flex-shrink-0" aria-hidden="true"></div> {/* Actions Placeholder */}
                  </div>
              </div>
          );
      }

      // Normal task view...
      return (
          <div key={task.id} className={`relative group/task ${indentationClass}`}>
              <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 transition-all duration-200">
                  {/* Expansion Chevron/Placeholder (Optional for preview) */}
                  <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
                      {/* Maybe hide chevron in preview? */}
                       {hasSubtasks ? (
                           <button onClick={() => toggleTaskExpansion(task.id)} /* ... simplified style ... */ >
                               {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                           </button>
                       ) : <div className="w-5"></div>}
                  </div>

                  {/* Checkbox and Task Name Area */}
                  <div className="flex-1 mr-2 cursor-pointer" onDoubleClick={() => handleStartEditing(listId, task)}>
                      <Checkbox
                          checked={task.completed}
                          onChange={() => handleToggleTaskCompletion(listId, task.id)}
                          label={task.name}
                          variant="default" // Subtask style might not be needed in flat preview
                          disabled={updateListMutation.isPending} // Disable while saving
                      />
                  </div>

                  {/* Action Buttons (Priority, Edit) */}
                  <div className="flex items-center gap-1 ml-auto pl-2 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity duration-200">
                      {/* Priority */}
                      <div className="relative z-10">
                          <button
                              onClick={(e) => { e.stopPropagation(); togglePriorityDropdown(task.id); }}
                              title={`Priority: ${priorityLevels.find(p => p.level === task.priority)?.label || 'None'}`}
                              className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
                              aria-haspopup="true"
                              aria-expanded={isPriorityDropdownOpen}
                              disabled={updateListMutation.isPending} // Disable while saving
                          >
                              <PriorityIconDisplay level={task.priority} />
                          </button>
                          {isPriorityDropdownOpen && (
                              <PriorityDropdown
                                  taskId={task.id} listId={listId} currentPriority={task.priority}
                                  onSetPriority={handleSetPriority}
                                  onClose={() => setOpenPriorityDropdown(null)}
                              />
                          )}
                      </div>
                      {/* Edit */}
                      <button
                          onClick={() => handleStartEditing(listId, task)}
                          title="Edit task"
                          className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors disabled:opacity-50"
                          disabled={updateListMutation.isPending} // Disable while saving
                      >
                          <IconEdit size={14} />
                      </button>
                      {/* Optional: Delete Button */}
                      {/* <button onClick={() => handleDeleteTask(listId, task.id)} title="Delete task" className="..." disabled={updateListMutation.isPending}><IconTrash size={14} /></button> */}
                  </div>
              </div>

              {/* Optional: Render Subtasks if expanded (might make preview too busy) */}
              {/* {hasSubtasks && isExpanded && (
                  <div className="mt-1 space-y-1 animate-fade-in pl-6"> // Indent subtasks visually
                      {task.subtasks
                          .sort((a, b) => b.priority - a.priority)
                          .map((subtask) => renderTask(subtask, listId, level + 1))}
                  </div>
              )} */}
          </div>
      );
  };


  // --- Loading State ---
  // Simple loader for preview
  if (status === 'loading' || (status === 'authenticated' && isLoadingLists && !taskLists.length)) {
      return (
          <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col items-center justify-center h-40">
              <span className="text-slate-500 dark:text-slate-400">Loading tasks...</span>
          </div>
      );
  }
  // Error state
  if (isErrorLists) {
      return <div className="p-4 text-center text-red-500 dark:text-red-400">Error loading tasks preview: {errorLists?.message || 'Unknown error'}</div>;
  }

  // Data for display (use taskLists from useQuery, could be placeholder or real data)
  // Find the first *non-placeholder* list to display, fallback to the first list if only placeholders exist (or none)
  const displayList = taskLists.find(list => list._id && !list._id.startsWith("placeholder-")) || taskLists[0] || null;
  const displayTasks = displayList ? (displayList.tasks || []).slice(0, MAX_PREVIEW_TASKS) : [];
  const totalIncomplete = calculateTotalIncomplete(taskLists); // Calculate based on *all* fetched lists

  // --- Main Component Render ---
  return (
      <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
              <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">TASKS</h1>
              <Link href="/dashboard/tasks" passHref legacyBehavior>
                  <a className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 bg-primary-white dark:bg-primary-black-dark px-2 py-1 rounded-md dark:hover:text-gray-100 cursor-pointer border border-slate-200/80 dark:border-zinc-700/80 transition-all">
                      <span>Go to Tasks</span>
                      <IconArrowRight size={14} />
                  </a>
              </Link>
          </div>

          {/* Summary Message */}
          {status === "authenticated" && !isLoadingLists && !isErrorLists && !taskLists.some(l => l._id?.startsWith("placeholder-")) && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">
                  You have <span className="font-semibold">{totalIncomplete}</span> task{totalIncomplete !== 1 ? 's' : ''} remaining.
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
                              .sort((a, b) => b.priority - a.priority) // Sort preview tasks
                              .map((task) => renderTask(task, displayList._id!, 0)) // Pass non-placeholder listId
                      ) : (
                          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                              {status === "authenticated" ? "No tasks in the first list." : "Sign in to view tasks."}
                          </div>
                      )}
                  </>
              ) : (
                  // Only show "No lists found" if authenticated and done loading and no lists exist
                  status === "authenticated" && !isLoadingLists && !isErrorLists && taskLists.length === 0 && (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                          No task lists found. Add one in the main Tasks view.
                      </div>
                  )
              )}
          </div>

          {/* Footer Link */}
          <div className="mt-3 text-center flex-shrink-0">
              <Link href="/dashboard/tasks" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                  View all tasks
              </Link>
          </div>
      </div>
  );
};

export default Tasks;