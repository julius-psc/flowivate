import { Task, TaskList } from "@/types/taskTypes";

const API_BASE_URL = "/api/features/tasks"; 

// --- Task List Operations ---

/** Fetches all task lists for the logged-in user */
export const getTaskLists = async (): Promise<TaskList[]> => {
  const res = await fetch(API_BASE_URL, { credentials: "include" });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({})); // Try to get error details
    throw new Error(`Failed to fetch task lists: ${res.status} ${res.statusText} ${errorData.message || ''}`);
  }
  const data = await res.json();
   // Add validation or transformation if necessary, similar to your useEffect
   if (!Array.isArray(data)) {
    console.warn("API did not return an array for task lists:", data);
    return []; // Return empty array or throw a more specific error
  }
   // Perform the same kind of mapping/default value setting as in your original fetch
   const processedData = data.map((list: Partial<TaskList>): TaskList => ({
      _id: list._id,
      name: list.name || "Unnamed List",
      // isAddingTask: false, // This is UI state, likely not from API
      tasks: (list.tasks || []).map(
        (task: Partial<Task>): Task => ({
          id: task.id || crypto.randomUUID(), // Should ideally come from DB if persisted
          name: task.name || "",
          completed: task.completed || false,
          priority: typeof task.priority === 'number' ? task.priority : 0,
          subtasks: (task.subtasks || []).map(
            (sub: Partial<Task>): Task => ({
              id: sub.id || crypto.randomUUID(),
              name: sub.name || "",
              completed: sub.completed || false,
              priority: typeof sub.priority === 'number' ? sub.priority : 0,
              subtasks: [], // Assuming subtasks don't have further nesting in API
            })
          ),
        })
      ),
    }));
  return processedData as TaskList[]; // Assert type after processing
};

/** Adds a new task list */
export const addTaskList = async (newListData: { name: string }): Promise<{ id: string }> => {
    // Add empty tasks array before sending
    const payload = { ...newListData, tasks: [] };
    const res = await fetch(API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to add task list: ${res.status} ${res.statusText} ${errorData.message || ''}`);
    }
    return res.json(); // Should return { id: newId }
};

/** Updates tasks (or name) within a specific task list */
export const updateTaskList = async (updateData: { id: string; tasks?: Task[]; name?: string }): Promise<{ modified: number }> => {
    const { id, ...payload } = updateData;
    if (!id) throw new Error("Task list ID is required for update.");

    const res = await fetch(API_BASE_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }), // Send id and fields to update
        credentials: "include",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to update task list ${id}: ${res.status} ${res.statusText} ${errorData.message || ''}`);
    }
    return res.json(); // Should return { modified: count }
};

/** Deletes a task list */
export const deleteTaskList = async (listId: string): Promise<{ deleted: number }> => {
    if (!listId) throw new Error("Task list ID is required for deletion.");

    const res = await fetch(API_BASE_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: listId }),
        credentials: "include",
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(`Failed to delete task list ${listId}: ${res.status} ${res.statusText} ${errorData.message || ''}`);
    }
    return res.json(); // Should return { deleted: count }
};

// Note: The current API updates the *entire* tasks array via PUT.
// If you wanted finer-grained control (e.g., update just one task's completion status),
// you might consider adding dedicated API endpoints like:
// PUT /api/features/tasks/{listId}/tasks/{taskId}
// PATCH /api/features/tasks/{listId}/tasks/{taskId}
// For now, we'll stick to updating the whole list's tasks array as per the provided PUT handler.