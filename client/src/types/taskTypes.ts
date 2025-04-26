export interface Task {
  id: string;
  name: string;
  completed: boolean;
  priority: number;
  subtasks: Task[];
}

export interface TaskList {
  _id?: string;
  name: string;
  tasks: Task[];
  isAddingTask?: boolean;
}