import { NextRequest, NextResponse } from "next/server";
import clientPromise from "../../../lib/mongodb";
import { ObjectId } from 'mongodb'; 

interface WaitlistEntryDocument {
  _id: ObjectId; 
  email: string;
  createdAt: Date;
}

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const COLLECTION_NAME = "waitlist_entries";
const MAX_EMAIL_LENGTH = 254;

const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= MAX_EMAIL_LENGTH;
};

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
        body = await request.json();
    } catch (jsonError) {
        console.error("Error parsing JSON in POST /api/waitlist:", jsonError);
        return NextResponse.json({ message: "Invalid request format." }, { status: 400 });
    }

    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ message: "Email is required and must be a string." }, { status: 400 });
    }

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      return NextResponse.json({ message: "Invalid email format or length." }, { status: 400 });
    }

    const lowercaseEmail = trimmedEmail.toLowerCase();

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const waitlistCollection = db.collection<WaitlistEntryDocument>(COLLECTION_NAME);

    const existingEntry = await waitlistCollection.findOne({ email: lowercaseEmail });

    if (existingEntry) {
      return NextResponse.json({ message: "You are already on the waitlist!" }, { status: 200 });
    }

    const newEntryData = {
      email: lowercaseEmail,
      createdAt: new Date(),
    };

    await waitlistCollection.insertOne(newEntryData as WaitlistEntryDocument);

    return NextResponse.json({ message: "Successfully joined the waitlist! We'll be in touch soon." }, { status: 201 });

  } catch (error) {
    console.error("Error in POST /api/waitlist:", error);
    return NextResponse.json({ message: "Internal server error. Please try again later." }, { status: 500 });
  }
}
