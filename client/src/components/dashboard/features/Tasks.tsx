"use client";

import React, { useState, useEffect } from "react";
import {
  IconSquareRoundedPlus2,
  IconCopyPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import Checkbox from "../recyclable/Checkbox";
import styles from "../../../stylesheets/Tasks.module.css";

interface Task {
  name: string;
  completed: boolean;
}

interface Category {
  _id?: string;
  name: string;
  tasks: Task[];
  isAddingTask?: boolean;
}

const Tasks: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  // Fetch categories on component mount, filtered by user ID
  useEffect(() => {
    const fetchCategories = async () => {
      if (status === "loading" || !session?.user?.id) return;

      try {
        const res = await fetch("/api/features/tasks", {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [session, status]);

  const addCategory = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newCategoryName.trim() && session?.user?.id) {
      const newCategory = { name: newCategoryName.trim(), tasks: [] };
      try {
        const res = await fetch("/api/features/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCategory),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to add category");
        const { id } = await res.json();
        setCategories([...categories, { ...newCategory, _id: id }]);
        setNewCategoryName("");
        setIsAddingCategory(false);
      } catch (error) {
        console.error("Error adding category:", error);
      }
    } else if (e.key === "Escape") {
      setIsAddingCategory(false);
      setNewCategoryName("");
    }
  };

  const deleteCategory = async (categoryIndex: number) => {
    const categoryId = categories[categoryIndex]._id;
    const updatedCategories = [...categories];
    updatedCategories.splice(categoryIndex, 1);
    setCategories(updatedCategories); // Optimistic update
    try {
      const res = await fetch("/api/features/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete category");
    } catch (error) {
      console.error("Error deleting category:", error);
      setCategories(categories); // Rollback on failure
    }
  };

  const deleteTask = async (categoryIndex: number, taskIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].tasks.splice(taskIndex, 1);
    setCategories(updatedCategories); // Optimistic update
    try {
      const res = await fetch("/api/features/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: categories[categoryIndex]._id,
          tasks: updatedCategories[categoryIndex].tasks,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      setCategories(categories); // Rollback on failure
    }
  };

  const toggleTaskInput = (categoryIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].isAddingTask =
      !updatedCategories[categoryIndex].isAddingTask;
    setCategories(updatedCategories);
  };

  const saveNewTask = async (
    categoryIndex: number,
    value: string,
    e: React.KeyboardEvent
  ) => {
    if (e.key === "Enter" && value.trim()) {
      const updatedCategories = [...categories];
      const newTask = { name: value.trim(), completed: false };
      updatedCategories[categoryIndex].tasks.push(newTask);
      updatedCategories[categoryIndex].isAddingTask = false;
      setCategories(updatedCategories); // Optimistic update
      try {
        const res = await fetch("/api/features/tasks", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: categories[categoryIndex]._id,
            tasks: updatedCategories[categoryIndex].tasks,
          }),
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to save task");
      } catch (error) {
        console.error("Error saving task:", error);
        setCategories(categories); // Rollback on failure
      }
    }
  };

  const toggleTaskCompletion = async (
    categoryIndex: number,
    taskIndex: number
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].tasks[taskIndex].completed =
      !updatedCategories[categoryIndex].tasks[taskIndex].completed;
    setCategories(updatedCategories); // Optimistic update
    try {
      const res = await fetch("/api/features/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: categories[categoryIndex]._id,
          tasks: updatedCategories[categoryIndex].tasks,
        }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update task completion");
    } catch (error) {
      console.error("Error toggling task completion:", error);
      setCategories(categories); // Rollback on failure
    }
  };

  const getCompletionRatio = (tasks: Task[]): string => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    return `${completedTasks}/${totalTasks}`;
  };

  if (status === "loading") return <div>Loading session...</div>;
  if (!session) return <div>Please sign in to view tasks</div>;
  if (loading) return <div>Loading tasks...</div>;

  return (
    <div className="p-4 bg-white dark:bg-bg-dark rounded-lg relative border border-gray-100 dark:border-gray-700 flex flex-col h-full">
      <div className="flex justify-end">
        <p className="bg-primary-white dark:bg-primary-black-dark text-gray-900 dark:text-gray-200 font-medium opacity-60 mb-6 px-3 rounded-md">
          My tasks
        </p>
      </div>

      <div
        className={`flex-1 overflow-y-auto pr-2 max-h-148 ${styles.customScrollbar}`}
      >
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <div className="flex items-center justify-between mb-3 group">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {category.name}
              </h2>
              <div className="flex-1 mx-3 border-t border-gray-200 dark:border-gray-800"></div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full mr-2">
                  {getCompletionRatio(category.tasks)}
                </span>
                <button
                  onClick={() => deleteCategory(categoryIndex)}
                  className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity duration-200 text-red-500"
                >
                  <IconTrash size={18} />
                </button>
              </div>
            </div>

            {category.tasks.map((task, taskIndex) => (
              <div
                key={taskIndex}
                className="flex items-center p-3 bg-white dark:bg-transparent rounded-lg mb-3 duration-200 group border border-gray-100 dark:border-gray-800"
              >
                <div className="flex-grow">
                  <Checkbox
                    checked={task.completed}
                    onChange={() =>
                      toggleTaskCompletion(categoryIndex, taskIndex)
                    }
                    label={task.name}
                  />
                </div>
                <button
                  onClick={() => deleteTask(categoryIndex, taskIndex)}
                  className="opacity-0 group-hover:opacity-70 hover:opacity-100 transition-opacity duration-200 text-red-500"
                >
                  <IconTrash size={16} />
                </button>
              </div>
            ))}

            {category.isAddingTask && (
              <input
                type="text"
                onKeyDown={(e) =>
                  saveNewTask(categoryIndex, e.currentTarget.value, e)
                }
                className="w-full p-3 mb-3 bg-gray-50 dark:bg-bg-dark rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 dark:text-gray-200"
                placeholder="Enter new task (press Enter to save)..."
                autoFocus
              />
            )}

            <button
              onClick={() => toggleTaskInput(categoryIndex)}
              className="flex items-center text-gray-600 dark:text-gray-400 text-sm mt-2 group"
            >
              <div className="cursor-pointer flex items-center opacity-30 group-hover:opacity-80 transition-all duration-200">
                <IconCopyPlus className="h-5 w-5 mr-1 transform group-hover:scale-110 transition-transform duration-200" />
                <span className="font-medium">Add a new task</span>
              </div>
            </button>
          </div>
        ))}

        {isAddingCategory && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={addCategory}
                className="text-lg font-semibold text-gray-700 dark:text-gray-300 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:outline-none transition-colors duration-200 w-full"
                placeholder="New category name..."
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Press Enter to save or Escape to cancel
            </p>
          </div>
        )}
      </div>

      {!isAddingCategory && (
        <button
          onClick={() => setIsAddingCategory(true)}
          className="mt-4 cursor-pointer flex items-center p-3 w-[97%] bg-gray-50 dark:bg-transparent rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-primary-black transition-colors duration-200"
        >
          <IconSquareRoundedPlus2 className="h-5 opacity-70 w-5 mr-2" />
          <span className="font-medium opacity-70">Add new category</span>
        </button>
      )}
    </div>
  );
};

export default Tasks;