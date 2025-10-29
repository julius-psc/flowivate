import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

interface UserStatusDocument {
  _id?: ObjectId;
  userId: ObjectId;
  status: string;
  lastUpdatedAt: Date;
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";
const DEFAULT_STATUS_COLLECTION_NAME = "statuses";
const DEFAULT_STATUS_VALUE = "Active";
const ALLOWED_STATUSES = ["Active", "Focusing", "Idle", "DND"];

function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userIdString = session.user.id;

    if (!isValidObjectId(userIdString)) {
      console.error(
        `Error in GET /api/features/status: Invalid session user ID format - ${userIdString}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier format" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userIdString);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const statusesCollection =
      db.collection<UserStatusDocument>(DEFAULT_STATUS_COLLECTION_NAME);

    const userStatusDoc = await statusesCollection.findOne({
      userId: userObjectId,
    });

    if (!userStatusDoc) {
      const newStatus: UserStatusDocument = {
        userId: userObjectId,
        status: DEFAULT_STATUS_VALUE,
        lastUpdatedAt: new Date(),
      };
      await statusesCollection.insertOne(newStatus);
      console.log(
        `Created default status '${DEFAULT_STATUS_VALUE}' for user ID ${userIdString}`
      );
      return NextResponse.json(
        { status: DEFAULT_STATUS_VALUE },
        { status: 200 }
      );
    }

    return NextResponse.json({ status: userStatusDoc.status }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/status:", error);
    const message =
      error instanceof Error ? error.message : "An unknown server error occurred.";
    return NextResponse.json(
      { message: `Failed to retrieve user status: ${message}` },
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

    const userIdString = session.user.id;

    if (!isValidObjectId(userIdString)) {
      console.error(
        `Error in POST /api/features/status: Invalid session user ID format - ${userIdString}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier format" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userIdString);

    let requestBody;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error(
        "Error in POST /api/features/status: Invalid JSON payload",
        parseError
      );
      return NextResponse.json(
        { message: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    const { status } = requestBody;

    if (
      !status ||
      typeof status !== "string" ||
      !ALLOWED_STATUSES.includes(status)
    ) {
      return NextResponse.json(
        {
          message: `Status is required and must be a string from the allowed list: ${ALLOWED_STATUSES.join(
            ", "
          )}.`,
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const statusesCollection =
      db.collection<UserStatusDocument>(DEFAULT_STATUS_COLLECTION_NAME);

    const updateResult = await statusesCollection.updateOne(
      { userId: userObjectId },
      {
        $set: { status: status, lastUpdatedAt: new Date() },
        $setOnInsert: { userId: userObjectId },
      },
      { upsert: true }
    );

    if (updateResult.upsertedCount > 0) {
      console.log(
        `Created and set status to '${status}' for user ID ${userIdString}`
      );
    } else if (updateResult.matchedCount > 0 && updateResult.modifiedCount > 0) {
      console.log(`Updated status to '${status}' for user ID ${userIdString}`);
    } else if (updateResult.matchedCount > 0 && updateResult.modifiedCount === 0) {
      console.log(
        `Status for user ID ${userIdString} was already '${status}'. No change.`
      );
    } else {
      console.error(
        `Failed to update or insert status for user ID ${userIdString}. Result:`,
        updateResult
      );
      return NextResponse.json(
        {
          message:
            "Failed to update status, user might not exist or no change was made.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Status updated successfully", status: status },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/features/status:", error);
    const message =
      error instanceof Error ? error.message : "An unknown server error occurred.";
    return NextResponse.json(
      { message: `Failed to update user status: ${message}` },
      { status: 500 }
    );
  }
}