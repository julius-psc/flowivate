import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import clientPromise from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { checkRateLimit } from "@/lib/checkRateLimit";

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

const transformBookForResponse = (book: Book | null | undefined) => {
  if (!book) return null;
  return {
    ...book,
    _id: book._id.toString(),
    userId: book.userId.toString(),
  };
};

function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return false;
  }
  try {
    return new ObjectId(id).toString() === id;
  } catch (error) {
    return false;
    console.error("Error in isValidObjectId:", error);
  }
}

const MAX_STRING_LENGTH = 255;
const MAX_NOTES_LENGTH = 5000;

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }
    const rateLimitResponse = await checkRateLimit(
      userId,
      `/api/features/books/GET`,
      20
    );
    if (rateLimitResponse) return rateLimitResponse;

    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const booksCollection = db.collection<Book>("books");

    const booksArray = await booksCollection
      .find({ userId: userObjectId })
      .sort({ dateAdded: -1 })
      .toArray();

    const responseBooks = booksArray.map(transformBookForResponse);

    return NextResponse.json({ books: responseBooks }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/books:", error);
    return NextResponse.json(
      { message: "Failed to retrieve books" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }

    const rateLimitResponse = await checkRateLimit(
      userId,
      `/api/features/books/POST`,
      4
    );
    if (rateLimitResponse) return rateLimitResponse;

    const userObjectId = new ObjectId(userId);

    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error(
        "Error parsing JSON in POST /api/features/books:",
        jsonError
      );
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    if (
      !data ||
      typeof data.title !== "string" ||
      data.title.trim() === "" ||
      typeof data.author !== "string" ||
      data.author.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Title and author are required string fields" },
        { status: 400 }
      );
    }

    const title = data.title.trim();
    const author = data.author.trim();

    if (title.length > MAX_STRING_LENGTH || author.length > MAX_STRING_LENGTH) {
      return NextResponse.json(
        {
          message: `Title and author must not exceed ${MAX_STRING_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    const allowedStatus = ["not-started", "in-progress", "completed"];
    const status =
      typeof data.status === "string" && allowedStatus.includes(data.status)
        ? data.status
        : "not-started";

    const rating =
      typeof data.rating === "number" && data.rating >= 0 && data.rating <= 5
        ? data.rating
        : null;

    let genre = null;
    if (data.genre !== undefined && data.genre !== null) {
      if (typeof data.genre !== "string") {
        return NextResponse.json(
          { message: "Genre must be a string or null" },
          { status: 400 }
        );
      }
      genre = data.genre.trim();
      if (genre.length > MAX_STRING_LENGTH) {
        return NextResponse.json(
          { message: `Genre must not exceed ${MAX_STRING_LENGTH} characters` },
          { status: 400 }
        );
      }
      if (genre === "") genre = null;
    }

    let notes = null;
    if (data.notes !== undefined && data.notes !== null) {
      if (typeof data.notes !== "string") {
        return NextResponse.json(
          { message: "Notes must be a string or null" },
          { status: 400 }
        );
      }
      notes = data.notes.trim();
      if (notes.length > MAX_NOTES_LENGTH) {
        return NextResponse.json(
          { message: `Notes must not exceed ${MAX_NOTES_LENGTH} characters` },
          { status: 400 }
        );
      }
      if (notes === "") notes = null;
    }

    const newBookData: Omit<Book, "_id"> = {
      userId: userObjectId,
      title,
      author,
      status,
      rating,
      genre,
      notes,
      dateAdded: new Date(),
      dateCompleted: status === "completed" ? new Date() : null,
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const booksCollection = db.collection<Book>("books");
    const result = await booksCollection.insertOne(newBookData as Book);

    const insertedBook = await booksCollection.findOne({
      _id: result.insertedId,
    });

    if (!insertedBook) {
      console.error(
        "Error in POST /api/features/books: Failed to retrieve inserted book.",
        { insertedId: result.insertedId }
      );
      return NextResponse.json(
        { message: "Failed to create book, unable to confirm." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { book: transformBookForResponse(insertedBook) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/features/books:", error);
    return NextResponse.json(
      { message: "Failed to create book" },
      { status: 500 }
    );
  }
}