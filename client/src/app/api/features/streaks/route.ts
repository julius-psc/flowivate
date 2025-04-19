// /api/streaks/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb"; // Adjust path if needed
import { authOptions } from '../../auth/[...nextauth]/route'
import { ObjectId } from 'mongodb'; // Import ObjectId

export async function GET() {
  try {
    const session = await getServerSession(authOptions); // Use authOptions for typed session

    // Check for user ID in the session
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // Validate and convert the string ID to a MongoDB ObjectId
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.log(error);
      console.error('Invalid user ID format:', userId);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day UTC

    const client = await clientPromise;
    // Ensure your DB name is correct if it's not the default 'test'
    const db = client.db("Flowivate"); // Or process.env.MONGODB_DB
    const streaksCollection = db.collection("streaks");

    // Find streak using userId (which is the MongoDB _id)
    // Ensure the field name in your database is 'userId' or adjust accordingly
    const streak = await streaksCollection.findOne({ userId: userObjectId });

    if (!streak) {
      // No existing streak, create a new one for this user
      const newStreak = { userId: userObjectId, count: 1, lastLogin: today };
      await streaksCollection.insertOne(newStreak);
      console.log(`Streak created for user ${userId}`);
      return NextResponse.json({ streak: 1 }, { status: 200 });
    }

    // Streak exists, calculate if it should be updated or reset
    const lastLogin = new Date(streak.lastLogin); // Assumes lastLogin is stored as ISODate
    lastLogin.setHours(0, 0, 0, 0); // Normalize last login date UTC

    const diffInTime = today.getTime() - lastLogin.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 60 * 60 * 24));

    let newCount = streak.count;
    let updated = false;

    if (diffInDays === 1) {
      // Consecutive day
      newCount += 1;
      updated = true;
      console.log(`Streak continued for user ${userId}. New count: ${newCount}`);
    } else if (diffInDays > 1) {
      // Streak broken
      newCount = 1; // Reset streak
      updated = true;
      console.log(`Streak reset for user ${userId}.`);
    } else if (diffInDays === 0) {
       // Same day login, do nothing to the count, but maybe update lastLogin timestamp if needed?
       // Current logic updates lastLogin only if streak changes, which is fine.
       console.log(`Same day login for user ${userId}. Streak count: ${newCount}`);
    } else {
       // This case (diffInDays < 0) should theoretically not happen if clocks are sync'd
       console.warn(`Time difference is negative for user ${userId}. Diff: ${diffInDays} days.`);
       // Decide how to handle this, maybe do nothing or log error
       updated = false; // Ensure no update happens for negative diff
    }

    // Update only if the count changed or it's the first login today after a break
    if (updated) {
        await streaksCollection.updateOne(
          { userId: userObjectId }, // Filter by userId
          { $set: { count: newCount, lastLogin: today } }
        );
    } else {
        // Optionally update lastLogin even on same-day login if desired,
        // but current logic only updates if count changes.
        // Example: To always update lastLogin timestamp:
        // if (diffInDays === 0) {
        //    await streaksCollection.updateOne({ userId: userObjectId }, { $set: { lastLogin: today } });
        // }
    }


    return NextResponse.json({ streak: newCount }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/streaks:", error);
    // Provide a more generic error message to the client
    return NextResponse.json({ message: "Internal server error processing streak data." }, { status: 500 });
  }
}