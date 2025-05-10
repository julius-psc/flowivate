import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const COLLECTION_NAME = "task_lists";

const MAX_NAME_LENGTH = 255;
const MAX_TASK_NAME_LENGTH = 255;

interface TaskItem {
  _id: ObjectId;
  name: string;
  completed: boolean;
  priority?: number;
  subtasks?: TaskItem[];
}

interface TaskListDocument {
  _id: ObjectId;
  userId: ObjectId;
  name: string;
  tasks: TaskItem[];
  createdAt: Date;
  updatedAt?: Date;
}

interface TaskListResponse {
  _id: string;
  userId: string;
  name: string;
  tasks: {
    _id: string;
    name: string;
    completed: boolean;
    priority: number;
    subtasks: TaskListResponse["tasks"];
  }[];
  createdAt: string;
  updatedAt?: string;
}

function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

async function getUserObjectId(): Promise<ObjectId | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  if (!isValidObjectId(session.user.id)) {
    console.error(`Invalid user ID format in session: ${session.user.id}`);
    return null;
  }
  try {
    return new ObjectId(session.user.id);
  } catch (error) {
    console.error("Error creating ObjectId from session user ID:", session.user.id, error);
    return null;
  }
}

const transformTaskListForResponse = (doc: TaskListDocument | null): TaskListResponse | null => {
  if (!doc) return null;
  const transformTask = (task: TaskItem): TaskListResponse["tasks"][number] => ({
    _id: task._id.toString(),
    name: task.name,
    completed: task.completed,
    priority: task.priority || 0,
    subtasks: task.subtasks ? task.subtasks.map(transformTask) : [],
  });
  return {
    _id: doc._id.toString(),
    userId: doc.userId.toString(),
    name: doc.name,
    tasks: doc.tasks.map(transformTask),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt ? doc.updatedAt.toISOString() : undefined,
  };
};

