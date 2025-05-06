import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

// GET all books for the logged‑in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userObjectId = new ObjectId(session.user.id);
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const books = await db
      .collection("books")
      .find({ userId: userObjectId })
      .sort({ dateAdded: -1 })
      .toArray();

    return NextResponse.json({ books }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/books:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST a new book
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userObjectId = new ObjectId(session.user.id);
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.author) {
      return NextResponse.json(
        { message: "Title and author are required fields" },
        { status: 400 }
      );
    }

    const allowedStatus = ["not-started", "in-progress", "completed"];
    const status = allowedStatus.includes(data.status) ? data.status : "not-started";
    const rating = typeof data.rating === 'number' && data.rating >= 0 && data.rating <= 5
      ? data.rating
      : null;
    const genre = typeof data.genre === 'string' ? data.genre : null;
    const notes = typeof data.notes === 'string' ? data.notes : null;

    const newBook = {
      userId: userObjectId,
      title: data.title,
      author: data.author,
      status,
      rating,
      genre,
      notes,
      dateAdded: new Date(),
      dateCompleted: status === 'completed' ? new Date() : null,
    };

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const result = await db.collection("books").insertOne(newBook);

    const inserted = await db.collection("books").findOne({ _id: result.insertedId });
    return NextResponse.json({ book: inserted }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/features/books:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
