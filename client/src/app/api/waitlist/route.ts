import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb"; 

// Basic email validation utility
const isValidEmail = (email: string): boolean => {
  // A more comprehensive regex might be needed for stricter validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email presence and type
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: "Email is required and must be a string." }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ message: "Invalid email format." }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Replace "Flowivate" if your database name is different
    const waitlistCollection = db.collection("waitlist_entries");

    // Check if the email already exists in the waitlist
    const existingEntry = await waitlistCollection.findOne({ email: email.toLowerCase() }); // Store emails in lowercase to avoid duplicates due to casing

    if (existingEntry) {
      // Email already exists, inform the user.
      // Status 200 is used here for a "soft" notification, 409 (Conflict) could also be used.
      return NextResponse.json({ message: "You are already on the waitlist!" }, { status: 200 });
    }

    // Add the new email to the waitlist
    await waitlistCollection.insertOne({
      email: email.toLowerCase(), // Store email in lowercase
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Successfully joined the waitlist! We'll be in touch soon." }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Error in POST /api/waitlist:", error);
    if (error instanceof SyntaxError) { 
        // Error parsing JSON from request.json()
        return NextResponse.json({ message: "Invalid request format." }, { status: 400 });
    }
    // Generic error for other cases
    return NextResponse.json({ message: "Internal server error. Please try again later." }, { status: 500 });
  }
}