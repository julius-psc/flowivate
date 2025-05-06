import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb"; // Adjust path if needed
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";

const DB_NAME = process.env.MONGODB_DB || "Flowivate"; // Use env variable or default
const COLLECTION_NAME = "task_lists"; // Renamed collection

// Helper function to get user ObjectId from session
async function getUserObjectId(): Promise<ObjectId | null> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return null;
    }
    try {
        return new ObjectId(session.user.id);
    } catch (error) {
        console.log(error)
        console.error('Invalid user ID format:', session.user.id);
        return null;
    }
}

// GET /api/features/tasks - Fetch all task lists for the user
export async function GET() {
    try {
        const userObjectId = await getUserObjectId();
        if (!userObjectId) {
            return NextResponse.json({ message: "Unauthorized or invalid user ID" }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const taskListsCollection = db.collection(COLLECTION_NAME);

        // Find task lists associated with the userId
        const taskLists = await taskListsCollection.find({ userId: userObjectId }).toArray();
        return NextResponse.json(taskLists, { status: 200 });

    } catch (error) {
        console.error(`Error in GET /api/features/tasks:`, error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// POST /api/features/tasks - Create a new task list for the user
export async function POST(request: Request) {
    try {
        const userObjectId = await getUserObjectId();
        if (!userObjectId) {
            return NextResponse.json({ message: "Unauthorized or invalid user ID" }, { status: 401 });
        }

        const { name, tasks } = await request.json();

        // Basic validation
        if (typeof name !== 'string' || name.trim().length === 0 || !Array.isArray(tasks)) {
            return NextResponse.json({ message: "Valid name and tasks array are required" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const taskListsCollection = db.collection(COLLECTION_NAME);

        const result = await taskListsCollection.insertOne({
            name: name.trim(),
            tasks, // Assume frontend sends correctly structured tasks/subtasks
            userId: userObjectId, // Link to the user ID
            createdAt: new Date(), // Add creation timestamp
        });

        return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
    } catch (error) {
        console.error(`Error in POST /api/features/tasks:`, error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/features/tasks - Update an existing task list (e.g., tasks array or name)
export async function PUT(request: Request) {
    try {
        const userObjectId = await getUserObjectId();
        if (!userObjectId) {
            return NextResponse.json({ message: "Unauthorized or invalid user ID" }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updateData } = body; // Separate id from fields to update

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid task list ID provided" }, { status: 400 });
        }

        // Validate updateData fields
        if (updateData.tasks && !Array.isArray(updateData.tasks)) {
             return NextResponse.json({ message: "Invalid tasks format" }, { status: 400 });
        }
        if (updateData.name && (typeof updateData.name !== 'string' || updateData.name.trim().length === 0)) {
             return NextResponse.json({ message: "Invalid name format" }, { status: 400 });
        }
        if (updateData.name) updateData.name = updateData.name.trim(); // Trim name if provided

        // Add an updatedAt timestamp
        updateData.updatedAt = new Date();

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const taskListsCollection = db.collection(COLLECTION_NAME);

        // Ensure user owns the task list they are trying to update
        const result = await taskListsCollection.updateOne(
            { _id: new ObjectId(id), userId: userObjectId }, // Match ID and userId
            { $set: updateData } // Update provided fields (e.g., tasks, name)
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ message: "Task list not found or not authorized" }, { status: 404 });
        }

        return NextResponse.json({ modified: result.modifiedCount }, { status: 200 });
    } catch (error) {
        console.error(`Error in PUT /api/features/tasks:`, error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/features/tasks - Delete a task list
export async function DELETE(request: Request) {
    try {
        const userObjectId = await getUserObjectId();
        if (!userObjectId) {
            return NextResponse.json({ message: "Unauthorized or invalid user ID" }, { status: 401 });
        }

        const { id } = await request.json(); // Task list ID to delete

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid task list ID provided" }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db(DB_NAME);
        const taskListsCollection = db.collection(COLLECTION_NAME);

        // Ensure user owns the task list they are trying to delete
        const result = await taskListsCollection.deleteOne({
            _id: new ObjectId(id),
            userId: userObjectId, // Match ID and userId
        });

        if (result.deletedCount === 0) {
            return NextResponse.json({ message: "Task list not found or not authorized" }, { status: 404 });
        }

        return NextResponse.json({ deleted: result.deletedCount }, { status: 200 });
    } catch (error) {
        console.error(`Error in DELETE /api/features/tasks:`, error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}