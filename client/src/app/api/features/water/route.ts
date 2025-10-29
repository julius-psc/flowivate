import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

interface WaterIntakeDocument {
  _id: ObjectId;
  userId: ObjectId;
  date: Date;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WaterIntakeResponse {
  _id: string;
  userId: string;
  date: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";

function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

const transformWaterRecordForResponse = (
  recordDoc: WaterIntakeDocument | null
): WaterIntakeResponse | null => {
  if (!recordDoc) return null;
  return {
    _id: recordDoc._id.toString(),
    userId: recordDoc.userId.toString(),
    date: recordDoc.date.toISOString(),
    totalAmount: recordDoc.totalAmount,
    createdAt: recordDoc.createdAt.toISOString(),
    updatedAt: recordDoc.updatedAt.toISOString(),
  };
};

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(
        `Error in GET /api/features/water: Invalid session user ID format - ${userId}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const waterCollection =
      db.collection<WaterIntakeDocument>("waterIntake");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const waterRecordDoc = await waterCollection.findOne({
      userId: userObjectId,
      date: today,
    });

    if (!waterRecordDoc) {
      return NextResponse.json(
        { date: today.toISOString(), totalAmount: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json(transformWaterRecordForResponse(waterRecordDoc), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in GET /api/features/water:", error);
    return NextResponse.json(
      { message: "Failed to retrieve water intake data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(
        `Error in POST /api/features/water: Invalid session user ID format - ${userId}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userId);

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error(
        "Error in POST /api/features/water: Invalid JSON payload",
        parseError
      );
      return NextResponse.json(
        { message: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { waterAmount, date: dateString } = requestBody;

    if (
      waterAmount == null ||
      typeof waterAmount !== "number" ||
      waterAmount < 0 ||
      waterAmount > 20000
    ) {
      return NextResponse.json(
        {
          message:
            "Water amount must be a non-negative number within a reasonable limit.",
        },
        { status: 400 }
      );
    }
    if (!dateString || typeof dateString !== "string") {
      return NextResponse.json(
        { message: "Date string is required (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    let recordDate: Date;
    try {
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) throw new Error("Invalid date format");
      recordDate = new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate(),
        0,
        0,
        0,
        0
      );
    } catch (dateError) {
      console.error(
        "Error in POST /api/features/water: Invalid date format for 'date'",
        { dateProvided: dateString, error: dateError }
      );
      return NextResponse.json(
        { message: "Invalid date format provided. Use YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const waterCollection =
      db.collection<WaterIntakeDocument>("waterIntake");

    const now = new Date();
    const filter = { userId: userObjectId, date: recordDate };
    const updateOperation = {
      $set: {
        totalAmount: waterAmount,
        updatedAt: now,
      },
      $setOnInsert: {
        _id: new ObjectId(),
        userId: userObjectId,
        date: recordDate,
        createdAt: now,
      },
    };

    const result = await waterCollection.findOneAndUpdate(filter, updateOperation, {
      upsert: true,
      returnDocument: "after",
    });

    if (!result) {
      console.error(
        `Error in POST /api/features/water: Database operation failed for user ${userId}. findOneAndUpdate returned null.`
      );
      return NextResponse.json(
        { message: "Database operation failed to save water intake." },
        { status: 500 }
      );
    }

    const upsertedRecordDoc = result as WaterIntakeDocument;
    const responseRecord = transformWaterRecordForResponse(upsertedRecordDoc);

    const wasInsert =
      Math.abs(
        upsertedRecordDoc.createdAt.getTime() -
          upsertedRecordDoc.updatedAt.getTime()
      ) < 2000;
    const statusCode = wasInsert ? 201 : 200;

    return NextResponse.json(
      {
        message: wasInsert
          ? "Water intake record created."
          : "Water intake record updated.",
        entry: responseRecord,
      },
      { status: statusCode }
    );
  } catch (error) {
    console.error("Error in POST /api/features/water:", error);
    return NextResponse.json(
      { message: "Failed to save water intake data" },
      { status: 500 }
    );
  }
}