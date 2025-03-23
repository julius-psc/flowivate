import React, { useState } from 'react';
import { IconSquareRoundedPlus2, IconCopyPlus, IconTrash } from '@tabler/icons-react';
import Checkbox from '../recyclable/Checkbox';
import styles from '../../../stylesheets/Tasks.module.css';

interface Task {
  name: string;
  completed: boolean;
}

interface Category {
  name: string;
  tasks: Task[];
  isAddingTask?: boolean;
}

const Tasks: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([
    {
      name: 'Work',
      tasks: [
        { name: 'Task 1', completed: true },
        { name: 'Task 2', completed: false },
        { name: 'Task 3', completed: false },
      ],
    },
    {
      name: 'Personal',
      tasks: [
        { name: 'Task 1', completed: true },
        { name: 'Task 2', completed: false },
        { name: 'Task 3', completed: false },
      ],
    },
  ]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const addCategory = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newCategoryName.trim()) {
      setCategories([...categories, { name: newCategoryName.trim(), tasks: [] }]);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } else if (e.key === 'Escape') {
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  };

  const deleteCategory = (categoryIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories.splice(categoryIndex, 1);
    setCategories(updatedCategories);
  };

  const deleteTask = (categoryIndex: number, taskIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].tasks.splice(taskIndex, 1);
    setCategories(updatedCategories);
  };

  const toggleTaskInput = (categoryIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].isAddingTask = !updatedCategories[categoryIndex].isAddingTask;
    setCategories(updatedCategories);
  };

  const saveNewTask = (categoryIndex: number, value: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      const updatedCategories = [...categories];
      updatedCategories[categoryIndex].tasks.push({ name: value.trim(), completed: false });
      updatedCategories[categoryIndex].isAddingTask = false;
      setCategories(updatedCategories);
    }
  };

  const toggleTaskCompletion = (categoryIndex: number, taskIndex: number) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].tasks[taskIndex].completed =
      !updatedCategories[categoryIndex].tasks[taskIndex].completed;
    setCategories(updatedCategories);
  };

  const getCompletionRatio = (tasks: Task[]): string => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.completed).length;
    return `${completedTasks}/${totalTasks}`;
  };

  return (
    <div className="p-4 max-w-160 my-2 bg-white dark:bg-gray-800 rounded-xl relative border border-gray-100 dark:border-gray-700">
      <div className="flex justify-end">
        <p className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 font-medium opacity-60 mb-6 px-3 rounded-md">
          My tasks
        </p>
      </div>

      <div className={`max-h-96 overflow-y-auto pr-2 ${styles.customScrollbar}`}>
        {categories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-8">
            <div className="flex items-center justify-between mb-3 group">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                {category.name}
              </h2>
              <div className="flex-1 mx-3 border-t border-gray-200 dark:border-gray-600"></div>
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full mr-2">
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
                className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg mb-3 duration-200 group border border-gray-100 dark:border-gray-700"
              >
                <div className="flex-grow">
                  <Checkbox
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(categoryIndex, taskIndex)}
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
                onKeyPress={(e) => saveNewTask(categoryIndex, e.currentTarget.value, e)}
                className="w-full p-3 mb-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 dark:text-gray-200"
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

        {/* Inline Add Category Input */}
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

      {/* Add Category Button */}
      {!isAddingCategory && (
        <button
          onClick={() => setIsAddingCategory(true)}
          className="cursor-pointer flex items-center p-3 mb-4 w-[97%] bg-gray-50 dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <IconSquareRoundedPlus2 className="h-5 opacity-70 w-5 mr-2" />
          <span className="font-medium opacity-70">Add new category</span>
        </button>
      )}
    </div>
  );
};

export default Tasks;