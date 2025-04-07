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
    const sleepCollection = db.collection("sleep");

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const sleepRecords = await sleepCollection
      .find({
        userEmail: email,
        timestamp: { $gte: sevenDaysAgo },
      })
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json(sleepRecords, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/sleep:", error);
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
    const { hours, timestamp } = await request.json();

    if (!hours || typeof hours !== "number" || hours < 0 || hours > 24 || !timestamp) {
      return NextResponse.json({ message: "Invalid hours or timestamp" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const sleepCollection = db.collection("sleep");

    const sleepDate = new Date(timestamp);
    const startOfDay = new Date(sleepDate.getFullYear(), sleepDate.getMonth(), sleepDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const sleepEntry = {
      hours,
      userEmail: email,
      timestamp: sleepDate,
    };

    await sleepCollection.updateOne(
      {
        userEmail: email,
        timestamp: { $gte: startOfDay, $lte: endOfDay },
      },
      { $set: sleepEntry },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/features/sleep:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}