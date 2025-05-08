import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from 'mongodb';

interface SleepDocument {
  _id: ObjectId;
  userId: ObjectId;
  hours: number;
  timestamp: Date;
  createdAt: Date; // Added for differentiating insert vs update
  updatedAt: Date; // Added for differentiating insert vs update
}

interface SleepResponse {
  _id: string;
  userId: string;
  hours: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_DB_NAME = "Flowivate";

function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

const transformSleepRecordForResponse = (recordDoc: SleepDocument | null): SleepResponse | null => {
  if (!recordDoc) return null;
  return {
    _id: recordDoc._id.toString(),
    userId: recordDoc.userId.toString(),
    hours: recordDoc.hours,
    timestamp: recordDoc.timestamp.toISOString(),
    createdAt: recordDoc.createdAt.toISOString(),
    updatedAt: recordDoc.updatedAt.toISOString(),
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
      console.error(`Error in GET /api/features/sleep: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const sleepCollection = db.collection<SleepDocument>("sleep");

    const now = new Date();
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);

    const sleepDocsArray = await sleepCollection
      .find({
        userId: userObjectId,
        timestamp: { $gte: sevenDaysAgo },
      })
      .sort({ timestamp: -1 })
      .toArray();

    const responseRecords = sleepDocsArray.map(transformSleepRecordForResponse).filter(r => r !== null) as SleepResponse[];

    return NextResponse.json({ sleepRecords: responseRecords }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/features/sleep:", error);
    return NextResponse.json({ message: "Failed to retrieve sleep records" }, { status: 500 });
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
      console.error(`Error in POST /api/features/sleep: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (parseError) {
      console.error("Error in POST /api/features/sleep: Invalid JSON payload", parseError);
      return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    const { hours, timestamp } = requestBody;

    if (hours == null || typeof hours !== "number" || hours <= 0 || hours > 24) {
        return NextResponse.json({ message: "Hours must be a positive number between 0 (exclusive) and 24." }, { status: 400 });
    }
    if (!timestamp) {
        return NextResponse.json({ message: "Timestamp is required." }, { status: 400 });
    }

    let sleepDate: Date;
    try {
        sleepDate = new Date(timestamp);
        if (isNaN(sleepDate.getTime())) {
            throw new Error("Invalid date format for timestamp");
        }
    } catch (dateError) {
        console.error("Error in POST /api/features/sleep: Invalid timestamp format", { timestampProvided: timestamp, error: dateError });
        return NextResponse.json({ message: "Invalid timestamp format provided." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const sleepCollection = db.collection<SleepDocument>("sleep");

    const startOfDay = new Date(sleepDate.getFullYear(), sleepDate.getMonth(), sleepDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(sleepDate.getFullYear(), sleepDate.getMonth(), sleepDate.getDate(), 23, 59, 59, 999);

    const now = new Date();
    const filter = {
        userId: userObjectId,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
    };
    const updateOperation = {
        $set: {
            hours: hours,
            timestamp: sleepDate,
            updatedAt: now,
        },
        $setOnInsert: {
            _id: new ObjectId(), // Generate _id on insert
            userId: userObjectId,
            createdAt: now,
        }
    };

    const result = await sleepCollection.findOneAndUpdate(
      filter,
      updateOperation,
      { upsert: true, returnDocument: "after" }
    );

    if (!result) {
       console.error(`Error in POST /api/features/sleep: Database operation failed for user ${userId}. findOneAndUpdate returned null.`);
       return NextResponse.json({ message: "Database operation failed to save sleep record." }, { status: 500 });
    }
    
    const upsertedSleepDoc = result as SleepDocument;
    const responseRecord = transformSleepRecordForResponse(upsertedSleepDoc);
    
    const wasInsert = Math.abs(upsertedSleepDoc.createdAt.getTime() - upsertedSleepDoc.updatedAt.getTime()) < 2000; // Check if createdAt and updatedAt are very close
    const statusCode = wasInsert ? 201 : 200;

    return NextResponse.json({ 
        message: wasInsert ? "Sleep record created." : "Sleep record updated.", 
        entry: responseRecord 
    }, { status: statusCode });

  } catch (error) {
    console.error("Error in POST /api/features/sleep:", error);
    return NextResponse.json({ message: "Failed to save sleep record" }, { status: 500 });
  }
}