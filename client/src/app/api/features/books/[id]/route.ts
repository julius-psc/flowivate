import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id: string) {
  try {
    new ObjectId(id);
    return true;
  } catch (error) {
    return false;
    console.log(error);
  }
}

// GET a single book
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid book ID" }, { status: 400 });
    }

    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection("books");

    const book = await booksCollection.findOne({
      _id: new ObjectId(id),
      email
    });

    if (!book) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ book }, { status: 200 });
  } catch {
    console.error(`Error in GET /api/features/books/${params.id}:`);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT to update a book
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid book ID" }, { status: 400 });
    }

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

    // Check if book exists and belongs to user
    const existingBook = await booksCollection.findOne({
      _id: new ObjectId(id),
      email
    });

    if (!existingBook) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    // Add dateCompleted if status changes to completed
    const updateData = { ...data };
    if (data.status === "completed" && existingBook.status !== "completed") {
      updateData.dateCompleted = new Date();
    } else if (data.status !== "completed") {
      // Remove dateCompleted if status is not completed
      updateData.dateCompleted = null;
    }

    const result = await booksCollection.findOneAndUpdate(
      { _id: new ObjectId(id), email },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ message: "Failed to update book" }, { status: 500 });
    }
    return NextResponse.json({ book: result.value }, { status: 200 });
  } catch {
    console.error(`Error in PUT /api/features/books/${params.id}:`);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// DELETE a book
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ message: "Invalid book ID" }, { status: 400 });
    }

    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection("books");

    const result = await booksCollection.deleteOne({
      _id: new ObjectId(id),
      email
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    console.error(`Error in DELETE /api/features/books/${params.id}:`);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}