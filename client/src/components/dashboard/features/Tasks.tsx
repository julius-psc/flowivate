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
interface Task {
  id: string;
  name: string;
  completed: boolean;
  priority: number;
  subtasks: Task[];
}

interface TaskList {
  _id?: string;
  name: string;
  tasks: Task[];
  isAddingTask?: boolean;
}

// --- Helper Functions ---
const createNewTask = (name: string): Task => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  completed: false,
  priority: 0,
  subtasks: [],
});

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

// Placeholder data
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
      {priorityLevels.map(({ level, label, icon: Icon, color }) => (
        <button
          key={level}
          onClick={() => {
            onSetPriority(listIndex, taskId, level);
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

// --- Main Tasks Component ---
const Tasks: React.FC = () => {
  // --- State & Refs ---
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskValue, setEditingTaskValue] = useState("");
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [openPriorityDropdown, setOpenPriorityDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const { data: session, status } = useSession();
  const editInputRef = useRef<HTMLInputElement>(null);
  const listNameInputRef = useRef<HTMLInputElement>(null);
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  // --- API & Data Fetching ---
  const updateTaskListTasks = useCallback(async (listId: string | undefined, updatedTasks: Task[]) => {
    if (!listId || listId.startsWith("placeholder-")) return;
    try {
      const res = await fetch("/api/features/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId, tasks: updatedTasks }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to update tasks on server: ${res.statusText}`);
    } catch (error) {
      console.error("Error updating tasks:", error);
    }
  }, []);

  const fetchTaskLists = useCallback(async () => {
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

      if (!Array.isArray(data)) {
        console.warn("Fetched data is not an array:", data);
        data = [];
      }

      if (data.length === 0 && status === "authenticated") {
        setTaskLists(placeholderTaskLists);
        setShowPlaceholders(true);
      } else {
        data = data.map((list: Partial<TaskList>): TaskList => ({
          _id: list._id,
          name: list.name || "Unnamed List",
          isAddingTask: false,
          tasks: (list.tasks || []).map(
            (task: Partial<Task>): Task => ({
              id: task.id || crypto.randomUUID(),
              name: task.name || "",
              completed: task.completed || false,
              priority: typeof task.priority === "number" ? task.priority : 0,
              subtasks: (task.subtasks || []).map(
                (sub: Partial<Task>): Task => ({
                  id: sub.id || crypto.randomUUID(),
                  name: sub.name || "",
                  completed: sub.completed || false,
                  priority: typeof sub.priority === "number" ? sub.priority : 0,
                  subtasks: [],
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
      setTaskLists([]);
      setShowPlaceholders(false);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  useEffect(() => {
    fetchTaskLists();
  }, [fetchTaskLists]);

  // --- List Management ---
  const handleAddList = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newListName.trim() && session?.user?.id) {
      const listName = newListName.trim();
      const optimisticList: Omit<TaskList, "_id" | "isAddingTask"> = { name: listName, tasks: [] };
      const listToUpdate = showPlaceholders ? [] : taskLists;
      const tempId = `temp-${crypto.randomUUID()}`;
      const newUiList: TaskList = { ...optimisticList, _id: tempId, isAddingTask: false };
      const updatedLists = [...listToUpdate, newUiList];

      setTaskLists(updatedLists);
      setShowPlaceholders(false);
      const oldListName = newListName;
      setNewListName("");
      setIsAddingList(false);

      try {
        const res = await fetch("/api/features/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(optimisticList),
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to add task list: ${res.statusText}`);
        const { id: dbId } = await res.json();
        setTaskLists((prev) =>
          prev.map((list) => (list._id === tempId ? { ...list, _id: dbId } : list))
        );
      } catch (error) {
        console.error("Error adding task list:", error);
        setTaskLists((prev) => prev.filter((list) => list._id !== tempId));
        setNewListName(oldListName);
        setIsAddingList(true);
      }
    } else if (e.key === "Escape") {
      setIsAddingList(false);
      setNewListName("");
    }
  };

  const handleDeleteList = async (listIndex: number) => {
    const listToDelete = taskLists[listIndex];
    if (!listToDelete?._id || listToDelete._id.startsWith("placeholder-")) return;

    const originalLists = [...taskLists];
    const remainingLists = taskLists.filter((_, index) => index !== listIndex);
    setTaskLists(remainingLists);

    try {
      const res = await fetch("/api/features/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listToDelete._id }),
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to delete task list: ${res.statusText}`);
      if (remainingLists.length === 0) {
        setTaskLists(placeholderTaskLists)
        setShowPlaceholders(true);
      }
    } catch (error) {
      console.error("Error deleting task list:", error);
      setTaskLists(originalLists);
    }
  };

  // --- Task Management Helpers ---
  const findAndUpdateTask = (tasks: Task[], taskId: string, updateFn: (task: Task) => Task): { updatedTasks: Task[]; taskFound: boolean } => {
    let taskFound = false;
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        taskFound = true;
        return updateFn(task);
      }
      if (task.subtasks?.length > 0) {
        let subtaskFound = false;
        const updatedSubtasks = task.subtasks.map((sub) => {
          if (sub.id === taskId) {
            subtaskFound = true;
            taskFound = true;
            return updateFn(sub);
          }
          return sub;
        });
        if (subtaskFound) {
          return { ...task, subtasks: updatedSubtasks };
        }
      }
      return task;
    });
    return { updatedTasks, taskFound };
  };

  const findAndDeleteTask = (tasks: Task[], taskId: string): { updatedTasks: Task[]; taskFound: boolean } => {
    let taskFound = false;
    const filteredTasks: Task[] = [];
    for (const task of tasks) {
      if (task.id === taskId) {
        taskFound = true;
        continue;
      }
      if (task.subtasks?.length > 0) {
        const filteredSubtasks = task.subtasks.filter((sub) => {
          if (sub.id === taskId) {
            taskFound = true;
            return false;
          }
          return true;
        });
        filteredTasks.push({ ...task, subtasks: filteredSubtasks || [] });
      } else {
        filteredTasks.push(task);
      }
    }
    return { updatedTasks: filteredTasks, taskFound };
  };

  // --- Task Actions ---
  const handleAddTask = (listIndex: number, parentTaskId?: string) => {
    const inputId = parentTaskId ? `subtask-input-${parentTaskId}` : `task-input-${listIndex}`;
    const inputElement = document.getElementById(inputId) as HTMLInputElement;
    if (!inputElement || !inputElement.value.trim()) return;

    const newTask = createNewTask(inputElement.value);
    const list = taskLists[listIndex];
    if (!list) return;

    let updatedTasks: Task[];
    if (parentTaskId) {
      const result = findAndUpdateTask(list.tasks, parentTaskId, (task) => ({
        ...task,
        subtasks: [...(task.subtasks || []), newTask],
      }));
      if (!result.taskFound) return;
      updatedTasks = result.updatedTasks;
      setExpandedTasks((prev) => ({ ...prev, [parentTaskId]: true }));
      setAddingSubtaskTo(null);
    } else {
      updatedTasks = [...list.tasks, newTask];
    }

    const updatedLists = [...taskLists];
    if (updatedLists[listIndex]) {
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      if (!parentTaskId) {
        updatedLists[listIndex].isAddingTask = false;
      }
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
    inputElement.value = "";
  };

  const handleKeyDownTaskInput = (e: React.KeyboardEvent<HTMLInputElement>, listIndex: number, parentTaskId?: string) => {
    if (e.key === "Enter") {
      handleAddTask(listIndex, parentTaskId);
    } else if (e.key === "Escape") {
      if (parentTaskId) {
        setAddingSubtaskTo(null);
      } else {
        const updatedLists = [...taskLists];
        if (updatedLists[listIndex]) {
          updatedLists[listIndex].isAddingTask = false;
          setTaskLists(updatedLists);
        }
      }
      e.currentTarget.value = "";
      e.currentTarget.blur();
    }
  };

  const handleDeleteTask = (listIndex: number, taskId: string) => {
    const list = taskLists[listIndex];
    if (!list) return;

    const { updatedTasks, taskFound } = findAndDeleteTask(list.tasks, taskId);
    if (taskFound) {
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
      if (openPriorityDropdown === taskId) {
        setOpenPriorityDropdown(null);
      }
    }
  };

  const handleToggleTaskCompletion = (listIndex: number, taskId: string) => {
    const list = taskLists[listIndex];
    if (!list) return;

    const { updatedTasks, taskFound } = findAndUpdateTask(list.tasks, taskId, (task) => ({
      ...task,
      completed: !task.completed,
    }));
    if (taskFound) {
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
  };

  const handleSetPriority = (listIndex: number, taskId: string, newPriority: number) => {
    const list = taskLists[listIndex];
    if (!list) return;

    const { updatedTasks, taskFound } = findAndUpdateTask(list.tasks, taskId, (task) => ({
      ...task,
      priority: newPriority,
    }));
    if (taskFound) {
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
  };

  const handleStartEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskValue(task.name);
    setOpenPriorityDropdown(null);
    setTimeout(() => editInputRef.current?.focus(), 0);
  };

  const handleCancelEditing = () => {
    setEditingTaskId(null);
    setEditingTaskValue("");
  };

  const handleSaveEditing = (listIndex: number) => {
    if (!editingTaskId) return;
    const trimmedValue = editingTaskValue.trim();
    const list = taskLists[listIndex];
    if (!list) return;

    if (!trimmedValue) {
      handleDeleteTask(listIndex, editingTaskId);
      handleCancelEditing();
      return;
    }

    const { updatedTasks, taskFound } = findAndUpdateTask(list.tasks, editingTaskId, (task) => ({
      ...task,
      name: trimmedValue,
    }));
    if (taskFound) {
      const updatedLists = [...taskLists];
      updatedLists[listIndex] = { ...list, tasks: updatedTasks };
      setTaskLists(updatedLists);
      if (list._id && !list._id.startsWith("placeholder-")) {
        updateTaskListTasks(list._id, updatedTasks);
      }
    }
    handleCancelEditing();
  };

  const handleEditInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, listIndex: number) => {
    if (e.key === "Enter") {
      handleSaveEditing(listIndex);
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

  // --- UI Calculation ---
  const getCompletionRatio = (tasks: Task[]): string => {
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

  // --- Task Rendering Function (Recursive) ---
  const renderTask = (task: Task, listIndex: number, level = 0): React.ReactNode => {
    const isEditing = editingTaskId === task.id;
    const isExpanded = !!expandedTasks[task.id];
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isPriorityDropdownOpen = openPriorityDropdown === task.id;
    const isSubtask = level > 0;

    const indentationClass = level > 0 ? `pl-${level * 6}` : "";

    if (isEditing) {
      return (
        <div key={task.id} className={`relative ${indentationClass}`}>
          <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-200/50 dark:border-zinc-700/50 shadow-sm transition-all duration-200">
            <div className="w-5 mr-2 flex-shrink-0" aria-hidden="true"></div>
            <input
              ref={editInputRef}
              type="text"
              value={editingTaskValue}
              onChange={(e) => setEditingTaskValue(e.target.value)}
              onKeyDown={(e) => handleEditInputKeyDown(e, listIndex)}
              onBlur={() => handleSaveEditing(listIndex)}
              className="flex-1 bg-transparent focus:outline-none text-slate-900 dark:text-slate-200 text-sm font-medium"
              autoFocus
            />
            <div className="w-20 flex-shrink-0" aria-hidden="true"></div>
          </div>
        </div>
      );
    }

    return (
      <div key={task.id} className={`relative group/task ${indentationClass}`}>
        <div className="flex items-center p-2 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-slate-100/50 dark:border-zinc-700/50 hover:border-slate-200/70 dark:hover:border-zinc-600/70 hover:shadow-sm transition-all duration-200">
          <div className="w-5 flex-shrink-0 flex items-center justify-center mr-2">
            {hasSubtasks ? (
              <button
                onClick={() => toggleTaskExpansion(task.id)}
                className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
                aria-label={isExpanded ? "Collapse subtasks" : "Expand subtasks"}
                aria-expanded={isExpanded}
              >
                {isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-5" aria-hidden="true"></div>
            )}
          </div>

          <Checkbox
            checked={task.completed}
            onChange={() => handleToggleTaskCompletion(listIndex, task.id)}
            label={task.name}
            variant={isSubtask ? "subtask" : "default"}
          />

          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePriorityDropdown(task.id);
              }}
              title={`Priority: ${priorityLevels.find((p) => p.level === task.priority)?.label || "None"}`}
              className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
              aria-haspopup="true"
              aria-expanded={isPriorityDropdownOpen}
            >
              <PriorityIconDisplay level={task.priority} />
            </button>
            {isPriorityDropdownOpen && (
              <PriorityDropdown
                taskId={task.id}
                listIndex={listIndex}
                currentPriority={task.priority}
                onSetPriority={handleSetPriority}
                onClose={() => setOpenPriorityDropdown(null)}
              />
            )}
            <button
              onClick={() => handleStartEditing(task)}
              title="Edit task"
              className="p-1 rounded hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <IconEdit size={14} />
            </button>
            <button
              onClick={() => handleDeleteTask(listIndex, task.id)}
              title="Delete task"
              className="p-1 rounded hover:bg-red-100/80 dark:hover:bg-red-900/50 text-red-500 dark:text-red-400 transition-colors"
            >
              <IconTrash size={14} />
            </button>
          </div>
        </div>

        {hasSubtasks && isExpanded && (
          <div className="mt-1 space-y-1 animate-fade-in">
            {task.subtasks
              .sort((a, b) => b.priority - a.priority)
              .map((subtask) => renderTask(subtask, listIndex, level + 1))}
          </div>
        )}

        {level === 0 && (
          <div className={`mt-1 ${indentationClass}`}>
            {addingSubtaskTo === task.id ? (
              <input
                ref={subtaskInputRef}
                id={`subtask-input-${task.id}`}
                type="text"
                onKeyDown={(e) => handleKeyDownTaskInput(e, listIndex, task.id)}
                onBlur={(e) => {
                  if (!e.target.value.trim()) setAddingSubtaskTo(null);
                }}
                className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200"
                placeholder="New subtask..."
                autoFocus
              />
            ) : (
              <button
                onClick={() => {
                  setAddingSubtaskTo(task.id);
                  setTimeout(() => subtaskInputRef.current?.focus(), 0);
                }}
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
  };

  // --- Loading and Empty States ---
  if (loading) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Loading Tasks...</div>;
  }
  if (status === "unauthenticated" && !showPlaceholders) {
    return <div className="p-4 text-center text-slate-500 dark:text-slate-400">Please sign in to manage your tasks.</div>;
  }

  // --- Main Component Render ---
  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-200">My Tasks</h1>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
          {taskLists.length} List{taskLists.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-600 scrollbar-track-transparent">
        {taskLists.length === 0 && !isAddingList && !showPlaceholders && status === "authenticated" && (
          <div className="text-center text-slate-400 dark:text-slate-500 py-10">No task lists yet. Add one below!</div>
        )}

        {taskLists.map((list, listIndex) => (
          <div key={list._id || `list-${listIndex}`} className="mb-6 group/list">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-300">{list.name}</h2>
              <div className="flex-1 mx-3 border-t border-slate-200 dark:border-zinc-700 border-dashed"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-zinc-800/80 backdrop-blur-md px-2 py-1 rounded-full">
                  {getCompletionRatio(list.tasks)}
                </span>
                {!list._id?.startsWith("placeholder-") && (
                  <button
                    onClick={() => handleDeleteList(listIndex)}
                    title={`Delete list "${list.name}"`}
                    className="text-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-1"
                  >
                    <IconTrash size={16} />
                  </button>
                )}
              </div>
            </div>

            {list.tasks
              .sort((a, b) => b.priority - a.priority)
              .map((task) => renderTask(task, listIndex, 0))}

            {list.isAddingTask && (
              <div className="mt-2">
                <input
                  id={`task-input-${listIndex}`}
                  type="text"
                  onKeyDown={(e) => handleKeyDownTaskInput(e, listIndex)}
                  onBlur={(e) => {
                    const inputVal = e.target.value;
                    setTimeout(() => {
                      const currentInput = document.getElementById(`task-input-${listIndex}`);
                      if (currentInput && !inputVal.trim()) {
                        const updatedLists = [...taskLists];
                        if (updatedLists[listIndex]) {
                          updatedLists[listIndex].isAddingTask = false;
                          setTaskLists(updatedLists);
                        }
                      }
                    }, 100);
                  }}
                  className="w-full p-2 bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm text-slate-900 dark:text-slate-200 transition-all duration-200"
                  placeholder="New task..."
                  autoFocus
                />
              </div>
            )}

            {!list.isAddingTask && !list._id?.startsWith("placeholder-") && (
              <button
                onClick={() => {
                  const updatedLists = [...taskLists];
                  if (updatedLists[listIndex]) {
                    updatedLists.forEach((l, idx) => {
                      if (idx !== listIndex) l.isAddingTask = false;
                    });
                    updatedLists[listIndex].isAddingTask = true;
                    setTaskLists(updatedLists);
                    setTimeout(() => document.getElementById(`task-input-${listIndex}`)?.focus(), 0);
                  }
                }}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 text-sm transition-colors duration-200 py-1"
                title="Add task"
              >
                <IconCopyPlus size={14} />
                <span>Add task</span>
              </button>
            )}
          </div>
        ))}

        {isAddingList && (
          <div className="mb-6 mt-4">
            <input
              ref={listNameInputRef}
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={handleAddList}
              onBlur={() => {
                setTimeout(() => {
                  if (listNameInputRef.current && !newListName.trim()) {
                    setIsAddingList(false);
                    setNewListName("");
                  }
                }, 100);
              }}
              className="w-full text-lg font-medium text-slate-700 dark:text-slate-300 bg-transparent border-b-2 border-slate-300/50 dark:border-zinc-600/50 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
              placeholder="New list name..."
              autoFocus
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Press Enter to save or Escape to cancel
            </p>
          </div>
        )}
      </div>

      {!isAddingList && (
        <button
          onClick={() => {
            setIsAddingList(true);
            setTimeout(() => listNameInputRef.current?.focus(), 0);
          }}
          className="mt-4 flex items-center justify-center p-2 w-full bg-slate-50/90 dark:bg-zinc-800/90 backdrop-blur-md rounded-lg border border-slate-200/50 dark:border-zinc-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-zinc-700/80 hover:border-slate-300/70 dark:hover:border-zinc-600/70 transition-all duration-200"
          disabled={status !== "authenticated"}
          title={status !== "authenticated" ? "Sign in to add lists" : "Add a new task list"}
        >
          <IconSquareRoundedPlus2 size={18} className="mr-2" />
          <span className="font-medium">Add new list</span>
        </button>
      )}
    </div>
  );
};

export default Tasks;