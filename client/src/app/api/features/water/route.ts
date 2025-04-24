import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb'; // Import ObjectId

export async function POST(request: Request) {
  try {
    // 1. Get User Session using authOptions to ensure ID is included
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) { // Check for user ID instead of email
      console.log("Water API (POST): Unauthorized access attempt - No session or user ID found.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // 2. Validate and convert the string ID to a MongoDB ObjectId
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Water API (POST): Invalid user ID format:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }
    console.log(`Water API (POST): Request received for user ID ${userId}`);

    // 3. Parse Request Body
    let waterAmount: number;
    try {
      const body = await request.json();
      waterAmount = body.waterAmount;

      if (waterAmount === undefined || typeof waterAmount !== 'number' || waterAmount < 0) {
        console.log(`Water API (POST): Invalid waterAmount received for user ${userId}: ${waterAmount}`);
        return NextResponse.json({ message: "Invalid 'waterAmount' provided. Must be a non-negative number." }, { status: 400 });
      }
      console.log(`Water API (POST): Received waterAmount: ${waterAmount} for user ${userId}`);
    } catch (parseError) {
      console.error("Water API (POST): Error parsing request body:", parseError);
      return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    // 4. Connect to Database
    const client = await clientPromise;
    const db = client.db("Flowivate"); // Use your database name
    const waterCollection = db.collection("waterIntake"); // Choose a collection name

    // 5. Prepare Data for Upsert
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day (UTC or server time)

    // 6. Update or Insert Water Intake Record using userId
    const result = await waterCollection.updateOne(
      { userId: userObjectId, date: today }, // Filter: Find document for this user ID and today's date
      {
        $set: {
          userId: userObjectId, // Set userId on insert/update
          date: today,          // Set date on insert/update
          totalAmount: waterAmount // Set the total amount for the day
        }
      },
      { upsert: true } // Option: Create if not found, update if found
    );

    console.log(`Water API (POST): DB operation result for user ${userId} on ${today.toISOString().split('T')[0]}:`, result);

    if (result.acknowledged) {
       const statusMessage = result.upsertedId ? "Water intake record created." : "Water intake record updated.";
       console.log(`Water API (POST): Success for user ${userId} - ${statusMessage}`);
       return NextResponse.json({ message: "Water intake saved successfully", status: statusMessage, amount: waterAmount }, { status: 200 });
    } else {
       console.error(`Water API (POST): Database operation failed for user ${userId}. Acknowledged: false.`);
       return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in POST /api/features/water:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Avoid leaking detailed error info in production
    return NextResponse.json({ message: "Internal server error", error: process.env.NODE_ENV === 'development' ? errorMessage : undefined }, { status: 500 });
  }
}

// GET handler updated to use userId
export async function GET() {
    try {
      // 1. Get User Session using authOptions
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) { // Check for user ID
        console.log("Water API (GET): Unauthorized access attempt - No session or user ID found.");
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const userId = session.user.id;
      let userObjectId: ObjectId;

      // 2. Validate and convert the string ID to a MongoDB ObjectId
      try {
        userObjectId = new ObjectId(userId);
      } catch (error) {
        console.error('Water API (GET): Invalid user ID format:', userId, error);
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
      }
      console.log(`Water API (GET): Request received for user ID ${userId}`);


      // 3. Connect to Database
      const client = await clientPromise;
      const db = client.db("Flowivate");
      const waterCollection = db.collection("waterIntake");

      // 4. Prepare Date Filter
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 5. Find Water Record using userId
      const waterRecord = await waterCollection.findOne({ userId: userObjectId, date: today });

      const currentIntake = waterRecord ? waterRecord.totalAmount : 0;
      console.log(`Water API (GET): Found intake ${currentIntake} for user ${userId} on ${today.toISOString().split('T')[0]}`);

      return NextResponse.json({ waterAmount: currentIntake }, { status: 200 });

    } catch (error) {
      console.error("Error in GET /api/features/water:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      // Avoid leaking detailed error info in production
      return NextResponse.json({ message: "Internal server error", error: process.env.NODE_ENV === 'development' ? errorMessage : undefined }, { status: 500 });
    }
}