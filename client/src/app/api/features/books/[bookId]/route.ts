import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

// --- Types
interface Book {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  rating?: number | null;
  genre?: string | null;
  notes?: string | null;
  dateAdded: Date;
  dateCompleted?: Date | null;
}

interface RouteParams {
  bookId?: string;
  [key: string]: string | undefined;
}

// --- Helpers
function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

async function extractParams(params: unknown): Promise<RouteParams> {
  if (typeof params === "object" && params !== null && "then" in params && typeof (params as Promise<RouteParams>).then === "function") {
    return await (params as Promise<RouteParams>);
  }
  return (params ?? {}) as RouteParams;
}

function transformBookForResponse(book: Book) {
  return {
    ...book,
    _id: book._id.toString(),
    userId: book.userId.toString(),
  };
}

// --- GET
export async function GET(
  _request: NextRequest,
  { params }: { params: unknown }
) {
  const { bookId } = await extractParams(params);

  if (!isValidObjectId(bookId)) {
    return NextResponse.json({ message: "Invalid book identifier format" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized or invalid user id" }, { status: 401 });
    }
    const userObjectId = new ObjectId(session.user.id);
    const bookObjectId = new ObjectId(bookId);

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection<Book>("books");
    const book = await booksCollection.findOne({ _id: bookObjectId, userId: userObjectId });

    if (!book) {
      return NextResponse.json({ message: "Book not found or access denied" }, { status: 404 });
    }
    return NextResponse.json({ book: transformBookForResponse(book) }, { status: 200 });
  } catch (error) {
    console.error(`Error in GET /api/features/books/${bookId}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// --- PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: unknown }
) {
  const { bookId } = await extractParams(params);

  if (!isValidObjectId(bookId)) {
    return NextResponse.json({ message: "Invalid book identifier format" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized or invalid user id" }, { status: 401 });
    }

    const userObjectId = new ObjectId(session.user.id);
    const bookObjectId = new ObjectId(bookId);

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection<Book>("books");
    const existingBook = await booksCollection.findOne({ _id: bookObjectId, userId: userObjectId });

    if (!existingBook) {
      return NextResponse.json({ message: "Book not found or access denied for update" }, { status: 404 });
    }

    const data = await request.json();
    if (
      !data ||
      typeof data !== "object" ||
      typeof data.title !== "string" ||
      data.title.trim() === "" ||
      typeof data.author !== "string" ||
      data.author.trim() === ""
    ) {
      return NextResponse.json({ message: "Title and author are required string fields" }, { status: 400 });
    }

    const allowedStatus = ["not-started", "in-progress", "completed"];
    if (
      "status" in data &&
      (typeof data.status !== "string" || !allowedStatus.includes(data.status))
    ) {
      return NextResponse.json({ message: `Invalid status value. Must be one of: ${allowedStatus.join(", ")}` }, { status: 400 });
    }
    if ("rating" in data && data.rating !== null && (typeof data.rating !== "number" || data.rating < 0 || data.rating > 5)) {
      return NextResponse.json({ message: "Rating must be a number between 0 and 5, or null" }, { status: 400 });
    }
    if ("notes" in data && data.notes !== null && typeof data.notes !== "string") {
      return NextResponse.json({ message: "Notes must be a string or null" }, { status: 400 });
    }
    if ("genre" in data && data.genre !== null && typeof data.genre !== "string") {
      return NextResponse.json({ message: "Genre must be a string or null" }, { status: 400 });
    }
    if ("dateCompleted" in data && data.dateCompleted !== null && isNaN(new Date(data.dateCompleted).getTime())) {
      return NextResponse.json({ message: "Invalid dateCompleted format. Must be a valid date string or null." }, { status: 400 });
    }

    const updatePayload: Partial<Omit<Book, "_id" | "userId" | "dateAdded">> = {};
    (["title", "author", "status", "rating", "genre", "notes", "dateCompleted"] as const).forEach((field) => {
      if (field in data) {
        if (field === "title" || field === "author") {
          updatePayload[field] = typeof data[field] === "string" ? data[field].trim() : existingBook[field];
        } else if (field === "dateCompleted") {
          updatePayload[field] = data[field] ? new Date(data[field]) : null;
        } else if (field === "rating") {
          updatePayload[field] = (data[field] === null || (typeof data[field] === "number" && data[field] >= 0 && data[field] <= 5)) ? data[field] : existingBook.rating;
        } else if (field === "genre" || field === "notes") {
          updatePayload[field] = (typeof data[field] === "string" ? data[field].trim() : null) || null;
        } else if (field === "status") {
          updatePayload[field] = data[field];
        }
      }
    });

    // Auto handle dateCompleted on status change
    const newStatus = updatePayload.status;
    const oldStatus = existingBook.status;
    if (newStatus === "completed" && oldStatus !== "completed") {
      if (!("dateCompleted" in updatePayload) || updatePayload.dateCompleted === null) {
        updatePayload.dateCompleted = new Date();
      }
    } else if (newStatus && newStatus !== "completed" && oldStatus === "completed") {
      if (!("dateCompleted" in updatePayload)) {
        updatePayload.dateCompleted = null;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ book: transformBookForResponse(existingBook) }, { status: 200 });
    }

    await booksCollection.updateOne({ _id: bookObjectId, userId: userObjectId }, { $set: updatePayload });
    const updatedBook = await booksCollection.findOne({ _id: bookObjectId, userId: userObjectId });

    if (!updatedBook) {
      console.error(`Error in PUT /api/features/books/${bookId}: Book disappeared after update.`);
      return NextResponse.json({ message: "Failed to retrieve book after update" }, { status: 500 });
    }

    return NextResponse.json({ book: transformBookForResponse(updatedBook) }, { status: 200 });
  } catch (error) {
    console.error(`Error in PUT /api/features/books/${bookId}:`, error);
    return NextResponse.json({ message: "Internal server error during update" }, { status: 500 });
  }
}

// --- DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: unknown }
) {
  const { bookId } = await extractParams(params);

  if (!isValidObjectId(bookId)) {
    return NextResponse.json({ message: "Invalid book identifier format" }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Unauthorized or invalid user id" }, { status: 401 });
    }
    const userObjectId = new ObjectId(session.user.id);
    const bookObjectId = new ObjectId(bookId);

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const booksCollection = db.collection<Book>("books");

    const result = await booksCollection.deleteOne({ _id: bookObjectId, userId: userObjectId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Book not found or access denied for deletion" }, { status: 404 });
    }
    return NextResponse.json({ message: "Book deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(`Error in DELETE /api/features/books/${bookId}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
