import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const moodsCollection = db.collection("moods");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const moods = await moodsCollection
      .find({ 
        userEmail: email,
        timestamp: { $gte: startOfMonth }
      })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json(moods, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/mood:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { mood, timestamp } = await request.json();

    if (!mood || typeof mood !== "string" || !timestamp) {
      return NextResponse.json({ message: "Invalid mood or timestamp" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const moodsCollection = db.collection("moods");

    const moodDate = new Date(timestamp);
    const startOfDay = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const moodEntry = {
      mood,
      userEmail: email,
      timestamp: moodDate,
    };

    await moodsCollection.updateOne(
      {
        userEmail: email,
        timestamp: { $gte: startOfDay, $lte: endOfDay }
      },
      { $set: moodEntry },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/features/mood:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}