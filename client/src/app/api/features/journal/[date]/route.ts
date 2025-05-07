import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb"; // Adjust path if necessary
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";
import { parse, isValid, format } from 'date-fns';

// Define the JournalEntry type used in the backend
interface JournalEntry {
  _id: ObjectId;
  userId: ObjectId;
  date: string; // Store date as 'YYYY-MM-DD' string
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the structure for the API response for a single journal entry
interface JournalEntryResponse {
  _id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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

// Adapted error logging function
function logApiError(
  operation: 'GET' | 'PUT' | 'DELETE',
  identifier: string, // Represents date string for journal
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const endpointScope = `/api/features/journal/${identifier}`;
  let errorMessage = "An unknown error occurred";
  let errorDetails: Record<string, unknown> = { ...additionalInfo };

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = {
      ...errorDetails,
      name: error.name,
      message: error.message,
      stack: error.stack, // Be cautious with logging full stack in production
      cause: (error as { cause?: unknown }).cause,
    };
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorDetails = { ...errorDetails, errorString: error };
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = JSON.stringify(error);
    errorDetails = { ...errorDetails, errorObject: error };
  }

  console.error(
    `[API_ERROR] Operation: ${operation}, Endpoint: ${endpointScope}, Message: "${errorMessage}"`,
    errorDetails
  );
}

// GET a single journal entry by date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const operation = "GET";
  const { date: dateString } = await params;

