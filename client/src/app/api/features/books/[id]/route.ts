import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb"; // Adjust path if necessary
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  if (!id || typeof id !== 'string' || id.length !== 24 || !/^[0-9a-fA-F]{24}$/.test(id)) {
    console.warn(`isValidObjectId: Validation failed for ID "${id}" (Format/Length/Type)`);
    return false;
  }
  try {
    new ObjectId(id);
    // console.log(`isValidObjectId: Validation successful for ID "${id}"`); // Optional: verbose logging
    return true;
  } catch (error) {
    console.error(`isValidObjectId: Validation failed for ID "${id}" (Error during ObjectId creation)`, error);
    return false;
  }
}

// GET a single book
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const operation = "GET /api/features/books/[id]";
  try {
    const { id: bookId } = await params;
    console.log(`${operation}: Received request for bookId: ${bookId}`);

    if (!isValidObjectId(bookId)) {
      console.warn(`${operation}: Invalid book ID format: ${bookId}`);
      return NextResponse.json({ message: "Invalid book ID format" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`${operation}: Session userId: ${userId}`);

    if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error(`${operation}: Error converting session userId to ObjectId:`, userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const bookObjectId = new ObjectId(bookId); // Assuming bookId passed validation

    console.log(`${operation}: Querying DB with bookObjectId: ${bookObjectId.toHexString()} and userObjectId: ${userObjectId.toHexString()}`);

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Ensure this is your DB name
    const booksCollection = db.collection("books"); // Ensure this is your collection name

    const book = await booksCollection.findOne({
      _id: bookObjectId,
      userId: userObjectId
    });
    console.log(`${operation}: Found book?`, book ? book._id.toHexString() : 'No');

    if (!book) {
      console.warn(`${operation}: Book not found or access denied for book ${bookId} and user ${userId}`);
      return NextResponse.json({ message: "Book not found or access denied" }, { status: 404 });
    }

    console.log(`${operation}: Successfully found book ${bookId} for user ${userId}`);
    return NextResponse.json({ book }, { status: 200 });

  } catch (error) {
    const idForLog = (await params)?.id ? `/${(await params).id}` : '';
    console.error(`Error in ${operation}${idForLog}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// PUT to update a book
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const operation = "PUT /api/features/books/[id]";
  try {
    const { id: bookId } = await params;
    console.log(`${operation}: Received request for bookId: ${bookId}`);

    if (!isValidObjectId(bookId)) {
      console.warn(`${operation}: Invalid book ID format: ${bookId}`);
      return NextResponse.json({ message: "Invalid book ID format" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`${operation}: Session userId: ${userId}`);

    if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error(`${operation}: Error converting session userId to ObjectId:`, userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const bookObjectId = new ObjectId(bookId); // Assuming bookId passed validation

    console.log(`${operation}: Checking existence before update for bookObjectId: ${bookObjectId.toHexString()} and userObjectId: ${userObjectId.toHexString()}`);

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Ensure this is your DB name
    const booksCollection = db.collection("books"); // Ensure this is your collection name

    // --- Check if the book exists for the user BEFORE attempting update ---
    const existingBook = await booksCollection.findOne({
      _id: bookObjectId,
      userId: userObjectId
    });
    console.log(`${operation}: Found book for update check?`, existingBook ? existingBook._id.toHexString() : 'No');

    if (!existingBook) {
      console.warn(`${operation}: Book not found or access denied for book ${bookId} and user ${userId}. Cannot update.`);
      return NextResponse.json({ message: "Book not found or access denied" }, { status: 404 });
    }
    // --- End Existence Check ---

    const data = await request.json();
    console.log(`${operation}: Received update data:`, data);

    if (!data || typeof data !== 'object') {
      console.warn(`${operation}: Invalid request body.`);
      return NextResponse.json({ message: "Invalid request body" }, { status: 400 });
    }
    if (!data.title || !data.author) {
      console.warn(`${operation}: Title and author are required.`);
      return NextResponse.json(
        { message: "Title and author are required fields" },
        { status: 400 }
      );
    }

    // --- Input Validation ---
    const allowedStatus = ["not-started", "in-progress", "completed"];
    if (data.status && !allowedStatus.includes(data.status)) {
      console.warn(`${operation}: Invalid status value: ${data.status}`);
      return NextResponse.json({ message: `Invalid status value. Must be one of: ${allowedStatus.join(', ')}` }, { status: 400 });
    }
    if (data.hasOwnProperty('rating') && data.rating !== null && (typeof data.rating !== 'number' || data.rating < 0 || data.rating > 5)) {
      console.warn(`${operation}: Invalid rating value: ${data.rating}`);
      return NextResponse.json({ message: "Rating must be a number between 0 and 5, or null" }, { status: 400 });
    }
    if (data.hasOwnProperty('notes') && data.notes !== null && typeof data.notes !== 'string') {
        console.warn(`${operation}: Invalid notes type: ${typeof data.notes}`);
      return NextResponse.json({ message: "Notes must be a string or null" }, { status: 400 });
    }
    if (data.hasOwnProperty('genre') && data.genre !== null && typeof data.genre !== 'string') {
        console.warn(`${operation}: Invalid genre type: ${typeof data.genre}`);
      return NextResponse.json({ message: "Genre must be a string or null" }, { status: 400 });
    }
    // --- End Input Validation ---


    // --- Prepare Update Data ---
    const updateData: { [key: string]: unknown } = {}; // Use a more flexible type initially
    const allowedFields: (keyof Omit<Book, '_id' | 'userId' | 'dateAdded'>)[] = ["title", "author", "status", "rating", "genre", "notes", "dateCompleted"];

    for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
             // Explicitly handle null values if needed by your schema/logic
            if (field === 'dateCompleted') {
                updateData[field] = data[field] ? new Date(data[field]) : null;
            } else if (field === 'rating') {
                 // Allow setting rating to null or a valid number
                 updateData[field] = (data[field] === null || (typeof data[field] === 'number' && data[field] >= 0 && data[field] <= 5))
                    ? data[field]
                    : existingBook.rating; // Fallback to existing if invalid non-null value provided
            } else if (field === 'genre') {
                updateData[field] = (data[field] === null || typeof data[field] === 'string') ? data[field] : existingBook.genre;
            } else if (field === 'notes') {
                updateData[field] = (data[field] === null || typeof data[field] === 'string') ? data[field] : existingBook.notes;
            } else if (field === 'status') {
                updateData[field] = allowedStatus.includes(data[field]) ? data[field] : existingBook.status;
            } else {
                // For title, author
                updateData[field] = data[field];
            }
        }
    }

    // --- Date Completed Logic ---
    const newStatus = updateData.status as Book["status"] | undefined; // Get potential new status
    const oldStatus = existingBook.status;

    if (newStatus === "completed" && oldStatus !== "completed") {
      // If marking as completed, set dateCompleted unless explicitly provided
      if (!updateData.hasOwnProperty('dateCompleted') || updateData.dateCompleted === null || updateData.dateCompleted === undefined) {
        console.log(`${operation}: Status changed to completed, setting dateCompleted to now.`);
        updateData.dateCompleted = new Date();
      } else {
         console.log(`${operation}: Status changed to completed, using provided dateCompleted: ${updateData.dateCompleted}`);
      }
    } else if (newStatus && newStatus !== "completed" && oldStatus === "completed") {
      // If moving *away* from completed, clear dateCompleted unless explicitly provided otherwise (edge case)
       if (!updateData.hasOwnProperty('dateCompleted')) {
           console.log(`${operation}: Status changed away from completed, clearing dateCompleted.`);
            updateData.dateCompleted = null;
       } else {
            console.log(`${operation}: Status changed away from completed, but using provided dateCompleted: ${updateData.dateCompleted}`);
       }
    }
     // --- End Date Completed Logic ---

    if (Object.keys(updateData).length === 0) {
      console.log(`${operation}: No valid fields to update for book ${bookId}. Returning existing book.`);
      return NextResponse.json({ book: existingBook }, { status: 200 }); // Nothing to update
    }

    console.log(`${operation}: Prepared update payload for book ${bookId}:`, updateData);

    // --- Perform Update - MODIFIED APPROACH ---
    const updateResult = await booksCollection.updateOne(
      { _id: bookObjectId, userId: userObjectId },
      { $set: updateData }
    );

    console.log(`${operation}: Update result:`, updateResult);

    if (updateResult.matchedCount === 0) {
      console.warn(`${operation}: No document matched the update criteria.`);
      return NextResponse.json({ message: "Book not found or access denied" }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0) {
      console.warn(`${operation}: Document matched but not modified. Might be unchanged data.`);
      // Still proceed since this isn't necessarily an error
    }

    // Fetch the updated document separately
    const updatedBook = await booksCollection.findOne({ 
      _id: bookObjectId, 
      userId: userObjectId 
    });

    if (!updatedBook) {
      console.error(`${operation}: Document disappeared after update!`);
      return NextResponse.json({ message: "Book disappeared after update" }, { status: 500 });
    }

    console.log(`${operation}: Successfully updated book ${bookId}`);
    return NextResponse.json({ book: updatedBook }, { status: 200 });
    // --- End Perform Update ---

  } catch (error) {
    const idForLog = (await params)?.id ? `/${(await params).id}` : '';
    console.error(`Error in ${operation}${idForLog}:`, error);
    // Avoid sending detailed error messages to the client in production
    return NextResponse.json({ message: "Internal server error during update" }, { status: 500 });
  }
}

// DELETE a book
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const operation = "DELETE /api/features/books/[id]";
  try {
    const { id: bookId } = await params;
    console.log(`${operation}: Received request for bookId: ${bookId}`);

    if (!isValidObjectId(bookId)) {
      console.warn(`${operation}: Invalid book ID format: ${bookId}`);
      return NextResponse.json({ message: "Invalid book ID format" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log(`${operation}: Session userId: ${userId}`);

     if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error(`${operation}: Error converting session userId to ObjectId:`, userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const bookObjectId = new ObjectId(bookId); // Assuming bookId passed validation

    console.log(`${operation}: Attempting to delete book with bookObjectId: ${bookObjectId.toHexString()} and userObjectId: ${userObjectId.toHexString()}`);

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Ensure this is your DB name
    const booksCollection = db.collection("books"); // Ensure this is your collection name

    const result = await booksCollection.deleteOne({
      _id: bookObjectId,
      userId: userObjectId // Ensures only the owner can delete
    });

    console.log(`${operation}: Deletion result for book ${bookId} and user ${userId}:`, result);

    if (result.deletedCount === 0) {
      // This means no document matched BOTH _id and userId
      console.warn(`${operation}: Book not found or access denied for deletion. Book ${bookId}, User ${userId}.`);
      return NextResponse.json({ message: "Book not found or access denied" }, { status: 404 });
    }

    console.log(`${operation}: Successfully deleted book ${bookId} for user ${userId}`);
    return NextResponse.json({ message: "Book deleted successfully" }, { status: 200 }); // 200 or 204 No Content are appropriate

  } catch (error) {
    const idForLog = (await params)?.id ? `/${(await params).id}` : '';
    console.error(`Error in ${operation}${idForLog}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Define the Book type used in the backend (ensure it matches your actual schema)
interface Book {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  author: string;
  status: "not-started" | "in-progress" | "completed";
  rating?: number | null; // Allow null for rating
  genre?: string | null;  // Allow null for genre
  notes?: string | null;  // Allow null for notes
  dateAdded: Date;
  dateCompleted?: Date | null; // Allow null for dateCompleted
}