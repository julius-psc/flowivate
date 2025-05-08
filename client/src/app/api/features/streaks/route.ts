import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from 'mongodb';

interface StreakDocument {
  _id?: ObjectId; // Automatically added by MongoDB
  userId: ObjectId;
  count: number;
  lastLogin: Date; // Stores the date of the last login that affected the streak
}

const DEFAULT_DB_NAME = "Flowivate";

function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      console.error(`Error in GET /api/streaks: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of the server's current day

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const streaksCollection = db.collection<StreakDocument>("streaks");

    const existingStreak = await streaksCollection.findOne({ userId: userObjectId });

    if (!existingStreak) {
      const newStreakData: StreakDocument = { userId: userObjectId, count: 1, lastLogin: today };
      await streaksCollection.insertOne(newStreakData);
      return NextResponse.json({ streak: 1 }, { status: 200 });
    }

    const lastLoginDate = new Date(existingStreak.lastLogin);
    lastLoginDate.setHours(0, 0, 0, 0); // Normalize last login date

    const diffInTime = today.getTime() - lastLoginDate.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

    let currentStreakCount = existingStreak.count;
    let needsDatabaseUpdate = false;

    if (diffInDays === 1) {
      currentStreakCount += 1;
      needsDatabaseUpdate = true;
    } else if (diffInDays > 1) {
      currentStreakCount = 1; // Reset streak
      needsDatabaseUpdate = true;
    } else if (diffInDays < 0) {
      // Time difference is negative, implies an issue or clock skew.
      // Log this unusual case but don't change the streak.
      console.error(`Error in GET /api/streaks: Negative time difference for user ${userId}. Current streak preserved. Diff in days: ${diffInDays}`);
      // needsDatabaseUpdate remains false
    }
    // If diffInDays === 0 (same day login), currentStreakCount remains unchanged, needsDatabaseUpdate is false.

    if (needsDatabaseUpdate) {
        await streaksCollection.updateOne(
          { userId: userObjectId },
          { $set: { count: currentStreakCount, lastLogin: today } }
        );
    }

    return NextResponse.json({ streak: currentStreakCount }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/streaks:", error);
    return NextResponse.json({ message: "Failed to process streak data" }, { status: 500 });
  }
}