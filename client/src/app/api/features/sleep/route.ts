// /api/features/sleep/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb"; // Adjust path if needed
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from 'mongodb'; // Import ObjectId

export async function GET() {
  try {
    // 1. Get User Session using authOptions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { // Check for user ID
      console.log("Sleep API (GET): Unauthorized access attempt - No session or user ID.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // 2. Validate and convert the string ID to a MongoDB ObjectId
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Sleep API (GET): Invalid user ID format:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }
    console.log(`Sleep API (GET): Fetching records for user ID ${userId}`);

    // 3. Connect to Database
    const client = await clientPromise;
    const db = client.db("Flowivate"); // Use your database name
    const sleepCollection = db.collection("sleep"); // Use your collection name

    // 4. Prepare Date Range Filter
    const now = new Date();
    // Ensure date calculations are robust, maybe use a library if complex timezone handling is needed
    const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the day 7 days ago

    // 5. Fetch Sleep Records using userId
    const sleepRecords = await sleepCollection
      .find({
        userId: userObjectId, // Filter by userId instead of userEmail
        timestamp: { $gte: sevenDaysAgo }, // Fetch records from the last 7 days
      })
      .sort({ timestamp: -1 }) // Sort by most recent first
      .toArray();

    console.log(`Sleep API (GET): Found ${sleepRecords.length} records for user ${userId} in the last 7 days.`);
    return NextResponse.json(sleepRecords, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/features/sleep:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal server error", error: process.env.NODE_ENV === 'development' ? errorMessage : undefined }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Get User Session using authOptions
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { // Check for user ID
      console.log("Sleep API (POST): Unauthorized access attempt - No session or user ID.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // 2. Validate and convert the string ID to a MongoDB ObjectId
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Sleep API (POST): Invalid user ID format:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }
     console.log(`Sleep API (POST): Request received for user ID ${userId}`);

    // 3. Parse Request Body
    let hours: number;
    let timestamp: string | Date;
    try {
        const body = await request.json();
        hours = body.hours;
        timestamp = body.timestamp; // Expecting ISO string or similar parseable date format

        // Validate input
        if (hours == null || typeof hours !== "number" || hours < 0 || hours > 24) {
             console.log(`Sleep API (POST): Invalid hours received for user ${userId}: ${hours}`);
            return NextResponse.json({ message: "Invalid 'hours' provided. Must be a number between 0 and 24." }, { status: 400 });
        }
        if (!timestamp) {
            console.log(`Sleep API (POST): Missing timestamp for user ${userId}`);
            return NextResponse.json({ message: "Missing 'timestamp' in request body." }, { status: 400 });
        }
         console.log(`Sleep API (POST): Received hours: ${hours}, timestamp: ${timestamp} for user ${userId}`);
    } catch (parseError) {
      console.error("Sleep API (POST): Error parsing request body:", parseError);
      return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }


    // 4. Connect to Database
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const sleepCollection = db.collection("sleep");

    // 5. Prepare Sleep Entry and Date Boundaries
    let sleepDate: Date;
    try {
        sleepDate = new Date(timestamp);
        if (isNaN(sleepDate.getTime())) { // Check if date parsing failed
             console.log(`Sleep API (POST): Invalid timestamp format for user ${userId}: ${timestamp}`);
            throw new Error("Invalid date format for timestamp");
        }
    } catch (dateError) {
         console.error("Sleep API (POST): Error parsing timestamp:", dateError);
        return NextResponse.json({ message: "Invalid 'timestamp' format provided." }, { status: 400 });
    }

    // Use UTC or server's local time consistently for start/end of day
    const startOfDay = new Date(sleepDate.getFullYear(), sleepDate.getMonth(), sleepDate.getDate());
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999); // End of the same day

    const sleepEntry = {
      hours: hours,
      userId: userObjectId, // Store userId instead of userEmail
      timestamp: sleepDate,   // Store the specific timestamp provided
      // You might also want a 'dateOnly' field for easier querying by day:
      // dateOnly: startOfDay,
    };

    // 6. Upsert Sleep Record for the Day using userId
    // This finds a record for the user within the specified day and updates it,
    // or inserts a new one if none exists for that day.
    const result = await sleepCollection.updateOne(
      {
        userId: userObjectId, // Filter by userId
        timestamp: { $gte: startOfDay, $lte: endOfDay }, // Filter by the specific day
      },
      { $set: sleepEntry }, // Set the new data (overwrites if found)
      { upsert: true } // Create if not found
    );

    console.log(`Sleep API (POST): DB operation result for user ${userId} on ${startOfDay.toISOString().split('T')[0]}:`, result);

     if (result.acknowledged) {
       const statusMessage = result.upsertedId ? "Sleep record created." : "Sleep record updated.";
       console.log(`Sleep API (POST): Success for user ${userId} - ${statusMessage}`);
       // Return the saved/updated entry or just success
       return NextResponse.json({ success: true, message: statusMessage, entry: sleepEntry }, { status: result.upsertedId ? 201 : 200 });
    } else {
       console.error(`Sleep API (POST): Database operation failed for user ${userId}. Acknowledged: false.`);
       return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in POST /api/features/sleep:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal server error", error: process.env.NODE_ENV === 'development' ? errorMessage : undefined }, { status: 500 });
  }
}