import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb"; // Adjust path if necessary
import { ObjectId } from "mongodb";
import { authOptions } from '../../../auth/[...nextauth]/route'; // Adjust path if necessary
import { parse, isValid, format } from 'date-fns';

// Define the JournalEntry type used in the backend
interface JournalEntry {
  _id: ObjectId;
  userId: ObjectId;
  date: string; // Store date as 'YYYY-MM-DD' string for reliable matching
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to validate 'YYYY-MM-DD' date format
function isValidDateString(dateStr: string): boolean {
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValid(parsedDate) && format(parsedDate, 'yyyy-MM-dd') === dateStr;
}

// Helper function to validate MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id);
}

// GET a single journal entry by date
export async function GET(
  request: Request,
  { params }: { params: { date: string } } // Expect date param directly
) {
  const operation = "GET /api/features/journal/[date]";
  const { date: dateString } = params;
  console.log(`${operation}: Received request for date: ${dateString}`);

  if (!isValidDateString(dateString)) {
    console.warn(`${operation}: Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    console.log(`${operation}: Querying DB for date: ${dateString} and userObjectId: ${userObjectId.toHexString()}`);

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Ensure this is your DB name
    const journalCollection = db.collection<JournalEntry>("journalEntries"); // Ensure this is your collection name

    const entry = await journalCollection.findOne({
      userId: userObjectId,
      date: dateString // Match directly on the date string
    });

    if (!entry) {
      console.log(`${operation}: Journal entry not found for date ${dateString} and user ${userId}`);
      // Return 404 Not Found, as this is expected if no entry exists for the date
      return NextResponse.json({ message: "Journal entry not found" }, { status: 404 });
    }

    console.log(`${operation}: Successfully found entry ${entry._id.toHexString()} for date ${dateString}`);
    // Return the found entry
    return NextResponse.json({ entry }, { status: 200 });

  } catch (error) {
    console.error(`Error in ${operation} for date ${dateString}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}


// PUT to create or update (upsert) a journal entry by date
export async function PUT(
  request: Request,
  { params }: { params: { date: string } }
) {
  const operation = "PUT /api/features/journal/[date]";
  const { date: dateString } = params;
  console.log(`${operation}: Received request for date: ${dateString}`);

   if (!isValidDateString(dateString)) {
    console.warn(`${operation}: Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
     if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const data = await request.json();
    console.log(`${operation}: Received update data:`, { content: data?.content ? '[Content Present]' : '[Content Missing]' });

    if (!data || typeof data.content === 'undefined') {
      console.warn(`${operation}: Invalid request body. 'content' field is required.`);
      return NextResponse.json({ message: "Invalid request body: 'content' is required." }, { status: 400 });
    }

    // Validate content (allow empty string, but must be string)
    if (typeof data.content !== 'string') {
        console.warn(`${operation}: Invalid content type: ${typeof data.content}`);
        return NextResponse.json({ message: "Content must be a string." }, { status: 400 });
    }
    const content = data.content; // Sanitize potentially? (e.g., using DOMPurify if needed, but Tiptap often handles this)

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const now = new Date();

    // Perform an upsert operation
    const result = await journalCollection.findOneAndUpdate(
      { userId: userObjectId, date: dateString }, // Filter: find entry for this user and date
      {
        $set: { // Fields to set on update or insert
          content: content,
          updatedAt: now,
        },
        $setOnInsert: { // Fields to set only on insert (creation)
           _id: new ObjectId(), // Generate new ID only on insert
           userId: userObjectId,
           date: dateString,
           createdAt: now,
        }
      },
      {
        upsert: true, // Create the document if it doesn't exist
        returnDocument: "after" // Return the modified or newly inserted document
      }
    );

    // Log the raw result from MongoDB for debugging
    console.log(`${operation}: MongoDB findOneAndUpdate result:`, result);

    // Check if the operation was successful and returned a document
    if (!result) {
         // This case should ideally not happen with upsert:true and returnDocument:after unless there's a DB error
         console.error(`${operation}: Upsert operation failed unexpectedly for date ${dateString} and user ${userId}.`);
         return NextResponse.json({ message: "Failed to save journal entry due to unexpected database issue." }, { status: 500 });
    }

    const savedEntry = result as JournalEntry; // Type assertion after checking result

    console.log(`${operation}: Successfully upserted entry ${savedEntry._id.toHexString()} for date ${dateString}`);

    // Determine if it was an insert or update based on createdAt and updatedAt times
    const statusCode = Math.abs(savedEntry.createdAt.getTime() - savedEntry.updatedAt.getTime()) < 1000 ? 201 : 200; // Roughly check if created now


    return NextResponse.json({ entry: savedEntry }, { status: statusCode });

  } catch (error) {
    console.error(`Error in ${operation} for date ${dateString}:`, error);
    // Avoid sending detailed error messages to the client in production
    return NextResponse.json({ message: "Internal server error during save" }, { status: 500 });
  }
}


// DELETE a journal entry by date
export async function DELETE(
  request: Request,
  { params }: { params: { date: string } }
) {
  const operation = "DELETE /api/features/journal/[date]";
  const { date: dateString } = params;
  console.log(`${operation}: Received request for date: ${dateString}`);

  if (!isValidDateString(dateString)) {
    console.warn(`${operation}: Invalid date format: ${dateString}. Expected YYYY-MM-DD.`);
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`${operation}: Unauthorized access - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
        console.error(`${operation}: Invalid session userId format: ${userId}`);
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    console.log(`${operation}: Attempting to delete entry for date: ${dateString} and userObjectId: ${userObjectId.toHexString()}`);

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const result = await journalCollection.deleteOne({
      userId: userObjectId,
      date: dateString // Match user and the specific date string
    });

    console.log(`${operation}: Deletion result for date ${dateString}:`, result);

    if (result.deletedCount === 0) {
      // This means no document matched BOTH userId and date
      console.warn(`${operation}: Journal entry not found for deletion. Date ${dateString}, User ${userId}.`);
      // It's arguably not an error if the client tries to delete something that doesn't exist.
      // Return 404 to indicate the resource wasn't found.
      return NextResponse.json({ message: "Journal entry not found" }, { status: 404 });
    }

    console.log(`${operation}: Successfully deleted journal entry for date ${dateString}`);
    // Return 200 OK or 204 No Content. 200 with a message is often clearer for the client.
    return NextResponse.json({ message: "Journal entry deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error(`Error in ${operation} for date ${dateString}:`, error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}