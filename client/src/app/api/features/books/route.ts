import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";

// GET all books for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection("books");

    const books = await booksCollection
      .find({ email })
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
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.author) {
      return NextResponse.json(
        { message: "Title and author are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection("books");

    const newBook = {
      ...data,
      email,
      dateAdded: new Date(),
      status: data.status || "not-started"
    };

    const result = await booksCollection.insertOne(newBook);

    return NextResponse.json(
      { book: { ...newBook, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/features/books:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}