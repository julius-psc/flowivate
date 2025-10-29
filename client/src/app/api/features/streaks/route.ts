import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

interface StreakDocument {
  _id?: ObjectId;
  userId: ObjectId;
  count: number;
  lastLogin: Date;
}

const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";

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

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(
        `Error in GET /api/streaks: Invalid session user ID format - ${userId}`
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const userObjectId = new ObjectId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const streaksCollection = db.collection<StreakDocument>("streaks");

    const existingStreak = await streaksCollection.findOne({
      userId: userObjectId,
    });

    if (!existingStreak) {
      const newStreakData: StreakDocument = {
        userId: userObjectId,
        count: 1,
        lastLogin: today,
      };
      await streaksCollection.insertOne(newStreakData);
      return NextResponse.json({ streak: 1 }, { status: 200 });
    }

    const lastLoginDate = new Date(existingStreak.lastLogin);
    lastLoginDate.setHours(0, 0, 0, 0);

    const diffInTime = today.getTime() - lastLoginDate.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

    let currentStreakCount = existingStreak.count;
    let needsDatabaseUpdate = false;

    if (diffInDays === 1) {
      currentStreakCount += 1;
      needsDatabaseUpdate = true;
    } else if (diffInDays > 1) {
      currentStreakCount = 1;
      needsDatabaseUpdate = true;
    } else if (diffInDays < 0) {
      console.error(
        `Error in GET /api/streaks: Negative time difference for user ${userId}. Current streak preserved. Diff in days: ${diffInDays}`
      );
    }

    if (needsDatabaseUpdate) {
      await streaksCollection.updateOne(
        { userId: userObjectId },
        { $set: { count: currentStreakCount, lastLogin: today } }
      );
    }

    return NextResponse.json({ streak: currentStreakCount }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/streaks:", error);
    return NextResponse.json(
      { message: "Failed to process streak data" },
      { status: 500 }
    );
  }
}