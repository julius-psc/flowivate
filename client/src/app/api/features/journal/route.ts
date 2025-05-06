import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb"; // Adjust path
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

// Define the JournalEntry type (can be shared or redefined)
interface JournalEntry {
  _id: ObjectId;
  userId: ObjectId;
  date: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// GET all journal entries for the logged-in user (optional)
export async function GET() {
  const operation = "GET /api/features/journal";
  console.log(`${operation}: Received request`);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

     const userId = session.user.id;
     if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Use your DB name
    const journalCollection = db.collection<JournalEntry>("journalEntries"); // Use your collection name

    const entries = await journalCollection
      .find({ userId: userObjectId })
      .sort({ date: -1 }) // Sort by date descending (most recent first)
      .toArray();

    console.log(`${operation}: Found ${entries.length} entries for user ${userId}`);
    return NextResponse.json({ entries }, { status: 200 });

  } catch (error) {
    console.error(`Error in ${operation}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST is less necessary if PUT on /[date] handles upsert.
// If you specifically want a POST route only for *creation*,
// you would implement it here, ensuring it doesn't conflict
// with existing entries for the same date.
// export async function POST(request: Request) {
//   // ... implementation similar to BookLogger POST ...
//   // Check if entry for date already exists before inserting
// }