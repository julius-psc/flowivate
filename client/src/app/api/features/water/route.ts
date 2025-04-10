import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb"; 

export async function POST(request: Request) {
  try {
    // 1. Get User Session
    // Pass authOptions if you have them configured
    const session = await getServerSession(/* authOptions */);
    if (!session || !session.user?.email) {
      console.log("Water API: Unauthorized access attempt.");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const email = session.user.email;
    console.log(`Water API: Request received for user ${email}`);

    // 2. Parse Request Body
    let waterAmount: number;
    try {
      const body = await request.json();
      waterAmount = body.waterAmount;

      // Basic validation
      if (waterAmount === undefined || typeof waterAmount !== 'number' || waterAmount < 0) {
        console.log(`Water API: Invalid waterAmount received: ${waterAmount}`);
        return NextResponse.json({ message: "Invalid 'waterAmount' provided in request body. It must be a non-negative number." }, { status: 400 });
      }
      console.log(`Water API: Received waterAmount: ${waterAmount}`);
    } catch (parseError) {
      console.error("Water API: Error parsing request body:", parseError);
      return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    // 3. Connect to Database
    const client = await clientPromise;
    const db = client.db("Flowivate"); // Use your database name
    const waterCollection = db.collection("waterIntake"); // Choose a collection name

    // 4. Prepare Data for Upsert
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to the start of the day (UTC or server time)

    // 5. Update or Insert Water Intake Record for the Day
    // We use upsert: true to create a new document if one doesn't exist for this user and date.
    // Otherwise, it updates the existing document.
    const result = await waterCollection.updateOne(
      { email: email, date: today }, // Filter: Find document for this user and today's date
      {
        $set: {
          email: email,     // Ensure email is set on insert
          date: today,      // Ensure date is set on insert
          totalAmount: waterAmount // Set the total amount for the day
        }
      },
      { upsert: true } // Option: Create if not found, update if found
    );

    console.log(`Water API: DB operation result for ${email} on ${today.toISOString().split('T')[0]}:`, result);

    if (result.acknowledged) {
       // Determine if it was an insert or update for logging/response purposes
       const statusMessage = result.upsertedId ? "Water intake record created." : "Water intake record updated.";
       console.log(`Water API: Success - ${statusMessage}`);
       return NextResponse.json({ message: "Water intake saved successfully", status: statusMessage, amount: waterAmount }, { status: 200 });
    } else {
       console.error(`Water API: Database operation failed for ${email}. Acknowledged: false.`);
       return NextResponse.json({ message: "Database operation failed." }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in POST /api/features/water:", error);
    // Avoid leaking detailed error info to the client in production
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ message: "Internal server error", error: errorMessage }, { status: 500 });
  }
}

// Optional: GET handler to retrieve water intake for the day (useful for persistence)
export async function GET() {
    try {
      const session = await getServerSession(/* authOptions */);
      if (!session || !session.user?.email) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      const email = session.user.email;

      const client = await clientPromise;
      const db = client.db("Flowivate");
      const waterCollection = db.collection("waterIntake");

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const waterRecord = await waterCollection.findOne({ email: email, date: today });

      const currentIntake = waterRecord ? waterRecord.totalAmount : 0;

      return NextResponse.json({ waterAmount: currentIntake }, { status: 200 });

    } catch (error) {
      console.error("Error in GET /api/features/water:", error);
      return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}