export async function GET() {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const taskListsCollection = db.collection<TaskListDocument>(COLLECTION_NAME);

    const taskListDocs = await taskListsCollection.find({ userId: userObjectId }).sort({ createdAt: -1 }).toArray();
    const responseTaskLists = taskListDocs.map(transformTaskListForResponse).filter(tl => tl !== null) as TaskListResponse[];

    return NextResponse.json({ taskLists: responseTaskLists }, { status: 200 });
  } catch (error) {
    console.error(`Error in GET /api/features/tasks:`, error);
    return NextResponse.json({ message: "Failed to retrieve task lists" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON in POST /api/features/tasks:`, jsonError);
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const { name, tasks } = body;

    if (typeof name !== "string" || name.trim() === "" || name.trim().length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { message: `Name is required, must be a non-empty string, and not exceed ${MAX_NAME_LENGTH} characters.` },
        { status: 400 }
      );
    }
    if (!Array.isArray(tasks)) {
      return NextResponse.json({ message: "Tasks must be an array." }, { status: 400 });
    }

    const processedTasks: TaskItem[] = tasks.map(
      (task: { _id?: string; name: string; completed?: boolean; priority?: number; subtasks?: TaskListResponse["tasks"] }) => {
        if (!task || typeof task.name !== "string" || task.name.trim() === "" || task.name.trim().length > MAX_TASK_NAME_LENGTH) {
          throw new Error(
            `Invalid task structure: Task name is required, must be a non-empty string, and not exceed ${MAX_TASK_NAME_LENGTH} characters.`
          );
        }
        const processedSubtasks = task.subtasks && Array.isArray(task.subtasks)
          ? task.subtasks.map((subtask: { _id?: string; name: string; completed?: boolean; priority?: number; subtasks?: TaskListResponse["tasks"] }) => {
              if (
                !subtask ||
                typeof subtask.name !== "string" ||
                subtask.name.trim() === "" ||
                subtask.name.trim().length > MAX_TASK_NAME_LENGTH
              ) {
                throw new Error(
                  `Invalid subtask structure: Subtask name is required, must be a non-empty string, and not exceed ${MAX_TASK_NAME_LENGTH} characters.`
                );
              }
              return {
                _id: new ObjectId(),
                name: subtask.name.trim(),
                completed: typeof subtask.completed === "boolean" ? subtask.completed : false,
                priority: typeof subtask.priority === "number" ? Math.max(0, Math.min(3, subtask.priority)) : 0,
                subtasks: [],
              };
            })
          : [];
        return {
          _id: new ObjectId(),
          name: task.name.trim(),
          completed: typeof task.completed === "boolean" ? task.completed : false,
          priority: typeof task.priority === "number" ? Math.max(0, Math.min(3, task.priority)) : 0,
          subtasks: processedSubtasks,
        };
      }
    );

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const taskListsCollection = db.collection<TaskListDocument>(COLLECTION_NAME);

    const newTaskListData: Omit<TaskListDocument, "_id"> = {
      name: name.trim(),
      tasks: processedTasks,
      userId: userObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await taskListsCollection.insertOne(newTaskListData as TaskListDocument);
    const createdTaskList = await taskListsCollection.findOne({ _id: result.insertedId });

    return NextResponse.json(transformTaskListForResponse(createdTaskList), { status: 201 });
  } catch (error: unknown) {
    console.error(`Error in POST /api/features/tasks:`, error);
    if (error instanceof Error && error.message.startsWith("Invalid task structure")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to create task list" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON in PUT /api/features/tasks:`, jsonError);
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const { id: taskListIdString, name, tasks } = body;

    if (!taskListIdString || !isValidObjectId(taskListIdString)) {
      return NextResponse.json({ message: "Valid task list ID ('id') is required." }, { status: 400 });
    }
    const taskListObjectId = ObjectId.createFromHexString(taskListIdString);

    const updateFields: Partial<Pick<TaskListDocument, "name" | "tasks" | "updatedAt">> = {};
    let hasUpdates = false;

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "" || name.trim().length > MAX_NAME_LENGTH) {
        return NextResponse.json(
          { message: `Name must be a non-empty string and not exceed ${MAX_NAME_LENGTH} characters.` },
          { status: 400 }
        );
      }
      updateFields.name = name.trim();
      hasUpdates = true;
    }

    if (tasks !== undefined) {
      if (!Array.isArray(tasks)) {
        return NextResponse.json({ message: "Tasks must be an array." }, { status: 400 });
      }
      updateFields.tasks = tasks.map(
        (task: { _id?: string; name: string; completed?: boolean; priority?: number; subtasks?: TaskListResponse["tasks"] }) => {
          if (!task || typeof task.name !== "string" || task.name.trim() === "" || task.name.trim().length > MAX_TASK_NAME_LENGTH) {
            throw new Error(
              `Invalid task structure: Task name is required, must be a non-empty string, and not exceed ${MAX_TASK_NAME_LENGTH} characters.`
            );
          }
          const existingTaskId = task._id && isValidObjectId(task._id) ? new ObjectId(task._id) : new ObjectId();
          const processedSubtasks = task.subtasks && Array.isArray(task.subtasks)
            ? task.subtasks.map((subtask: { _id?: string; name: string; completed?: boolean; priority?: number; subtasks?: TaskListResponse["tasks"] }) => {
                if (
                  !subtask ||
                  typeof subtask.name !== "string" ||
                  subtask.name.trim() === "" ||
                  subtask.name.trim().length > MAX_TASK_NAME_LENGTH
                ) {
                  throw new Error(
                    `Invalid subtask structure: Subtask name is required, must be a non-empty string, and not exceed ${MAX_TASK_NAME_LENGTH} characters.`
                  );
                }
                const subtaskId = subtask._id && isValidObjectId(subtask._id) ? new ObjectId(subtask._id) : new ObjectId();
                return {
                  _id: subtaskId,
                  name: subtask.name.trim(),
                  completed: typeof subtask.completed === "boolean" ? subtask.completed : false,
                  priority: typeof subtask.priority === "number" ? Math.max(0, Math.min(3, subtask.priority)) : 0,
                  subtasks: subtask.subtasks
                    ? subtask.subtasks.map((nestedSubtask) => ({
                        _id: nestedSubtask._id && isValidObjectId(nestedSubtask._id) ? new ObjectId(nestedSubtask._id) : new ObjectId(),
                        name: nestedSubtask.name.trim(),
                        completed: typeof nestedSubtask.completed === "boolean" ? nestedSubtask.completed : false,
                        priority: typeof nestedSubtask.priority === "number" ? Math.max(0, Math.min(3, nestedSubtask.priority)) : 0,
                        subtasks: [],
                      }))
                    : [],
                };
              })
            : [];
          return {
            _id: existingTaskId,
            name: task.name.trim(),
            completed: typeof task.completed === "boolean" ? task.completed : false,
            priority: typeof task.priority === "number" ? Math.max(0, Math.min(3, task.priority)) : 0,
            subtasks: processedSubtasks,
          };
        }
      );
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ message: "No valid fields provided for update." }, { status: 400 });
    }
    updateFields.updatedAt = new Date();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const taskListsCollection = db.collection<TaskListDocument>(COLLECTION_NAME);

    const result = await taskListsCollection.updateOne(
      { _id: taskListObjectId, userId: userObjectId },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Task list not found or access denied" }, { status: 404 });
    }

    const updatedTaskList = await taskListsCollection.findOne({ _id: taskListObjectId, userId: userObjectId });
    return NextResponse.json(transformTaskListForResponse(updatedTaskList), { status: 200 });
  } catch (error: unknown) {
    console.error(`Error in PUT /api/features/tasks:`, error);
    if (error instanceof Error && error.message.startsWith("Invalid task structure")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Failed to update task list" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON in DELETE /api/features/tasks:`, jsonError);
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const { id: taskListIdString } = body;

    if (!taskListIdString || !isValidObjectId(taskListIdString)) {
      return NextResponse.json({ message: "Valid task list ID ('id') is required in the request body." }, { status: 400 });
    }
    const taskListObjectId = new ObjectId(taskListIdString);

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const taskListsCollection = db.collection<TaskListDocument>(COLLECTION_NAME);

    const result = await taskListsCollection.deleteOne({
      _id: taskListObjectId,
      userId: userObjectId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Task list not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task list deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/features/tasks:`, error);
    return NextResponse.json({ message: "Failed to delete task list" }, { status: 500 });
  }
}