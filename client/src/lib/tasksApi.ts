import type { Task, TaskList } from "@/types/taskTypes"; // Ensure this path is correct

const API_BASE_URL = "/api/features/tasks";

// Helper to map an API task list (which contains simple tasks) to the frontend TaskList type
const mapApiListToFrontendList = (apiList: { _id: string; name?: string; tasks?: { _id: string; name?: string; completed?: boolean }[] }): TaskList => {
  if (!apiList || typeof apiList._id === 'undefined') {
    // Handle cases where apiList might be undefined or not what's expected
    // This could happen if an API call unexpectedly fails or returns an malformed list
    console.error("mapApiListToFrontendList received invalid apiList:", apiList);
    // Return a default or minimal TaskList structure to prevent further errors
    return {
      _id: `invalid-list-${crypto.randomUUID()}`,
      name: "Error: Invalid List Data",
      tasks: [],
    };
  }
  return {
    _id: apiList._id,
    name: apiList.name || "Unnamed List",
    // apiList.tasks from the backend are simple objects: { _id, name, completed }
    tasks: (apiList.tasks || []).map(
      (apiSimpleTask: { _id: string; name?: string; completed?: boolean }): Task => {
        if (!apiSimpleTask || typeof apiSimpleTask._id === 'undefined') {
            console.error("mapApiListToFrontendList found invalid apiSimpleTask:", apiSimpleTask, "within list:", apiList._id);
            return {
                id: `invalid-task-${crypto.randomUUID()}`,
                name: "Error: Invalid Task Data",
                completed: false,
                priority: 0,
                subtasks: [],
            };
        }
        return {
            id: apiSimpleTask._id, // API's task._id becomes frontend's Task.id
            name: apiSimpleTask.name || "",
            completed: apiSimpleTask.completed || false,
            priority: 0, // Default: Backend's TaskItem in list doesn't store priority
            subtasks: [],  // Default: Backend's TaskItem in list doesn't store subtasks
        };
      }
    ),
    // If your TaskList type in taskTypes.ts includes createdAt/updatedAt, uncomment and map them:
    // createdAt: apiList.createdAt,
    // updatedAt: apiList.updatedAt,
  };
};

/** Fetches all task lists for the logged-in user */
export const getTaskLists = async (): Promise<TaskList[]> => {
  const res = await fetch(API_BASE_URL, { credentials: "include" });
  if (!res.ok) {
    let errorMessage = `Failed to fetch task lists: ${res.status} ${res.statusText}`;
    try {
      const errorData = await res.json();
      errorMessage += ` - ${errorData.message || 'No additional error message from API'}`;
    } catch { }
    throw new Error(errorMessage);
  }
  const responseJson = await res.json();

  // The API GET /api/features/tasks returns { taskLists: [...] }
  if (!responseJson || !Array.isArray(responseJson.taskLists)) {
    console.warn("API response for task lists is not in the expected format (expected { taskLists: Array }):", responseJson);
    return []; // Return empty array to prevent further errors
  }
  return responseJson.taskLists.map(mapApiListToFrontendList);
};

/** Adds a new task list */
export const addTaskList = async (newListData: { name: string }): Promise<TaskList> => {
    const payload = {
      name: newListData.name.trim(),
      tasks: [] // Backend POST for lists expects a 'tasks' array; it will process these into TaskItems.
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
            errorMessage += ` - ${errorData.message || 'No additional error message from API'}`;
        } catch { }
        throw new Error(errorMessage);
    }
    const newApiList = await res.json(); // API returns the full new task list object
    return mapApiListToFrontendList(newApiList); // Map it to the frontend TaskList type
};

/**
 * Updates tasks or name within a specific task list.
 * Note: The current backend PUT handler for lists (`/api/features/tasks`)
 * simplifies tasks to store only `{ _id, name, completed }` in the `TaskListDocument.tasks` array.
 * This means `priority` and `subtasks` sent from the client for tasks within the list
 * are NOT persisted to the database via this endpoint.
 */
export const updateTaskList = async (updateData: { id: string; tasks?: Task[]; name?: string }): Promise<TaskList> => {
    const { id: listId, tasks, name } = updateData;
    if (!listId) throw new Error("Task list ID is required for update.");

    const payload: { id: string; name?: string; tasks?: { _id: string; name: string; completed: boolean }[] } = { id: listId };
    if (name !== undefined) {
        payload.name = name.trim();
    }

    if (tasks !== undefined) {
        // Map frontend Task objects to the simpler structure the backend PUT expects for TaskList.tasks.
        // The backend will use task._id to identify existing tasks or create new ones.
        // Frontend Task.id (which is backend's task._id) is sent as _id.
        payload.tasks = tasks.map(task => ({
            _id: task.id,
            name: task.name,
            completed: task.completed,
            // Properties like task.priority and task.subtasks are sent,
            // but the current backend PUT /api/features/tasks will not persist them
            // into the TaskListDocument.tasks array members.
        }));
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
            errorMessage += ` - ${errorData.message || 'No additional error message from API'}`;
        } catch {}
        throw new Error(errorMessage);
    }
    const updatedApiList = await res.json(); // API returns the full updated task list object
    return mapApiListToFrontendList(updatedApiList); // Map it to the frontend TaskList type
};

/** Deletes a task list */
export const deleteTaskList = async (listId: string): Promise<{ message: string }> => {
    if (!listId) throw new Error("Task list ID is required for deletion.");

    const res = await fetch(API_BASE_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId }), // Backend DELETE route expects { id: listId }
        credentials: "include",
    });

    const responseData = await res.json(); // Backend returns { message: "..." } on success/failure

    if (!res.ok) {
        const message = responseData?.message || `Failed to delete task list ${listId}`;
        // Combine status text with API message for more context
        throw new Error(`${message} (Status: ${res.status} ${res.statusText})`);
    }
    return responseData; // e.g., { message: "Task list deleted successfully" }
};