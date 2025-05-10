import type { Task, TaskList } from "@/types/taskTypes";

const API_BASE_URL = "/api/features/tasks";

const mapApiListToFrontendList = (
  apiList: {
    _id: string;
    name?: string;
    tasks?: { _id: string; name?: string; completed?: boolean; priority?: number; subtasks?: { _id: string; name?: string; completed?: boolean; priority?: number }[] }[];
  }
): TaskList => {
  if (!apiList || typeof apiList._id === "undefined") {
    console.error("mapApiListToFrontendList received invalid apiList:", apiList);
    return {
      _id: `invalid-list-${crypto.randomUUID()}`,
      name: "Error: Invalid List Data",
      tasks: [],
    };
  }
  const mapApiTaskToFrontendTask = (
    apiTask: { _id: string; name?: string; completed?: boolean; priority?: number; subtasks?: { _id: string; name?: string; completed?: boolean; priority?: number }[] }
  ): Task => {
    if (!apiTask || typeof apiTask._id === "undefined") {
      console.error("mapApiListToFrontendList found invalid apiTask:", apiTask, "within list:", apiList._id);
      return {
        id: `invalid-task-${crypto.randomUUID()}`,
        name: "Error: Invalid Task Data",
        completed: false,
        priority: 0,
        subtasks: [],
      };
    }
    return {
      id: apiTask._id,
      name: apiTask.name || "",
      completed: apiTask.completed || false,
      priority: typeof apiTask.priority === "number" ? apiTask.priority : 0,
      subtasks: apiTask.subtasks ? apiTask.subtasks.map(mapApiTaskToFrontendTask) : [],
    };
  };
  return {
    _id: apiList._id,
    name: apiList.name || "Unnamed List",
    tasks: (apiList.tasks || []).map(mapApiTaskToFrontendTask),
  };
};

export const getTaskLists = async (): Promise<TaskList[]> => {
  const res = await fetch(API_BASE_URL, { credentials: "include" });
  if (!res.ok) {
    let errorMessage = `Failed to fetch task lists: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMessage += ` - ${errorData.message || "No additional error message from API"}`;
    } catch {}
    throw new Error(errorMessage);
  }
  const responseJson = await res.json();

  if (!responseJson || !Array.isArray(responseJson.taskLists)) {
    console.warn("API response for task lists is not in the expected format (expected { taskLists: Array }):", responseJson);
    return [];
  }
  return responseJson.taskLists.map(mapApiListToFrontendList);
};

export const addTaskList = async (newListData: { name: string }): Promise<TaskList> => {
  const payload = {
    name: newListData.name.trim(),
    tasks: [],
  };
  const res = await fetch(API_BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    let errorMessage = `Failed to add task list: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMessage += ` - ${errorData.message || "No additional error message from API"}`;
    } catch {}
    throw new Error(errorMessage);
  }
  const newApiList = await res.json();
  return mapApiListToFrontendList(newApiList);
};

export const updateTaskList = async (updateData: { id: string; tasks?: Task[]; name?: string }): Promise<TaskList> => {
  const { id: listId, tasks, name } = updateData;
  if (!listId) throw new Error("Task list ID is required for update.");

  const payload: {
    id: string;
    name?: string;
    tasks?: { _id: string; name: string; completed: boolean; priority: number; subtasks: { _id: string; name?: string; completed?: boolean; priority?: number }[] }[];
  } = { id: listId };
  if (name !== undefined) {
    payload.name = name.trim();
  }

  if (tasks !== undefined) {
    const mapTaskToApi = (task: Task): { _id: string; name: string; completed: boolean; priority: number; subtasks: { _id: string; name?: string; completed?: boolean; priority?: number }[] } => ({
      _id: task.id,
      name: task.name,
      completed: task.completed,
      priority: task.priority,
      subtasks: task.subtasks ? task.subtasks.map(mapTaskToApi) : [],
    });
    payload.tasks = tasks.map(mapTaskToApi);
  }

  const res = await fetch(API_BASE_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    let errorMessage = `Failed to update task list ${listId}: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMessage += ` - ${errorData.message || "No additional error message from API"}`;
    } catch {}
    throw new Error(errorMessage);
  }
  const updatedApiList = await res.json();
  return mapApiListToFrontendList(updatedApiList);
};

export const deleteTaskList = async (listId: string): Promise<{ message: string }> => {
  if (!listId) throw new Error("Task list ID is required for deletion.");

  const res = await fetch(API_BASE_URL, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: listId }),
    credentials: "include",
  });

  const responseData = await res.json();

  if (!res.ok) {
    const message = responseData?.message || `Failed to delete task list ${listId}`;
    throw new Error(`${message} (Status: ${res.status} ${res.statusText})`);
  }
  return responseData;
};