  if (!isValidDateString(dateString)) {
    console.warn(`[API_VALIDATION_ERROR] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, Message: Invalid date format. Expected YYYY-MM-DD.`);
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`[API_AUTH_ERROR] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, Message: Unauthorized - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
        logApiError(operation, dateString, new Error('Invalid user ID format in session'), { userId });
        return NextResponse.json({ message: 'Invalid user ID format.' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const entry = await journalCollection.findOne({
      userId: userObjectId,
      date: dateString
    });

    if (!entry) {
      // Log this occurrence, but it's a valid case (no entry for the date)
      console.log(`[API_INFO] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, User: ${userId}, Message: Journal entry not found.`);
      return NextResponse.json({ message: "Journal entry not found" }, { status: 404 });
    }

    // Transform the entry for the response
    const entryResponse: JournalEntryResponse = {
      _id: entry._id.toString(),
      userId: entry.userId.toString(),
      date: entry.date,
      content: entry.content,
      createdAt: entry.createdAt.toISOString(),
      updatedAt: entry.updatedAt.toISOString(),
    };
    
    console.log(`[API_SUCCESS] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, User: ${userId}, Message: Successfully found entry ${entry._id.toString()}.`);
    return NextResponse.json({ entry: entryResponse }, { status: 200 });

  } catch (error) {
    logApiError(operation, dateString, error);
    return NextResponse.json({ message: "Internal server error. Please try again later." }, { status: 500 });
  }
}


// PUT to create or update (upsert) a journal entry by date
// This handler remains unchanged as per the request, but could also adopt logApiError.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const operation = "PUT"; // For consistency if we add logApiError here
  const { date: dateString } = await params;
  // console.log(`${operation} /api/features/journal/[date]: Received request for date: ${dateString}`); // Original log

   if (!isValidDateString(dateString)) {
    // console.warn(`${operation} /api/features/journal/[date]: Invalid date format: ${dateString}. Expected YYYY-MM-DD.`); // Original log
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // console.warn(`${operation} /api/features/journal/[date]: Unauthorized access - No session or user ID.`); // Original log
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
     if (!isValidObjectId(userId)) {
        // console.error(`${operation} /api/features/journal/[date]: Invalid session userId format: ${userId}`); // Original log
        return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const data = await request.json();
    // console.log(`${operation} /api/features/journal/[date]: Received update data:`, { content: data?.content ? '[Content Present]' : '[Content Missing]' }); // Original log

    if (!data || typeof data.content === 'undefined') {
      // console.warn(`${operation} /api/features/journal/[date]: Invalid request body. 'content' field is required.`); // Original log
      return NextResponse.json({ message: "Invalid request body: 'content' is required." }, { status: 400 });
    }

    if (typeof data.content !== 'string') {
        // console.warn(`${operation} /api/features/journal/[date]: Invalid content type: ${typeof data.content}`); // Original log
        return NextResponse.json({ message: "Content must be a string." }, { status: 400 });
    }
    const content = data.content;

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const now = new Date();

    const result = await journalCollection.findOneAndUpdate(
      { userId: userObjectId, date: dateString },
      {
        $set: {
          content: content,
          updatedAt: now,
        },
        $setOnInsert: {
           _id: new ObjectId(),
           userId: userObjectId,
           date: dateString,
           createdAt: now,
        }
      },
      {
        upsert: true,
        returnDocument: "after"
      }
    );

    // console.log(`${operation} /api/features/journal/[date]: MongoDB findOneAndUpdate result:`, result); // Original log

    if (!result) {
        // console.error(`${operation} /api/features/journal/[date]: Upsert operation failed unexpectedly for date ${dateString} and user ${userId}.`); // Original log
        // Using logApiError would be good here too
        logApiError(operation, dateString, new Error("Upsert operation failed unexpectedly"), { userId, dateString });
        return NextResponse.json({ message: "Failed to save journal entry due to unexpected database issue." }, { status: 500 });
    }

    const savedEntry = result as JournalEntry;

    // console.log(`${operation} /api/features/journal/[date]: Successfully upserted entry ${savedEntry._id.toHexString()} for date ${dateString}`); // Original log

    const statusCode = Math.abs(savedEntry.createdAt.getTime() - savedEntry.updatedAt.getTime()) < 1000 ? 201 : 200;

    // Transform the saved entry for the response, similar to GET
    const entryResponse: JournalEntryResponse = {
        _id: savedEntry._id.toString(),
        userId: savedEntry.userId.toString(),
        date: savedEntry.date,
        content: savedEntry.content,
        createdAt: savedEntry.createdAt.toISOString(),
        updatedAt: savedEntry.updatedAt.toISOString(),
    };

    return NextResponse.json({ entry: entryResponse }, { status: statusCode });

  } catch (error) {
    // console.error(`Error in ${operation} /api/features/journal/[date] for date ${dateString}:`, error); // Original log
    logApiError(operation, dateString, error);
    return NextResponse.json({ message: "Internal server error during save" }, { status: 500 });
  }
}


// DELETE a journal entry by date
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ date: string }> }
) {
  const operation = "DELETE";
  const { date: dateString } = await params;

  if (!isValidDateString(dateString)) {
    console.warn(`[API_VALIDATION_ERROR] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, Message: Invalid date format. Expected YYYY-MM-DD.`);
    return NextResponse.json({ message: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.warn(`[API_AUTH_ERROR] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, Message: Unauthorized - No session or user ID.`);
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
        logApiError(operation, dateString, new Error('Invalid user ID format in session'), { userId });
        return NextResponse.json({ message: 'Invalid user ID format.' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const result = await journalCollection.deleteOne({
      userId: userObjectId,
      date: dateString
    });

    if (result.deletedCount === 0) {
      console.warn(`[API_INFO] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, User: ${userId}, Message: Journal entry not found for deletion.`);
      return NextResponse.json({ message: "Journal entry not found" }, { status: 404 });
    }

    console.log(`[API_SUCCESS] Operation: ${operation}, Endpoint: /api/features/journal/${dateString}, User: ${userId}, Message: Successfully deleted journal entry.`);
    return NextResponse.json({ message: "Journal entry deleted successfully" }, { status: 200 });

  } catch (error) {
    logApiError(operation, dateString, error);
    return NextResponse.json({ message: "Internal server error. Please try again later." }, { status: 500 });
  }
}