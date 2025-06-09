import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";
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

function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
    return false;
  }
  try {
    return new ObjectId(id).toString() === id;
  } catch (error) {
    console.error(`Invalid ObjectId format: ${id}`, error);
    return false;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  try {
    if (!isValidObjectId(bookId)) {
      return NextResponse.json(
        { message: "Invalid book identifier format" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { message: "Invalid user identifier format in session" },
        { status: 400 }
      );
    }
   const rateLimitResponse = await checkRateLimit(userId, `/api/features/books/GET`, 20);
if (rateLimitResponse) return rateLimitResponse;


    const userObjectId = new ObjectId(userId);
    const bookObjectId = new ObjectId(bookId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const booksCollection = db.collection<Book>("books");

    const book = await booksCollection.findOne({
      _id: bookObjectId,
      userId: userObjectId,
    });

    if (!book) {
      return NextResponse.json(
        { message: "Book not found or access denied" },
        { status: 404 }
      );
    }

    // Ensure ObjectIds are stringified for the response
    const responseBook = {
      ...book,
      _id: book._id.toString(),
      userId: book.userId.toString(),
    };

    return NextResponse.json({ book: responseBook }, { status: 200 });
  } catch (error) {
    console.error(`Error in GET /api/features/books/${bookId}:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  try {
    if (!isValidObjectId(bookId)) {
      return NextResponse.json(
        { message: "Invalid book identifier format" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { message: "Invalid user identifier format in session" },
        { status: 400 }
      );
    }

   const rateLimitResponse = await checkRateLimit(userId, `/api/features/books/PUT`, 4);
if (rateLimitResponse) return rateLimitResponse;



    const userObjectId = new ObjectId(userId);
    const bookObjectId = new ObjectId(bookId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const booksCollection = db.collection<Book>("books");

    const existingBook = await booksCollection.findOne({
      _id: bookObjectId,
      userId: userObjectId,
    });

    if (!existingBook) {
      return NextResponse.json(
        { message: "Book not found or access denied for update" },
        { status: 404 }
      );
    }

    const data = await request.json();

    if (!data || typeof data !== "object" || data === null) {
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    if (
      !data.title ||
      typeof data.title !== "string" ||
      data.title.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Title is a required string field" },
        { status: 400 }
      );
    }
    if (
      !data.author ||
      typeof data.author !== "string" ||
      data.author.trim() === ""
    ) {
      return NextResponse.json(
        { message: "Author is a required string field" },
        { status: 400 }
      );
    }

    const allowedStatus = ["not-started", "in-progress", "completed"];
    if (
      data.hasOwnProperty("status") &&
      (typeof data.status !== "string" || !allowedStatus.includes(data.status))
    ) {
      return NextResponse.json(
        {
          message: `Invalid status value. Must be one of: ${allowedStatus.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }
    if (
      data.hasOwnProperty("rating") &&
      data.rating !== null &&
      (typeof data.rating !== "number" || data.rating < 0 || data.rating > 5)
    ) {
      return NextResponse.json(
        { message: "Rating must be a number between 0 and 5, or null" },
        { status: 400 }
      );
    }
    if (
      data.hasOwnProperty("notes") &&
      data.notes !== null &&
      typeof data.notes !== "string"
    ) {
      return NextResponse.json(
        { message: "Notes must be a string or null" },
        { status: 400 }
      );
    }
    if (
      data.hasOwnProperty("genre") &&
      data.genre !== null &&
      typeof data.genre !== "string"
    ) {
      return NextResponse.json(
        { message: "Genre must be a string or null" },
        { status: 400 }
      );
    }
    if (
      data.hasOwnProperty("dateCompleted") &&
      data.dateCompleted !== null &&
      isNaN(new Date(data.dateCompleted).getTime())
    ) {
      return NextResponse.json(
        {
          message:
            "Invalid dateCompleted format. Must be a valid date string or null.",
        },
        { status: 400 }
      );
    }

    const updatePayload: Partial<Omit<Book, "_id" | "userId" | "dateAdded">> =
      {};
    const allowedFields: (keyof typeof updatePayload)[] = [
      "title",
      "author",
      "status",
      "rating",
      "genre",
      "notes",
      "dateCompleted",
    ];
    for (const field of allowedFields) {
      if (data.hasOwnProperty(field)) {
        if (field === "title" || field === "author") {
          updatePayload[field] = data[field].trim();
        } else if (field === "dateCompleted") {
          updatePayload[field] = data[field] ? new Date(data[field]) : null;
        } else if (field === "rating") {
          updatePayload[field] =
            data[field] === null ||
            (typeof data[field] === "number" &&
              data[field] >= 0 &&
              data[field] <= 5)
              ? data[field]
              : existingBook.rating;
        } else if (field === "genre") {
          if (typeof data[field] === "string") {
            const trimmed = data[field].trim();
            updatePayload[field] = trimmed === "" ? null : trimmed;
          } else if (data[field] === null) {
            updatePayload[field] = null;
          } else {
            updatePayload[field] = existingBook.genre;
          }
        } else if (field === "notes") {
          if (typeof data[field] === "string") {
            const trimmed = data[field].trim();
            updatePayload[field] = trimmed === "" ? null : trimmed;
          } else if (data[field] === null) {
            updatePayload[field] = null;
          } else {
            updatePayload[field] = existingBook.notes;
          }
        } else if (field === "status") {
          updatePayload[field] = data[field]; // Already validated
        }
      }
    }

    const newStatus = updatePayload.status;
    const oldStatus = existingBook.status;

    if (newStatus && newStatus === "completed" && oldStatus !== "completed") {
      if (
        !updatePayload.hasOwnProperty("dateCompleted") ||
        updatePayload.dateCompleted === null
      ) {
        updatePayload.dateCompleted = new Date();
      }
    } else if (
      newStatus &&
      newStatus !== "completed" &&
      oldStatus === "completed"
    ) {
      if (!updatePayload.hasOwnProperty("dateCompleted")) {
        updatePayload.dateCompleted = null;
      }
    }

    if (Object.keys(updatePayload).length === 0) {
      const responseExistingBook = {
        ...existingBook,
        _id: existingBook._id.toString(),
        userId: existingBook.userId.toString(),
      };
      return NextResponse.json({ book: responseExistingBook }, { status: 200 });
    }

    const updateResult = await booksCollection.updateOne(
      { _id: bookObjectId, userId: userObjectId },
      { $set: updatePayload }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { message: "Book not found or access denied for update" },
        { status: 404 }
      ); // Should be caught by existingBook check
    }

    const updatedBook = await booksCollection.findOne({
      _id: bookObjectId,
      userId: userObjectId,
    });

    if (!updatedBook) {
      console.error(
        `Error in PUT /api/features/books/${bookId}: Book disappeared after update.`
      );
      return NextResponse.json(
        { message: "Failed to retrieve book after update" },
        { status: 500 }
      );
    }

    const responseUpdatedBook = {
      ...updatedBook,
      _id: updatedBook._id.toString(),
      userId: updatedBook.userId.toString(),
    };
    return NextResponse.json({ book: responseUpdatedBook }, { status: 200 });
  } catch (error) {
    console.error(`Error in PUT /api/features/books/${bookId}:`, error);
    return NextResponse.json(
      { message: "Internal server error during update" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;

  try {
    if (!isValidObjectId(bookId)) {
      return NextResponse.json(
        { message: "Invalid book identifier format" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
      return NextResponse.json(
        { message: "Invalid user identifier format in session" },
        { status: 400 }
      );
    }

  const rateLimitResponse = await checkRateLimit(userId, `/api/features/books/DELETE`, 5);
if (rateLimitResponse) return rateLimitResponse;



    const userObjectId = new ObjectId(userId);
    const bookObjectId = new ObjectId(bookId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const booksCollection = db.collection("books");

    const result = await booksCollection.deleteOne({
      _id: bookObjectId,
      userId: userObjectId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "Book not found or access denied for deletion" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Book deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in DELETE /api/features/books/${bookId}:`, error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
