import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";
import { checkRateLimit } from "@/lib/checkRateLimit";

interface JournalEntry {
  _id: ObjectId;
  userId: ObjectId;
  date: string; // Stored as 'YYYY-MM-DD' string
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalEntryResponseItem {
  _id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";

function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

const transformEntryForResponse = (
  entry: JournalEntry
): JournalEntryResponseItem => {
  return {
    _id: entry._id.toString(),
    userId: entry.userId.toString(),
    date: entry.date,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(
        `Error in GET /api/features/journal: Invalid session user ID format - ${userId}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const rateLimitResponse = await checkRateLimit(
      userId,
      `/api/features/journal/GET`,
      20
    );
    if (rateLimitResponse) return rateLimitResponse;

    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const entriesArray: JournalEntry[] = await journalCollection
      .find({ userId: userObjectId })
      .sort({ date: -1 })
      .toArray();

    const responseEntries = entriesArray.map(transformEntryForResponse);

    return NextResponse.json({ entries: responseEntries }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/journal:", error);
    return NextResponse.json(
      { message: "Failed to retrieve journal entries" },
      { status: 500 }
    );
  }
}
