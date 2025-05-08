import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../../lib/mongodb";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/authOptions";
import { parse, isValid as isValidDateFn, format } from 'date-fns';

interface JournalEntry {
  _id: ObjectId;
  userId: ObjectId;
  date: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalEntryResponse {
  _id: string;
  userId: string;
  date: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const MAX_CONTENT_LENGTH = 10000; // Max length for journal content
const DEFAULT_DB_NAME = "Flowivate";

function isValidDateString(dateStr: string): boolean {
  if (typeof dateStr !== 'string') return false;
  const parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  return isValidDateFn(parsedDate) && format(parsedDate, 'yyyy-MM-dd') === dateStr;
}

function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id); // More robust check
}

function logApiError(
  operation: 'GET' | 'PUT' | 'DELETE',
  identifier: string,
  userIdString: string | undefined | null,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const endpointScope = `/api/features/journal/${identifier}`;
  let errorMessage = "An unknown error occurred";
  const errorDetails: Record<string, unknown> = { ...additionalInfo };
  if (userIdString) {
    errorDetails.userIdAttempted = userIdString;
  }

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails.errorName = error.name;
    errorDetails.errorMessage = error.message;
    errorDetails.errorStack = error.stack; // Logged server-side only
    if ((error as { cause?: unknown }).cause) {
        errorDetails.errorCause = (error as { cause?: unknown }).cause;
    }
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorDetails.errorString = error;
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = "Non-Error object thrown, see details.";
    errorDetails.errorObject = error;
  }

  console.error(
    `[API_ERROR] Operation: ${operation}, Endpoint: ${endpointScope}, Message: "${errorMessage}"`,
    errorDetails
  );
}

const transformEntryForResponse = (entry: JournalEntry | null): JournalEntryResponse | null => {
  if (!entry) return null;
  return {
    _id: entry._id.toString(),
    userId: entry.userId.toString(),
    date: entry.date,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const operation = "GET";
  const { date: dateString } = await params;
  let sessionUserId: string | undefined;

  try {
    if (!isValidDateString(dateString)) {
      return NextResponse.json({ message: "Invalid date format. Use yyyy-MM-dd." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(sessionUserId)) {
        logApiError(operation, dateString, sessionUserId, new Error('Invalid user ID format in session'));
        return NextResponse.json({ message: 'Invalid user identifier.' }, { status: 400 });
    }
    const userObjectId = new ObjectId(sessionUserId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const entry = await journalCollection.findOne({
      userId: userObjectId,
      date: dateString
    });

    if (!entry) {
      return NextResponse.json({ message: "Journal entry not found" }, { status: 404 });
    }

    const entryResponse = transformEntryForResponse(entry);
    return NextResponse.json({ entry: entryResponse }, { status: 200 });

  } catch (error) {
    logApiError(operation, dateString, sessionUserId, error);
    return NextResponse.json({ message: "Failed to retrieve journal entry." }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const operation = "PUT";
  const { date: dateString } = await params;
  let sessionUserId: string | undefined;

  try {
    if (!isValidDateString(dateString)) {
      return NextResponse.json({ message: "Invalid date format. Use yyyy-MM-dd." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(sessionUserId)) {
        logApiError(operation, dateString, sessionUserId, new Error('Invalid user ID format in session'));
        return NextResponse.json({ message: 'Invalid user identifier.' }, { status: 400 });
    }
    const userObjectId = new ObjectId(sessionUserId);

    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      logApiError(operation, dateString, sessionUserId, new Error('Invalid JSON payload'), { payloadError: jsonError });
      return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
    }

    if (!data || typeof data.content === 'undefined') {
      return NextResponse.json({ message: "Request body must contain 'content' field." }, { status: 400 });
    }
    if (typeof data.content !== 'string') {
        return NextResponse.json({ message: "Content must be a string." }, { status: 400 });
    }
    
    const content = data.content.trim();
    if (content.length > MAX_CONTENT_LENGTH) {
        return NextResponse.json({ message: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters.` }, { status: 400 });
    }


    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const now = new Date();
    const result = await journalCollection.findOneAndUpdate(
      { userId: userObjectId, date: dateString },
      {
        $set: { content: content, updatedAt: now },
        $setOnInsert: { _id: new ObjectId(), userId: userObjectId, date: dateString, createdAt: now }
      },
      { upsert: true, returnDocument: "after" }
    );

    if (!result) {
        logApiError(operation, dateString, sessionUserId, new Error("Upsert operation failed unexpectedly and returned no document."));
        return NextResponse.json({ message: "Failed to save journal entry." }, { status: 500 });
    }

    const savedEntry = result as JournalEntry;
    const statusCode = Math.abs(savedEntry.createdAt.getTime() - savedEntry.updatedAt.getTime()) < 1000 ? 201 : 200;
    const entryResponse = transformEntryForResponse(savedEntry);

    return NextResponse.json({ entry: entryResponse }, { status: statusCode });

  } catch (error) {
    logApiError(operation, dateString, sessionUserId, error);
    return NextResponse.json({ message: "Failed to save journal entry." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  const operation = "DELETE";
  const { date: dateString } = await params;
  let sessionUserId: string | undefined;

  try {
    if (!isValidDateString(dateString)) {
      return NextResponse.json({ message: "Invalid date format. Use yyyy-MM-dd." }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    sessionUserId = session?.user?.id;
    if (!sessionUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!isValidObjectId(sessionUserId)) {
        logApiError(operation, dateString, sessionUserId, new Error('Invalid user ID format in session'));
        return NextResponse.json({ message: 'Invalid user identifier.' }, { status: 400 });
    }
    const userObjectId = new ObjectId(sessionUserId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const journalCollection = db.collection<JournalEntry>("journalEntries");

    const result = await journalCollection.deleteOne({
      userId: userObjectId,
      date: dateString
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Journal entry not found for deletion" }, { status: 404 });
    }

    return NextResponse.json({ message: "Journal entry deleted successfully" }, { status: 200 });

  } catch (error) {
    logApiError(operation, dateString, sessionUserId, error);
    return NextResponse.json({ message: "Failed to delete journal entry." }, { status: 500 });
  }
}