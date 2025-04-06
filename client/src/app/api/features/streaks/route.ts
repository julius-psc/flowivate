import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb"; 

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const streaksCollection = db.collection("streaks");

    const streak = await streaksCollection.findOne({ email }); // Use email instead of userId

    if (!streak) {
      const newStreak = { email, count: 1, lastLogin: today };
      await streaksCollection.insertOne(newStreak);
      return NextResponse.json({ streak: 1 }, { status: 200 });
    }

    const lastLogin = new Date(streak.lastLogin);
    lastLogin.setHours(0, 0, 0, 0);
    const diffInDays = Math.floor(
      (today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
    );

    let newCount = streak.count;
    if (diffInDays === 1) {
      newCount += 1;
    } else if (diffInDays > 1) {
      newCount = 1;
    }

    await streaksCollection.updateOne(
      { email }, // Use email here too
      { $set: { count: newCount, lastLogin: today } }
    );

    return NextResponse.json({ streak: newCount }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/streaks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}