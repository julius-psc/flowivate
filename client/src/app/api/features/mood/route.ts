import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

interface MoodDocument {
  _id: ObjectId;
  userId: ObjectId;
  mood: string;
  timestamp: Date;
}

interface MoodResponse {
  _id: string;
  userId: string;
  mood: string;
  timestamp: string;
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";
const MAX_MOOD_STRING_LENGTH = 100;

function isValidObjectId(id: string): boolean {
  return (
    typeof id === "string" &&
    ObjectId.isValid(id) &&
    new ObjectId(id).toString() === id
  );
}

const transformMoodForResponse = (
  moodDoc: MoodDocument | null
): MoodResponse | null => {
  if (!moodDoc) return null;
  return {
    _id: moodDoc._id.toString(),
    userId: moodDoc.userId.toString(),
    mood: moodDoc.mood,
    timestamp: moodDoc.timestamp.toISOString(),
  };
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(
        `GET /api/features/mood — invalid session user ID: ${userId}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const moodsCollection = db.collection<MoodDocument>("moods");

    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const moodDocs = await moodsCollection
      .find({
        userId: userObjectId,
        timestamp: { $gte: startOfMonth },
      })
      .sort({ timestamp: -1 })
      .toArray();

    // Return a bare array rather than wrapping in { moods: [...] }
    const responseMoods = moodDocs
      .map(transformMoodForResponse)
      .filter((m): m is MoodResponse => m !== null);

    return NextResponse.json(responseMoods, { status: 200 });
  } catch (error) {
    console.error("GET /api/features/mood error:", error);
    return NextResponse.json(
      { message: "Failed to retrieve mood data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(
        `POST /api/features/mood — invalid session user ID: ${userId}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userId);

    interface RequestBody {
      mood: string;
      timestamp: string;
    }
    let body: RequestBody;
    try {
      body = await request.json();
    } catch (e) {
      console.error(
        "POST /api/features/mood — invalid JSON payload",
        e
      );
      return NextResponse.json(
        { message: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { mood, timestamp } = body;
    if (!mood || typeof mood !== "string" || !mood.trim()) {
      return NextResponse.json(
        { message: "Mood is required and must be a non-empty string." },
        { status: 400 }
      );
    }
    if (mood.trim().length > MAX_MOOD_STRING_LENGTH) {
      return NextResponse.json(
        {
          message: `Mood exceeds maximum length of ${MAX_MOOD_STRING_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }
    if (!timestamp) {
      return NextResponse.json(
        { message: "Timestamp is required." },
        { status: 400 }
      );
    }

    let moodDate: Date;
    try {
      moodDate = new Date(timestamp);
      if (isNaN(moodDate.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (e) {
      console.error(
        "POST /api/features/mood — invalid timestamp format",
        e
      );
      return NextResponse.json(
        { message: "Invalid timestamp format provided." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const moodsCollection = db.collection<MoodDocument>("moods");

    // Start/end of the day
    const startOfDay = new Date(
      moodDate.getFullYear(),
      moodDate.getMonth(),
      moodDate.getDate(),
      0,
      0,
      0,
      0
    );
    const endOfDay = new Date(
      moodDate.getFullYear(),
      moodDate.getMonth(),
      moodDate.getDate(),
      23,
      59,
      59,
      999
    );

    // Check existing
    const existing = await moodsCollection.findOne({
      userId: userObjectId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    });

    const docData = {
      userId: userObjectId,
      mood: mood.trim(),
      timestamp: moodDate,
    };

    const result = await moodsCollection.findOneAndUpdate(
      { userId: userObjectId, timestamp: { $gte: startOfDay, $lte: endOfDay } },
      {
        $set: docData,
        $setOnInsert: { _id: new ObjectId() },
      },
      {
        upsert: true,
        returnDocument: "after",
      }
    );

    if (!result) {
      console.error(
        `POST /api/features/mood — upsert returned null for user ${userId}`
      );
      return NextResponse.json(
        { message: "Database operation failed to return document." },
        { status: 500 }
      );
    }

    const entry = transformMoodForResponse(result);
    const statusCode = existing ? 200 : 201;
    const msg = existing ? "Mood record updated." : "Mood record created.";

    return NextResponse.json({ message: msg, entry }, { status: statusCode });
  } catch (error) {
    console.error("POST /api/features/mood outer error:", error);
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to save mood data", error: errMsg },
      { status: 500 }
    );
  }
}
