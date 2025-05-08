import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
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

const DEFAULT_DB_NAME = "Flowivate";
const MAX_MOOD_STRING_LENGTH = 100;

function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

const transformMoodForResponse = (moodDoc: MoodDocument | null): MoodResponse | null => {
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
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(`Error in GET /api/features/mood: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const moodsCollection = db.collection<MoodDocument>("moods");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const moodDocsArray = await moodsCollection
      .find({
        userId: userObjectId,
        timestamp: { $gte: startOfMonth }
      })
      .sort({ timestamp: -1 })
      .toArray();

    const responseMoods = moodDocsArray.map(transformMoodForResponse).filter(m => m !== null) as MoodResponse[];

    return NextResponse.json({ moods: responseMoods }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/features/mood:", error);
    return NextResponse.json({ message: "Failed to retrieve mood data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(`Error in POST /api/features/mood: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (parseError) {
      console.error("Error in POST /api/features/mood: Invalid JSON payload", parseError);
      return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    const { mood, timestamp } = requestBody;

    if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
        return NextResponse.json({ message: "Mood is required and must be a non-empty string." }, { status: 400 });
    }
    if (mood.trim().length > MAX_MOOD_STRING_LENGTH) {
        return NextResponse.json({ message: `Mood exceeds maximum length of ${MAX_MOOD_STRING_LENGTH} characters.` }, { status: 400 });
    }
    if (!timestamp) {
        return NextResponse.json({ message: "Timestamp is required." }, { status: 400 });
    }

    let moodDate: Date;
    try {
        moodDate = new Date(timestamp);
        if (isNaN(moodDate.getTime())) {
            throw new Error("Invalid date format for timestamp");
        }
    } catch (dateError) {
        console.error("Error in POST /api/features/mood: Invalid timestamp format", { timestampProvided: timestamp, error: dateError });
        return NextResponse.json({ message: "Invalid timestamp format provided." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const moodsCollection = db.collection<MoodDocument>("moods");

    const startOfDay = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate(), 23, 59, 59, 999);

    const moodToSet = mood.trim();
    const moodEntryData = {
      mood: moodToSet,
      userId: userObjectId,
      timestamp: moodDate,
    };

    const result = await moodsCollection.findOneAndUpdate(
      {
        userId: userObjectId,
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      },
      { $set: moodEntryData, $setOnInsert: { _id: new ObjectId() } }, // Ensure _id on insert
      { upsert: true, returnDocument: "after" }
    ) as unknown as import("mongodb").ModifyResult<MoodDocument>;
    
    if (!result.value) {
       console.error(`Error in POST /api/features/mood: Database operation failed for user ${userId}. findOneAndUpdate returned null.`);
       return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    }
    
    const upsertedMoodDoc = result.value;
    const responseMood = transformMoodForResponse(upsertedMoodDoc);
    const finalStatusCode = result.lastErrorObject?.upserted ? 201 : (result.lastErrorObject?.updatedExisting ? 200 : 200);


    return NextResponse.json({ message: finalStatusCode === 201 ? "Mood record created." : "Mood record updated.", entry: responseMood }, { status: finalStatusCode });

  } catch (error) {
    console.error("Error in POST /api/features/mood:", error);
    return NextResponse.json({ message: "Failed to save mood data" }, { status: 500 });
  }
}