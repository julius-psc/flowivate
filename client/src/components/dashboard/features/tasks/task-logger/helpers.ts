import type { Task } from "@/types/taskTypes";

export const createNewTask = (name: string): Task => ({
  id: crypto.randomUUID(),
  name: name.trim(),
  completed: false,
  priority: 0,
  subtasks: [],
});

export const findAndUpdateTask = (
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

export const findAndDeleteTask = (
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

export const getCompletionRatio = (tasks: Task[] = []): string => {
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