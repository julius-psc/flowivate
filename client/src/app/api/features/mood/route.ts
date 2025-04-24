import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { authOptions } from '../../auth/[...nextauth]/route'; 
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    // 1. Get User Session using authOptions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { // Check for user ID
      console.log("Mood API (GET): Unauthorized access - No session or user ID.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // 2. Validate and convert the string ID to a MongoDB ObjectId
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Mood API (GET): Invalid user ID format:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }
    console.log(`Mood API (GET): Fetching records for user ID ${userId}`);

    // 3. Connect to Database
    const client = await clientPromise;
    const db = client.db("Flowivate"); // Use your database name
    const moodsCollection = db.collection("moods"); // Use your collection name

    // 4. Prepare Date Filter (Current Month)
    // Use current date (Thursday, April 24, 2025 at 10:17:35 PM CEST)
    const now = new Date(); // Gets current server time
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0); // Ensure start of the very first day of the month

    // 5. Fetch Mood Records using userId for the current month
    const moods = await moodsCollection
      .find({
        userId: userObjectId, // Filter by userId instead of userEmail
        timestamp: { $gte: startOfMonth } // Filter records from the start of the current month
      })
      .sort({ timestamp: -1 }) // Sort by most recent first
      .toArray();

    console.log(`Mood API (GET): Found ${moods.length} records for user ${userId} since ${startOfMonth.toISOString().split('T')[0]}.`);
    return NextResponse.json(moods, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/features/mood:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal server error", error: process.env.NODE_ENV === 'development' ? errorMessage : undefined }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get User Session using authOptions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { // Check for user ID
      console.log("Mood API (POST): Unauthorized access - No session or user ID.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // 2. Validate and convert the string ID to a MongoDB ObjectId
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Mood API (POST): Invalid user ID format:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }
     console.log(`Mood API (POST): Request received for user ID ${userId}`);

    // 3. Parse Request Body
    let mood: string;
    let timestamp: string | Date;
    try {
        const body = await request.json();
        mood = body.mood;
        timestamp = body.timestamp;

        // Validate input
        if (!mood || typeof mood !== "string" || mood.trim().length === 0) {
            console.log(`Mood API (POST): Invalid mood received for user ${userId}: '${mood}'`);
            return NextResponse.json({ message: "Invalid 'mood' provided. Must be a non-empty string." }, { status: 400 });
        }
        if (!timestamp) {
            console.log(`Mood API (POST): Missing timestamp for user ${userId}`);
            return NextResponse.json({ message: "Missing 'timestamp' in request body." }, { status: 400 });
        }
        console.log(`Mood API (POST): Received mood: ${mood}, timestamp: ${timestamp} for user ${userId}`);
    } catch (parseError) {
      console.error("Mood API (POST): Error parsing request body:", parseError);
      return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    // 4. Connect to Database
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const moodsCollection = db.collection("moods");

    // 5. Prepare Mood Entry and Date Boundaries
    let moodDate: Date;
     try {
        moodDate = new Date(timestamp);
        if (isNaN(moodDate.getTime())) {
             console.log(`Mood API (POST): Invalid timestamp format for user ${userId}: ${timestamp}`);
            throw new Error("Invalid date format for timestamp");
        }
    } catch (dateError) {
        console.error("Mood API (POST): Error parsing timestamp:", dateError);
        return NextResponse.json({ message: "Invalid 'timestamp' format provided." }, { status: 400 });
    }

    // Determine the start and end of the day for the upsert operation
    const startOfDay = new Date(moodDate.getFullYear(), moodDate.getMonth(), moodDate.getDate());
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const moodEntry = {
      mood: mood.trim(), // Store trimmed mood string
      userId: userObjectId, // Store userId instead of userEmail
      timestamp: moodDate,   // Store the specific timestamp provided
    };

    // 6. Upsert Mood Record for the Day using userId
    // Finds a mood record for the user within the specified day and updates it,
    // or inserts a new one if none exists for that day.
    const result = await moodsCollection.updateOne(
      {
        userId: userObjectId, // Filter by userId
        timestamp: { $gte: startOfDay, $lte: endOfDay } // Filter by the specific day
      },
      { $set: moodEntry }, // Set the new data (overwrites if found)
      { upsert: true } // Create if not found
    );

    console.log(`Mood API (POST): DB operation result for user ${userId} on ${startOfDay.toISOString().split('T')[0]}:`, result);

     if (result.acknowledged) {
       const statusMessage = result.upsertedId ? "Mood record created." : "Mood record updated.";
       console.log(`Mood API (POST): Success for user ${userId} - ${statusMessage}`);
       return NextResponse.json({ success: true, message: statusMessage, entry: moodEntry }, { status: result.upsertedId ? 201 : 200 });
    } else {
       console.error(`Mood API (POST): Database operation failed for user ${userId}. Acknowledged: false.`);
       return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in POST /api/features/mood:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal server error", error: process.env.NODE_ENV === 'development' ? errorMessage : undefined }, { status: 500 });
  }
}