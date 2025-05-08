import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Define interfaces - ensure these match across your API files
interface ChatMessage {
  sender: 'user' | 'ai' | string;
  content: string;
  timestamp: Date;
}

interface ChatConversation {
  _id: ObjectId;
  userId: ObjectId;
  title: string; // Will be generated on POST
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Centralized error logger (copy from your other file to keep consistent)
function logApiError(
  operation: 'POST' | 'GET' | 'PUT' | 'DELETE',
  endpoint: string, // Use endpoint path for base route logging
  userId: string | undefined,
  error: unknown
): void {
  const userScope = userId || "[userId_resolution_failed]";
  let errorMessage = "An unknown error occurred";
  let errorDetails: Record<string, unknown> = {
    name: "UnknownError",
    cause: "UnknownCause"
  };

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorDetails = { errorString: error };
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = "Object error, see details.";
    errorDetails = { errorObject: error };
  }

  console.error(
    `[API_ERROR] Operation: ${operation}, UserID: ${userScope}, Endpoint: ${endpoint}, Message: ${errorMessage}`,
    errorDetails
  );
}


// Function to generate a default title from the first message
function generateChatTitle(messages: { sender: string; text: string; timestamp: string }[]): string {
  if (!messages || messages.length === 0) {
    return "New Chat";
  }
  const firstMessage = messages[0].text.trim();
  if (firstMessage.length === 0) {
    return "New Chat";
  }
  // Take the first 10 words or first 50 characters, whichever comes first
  const words = firstMessage.split(/\s+/);
  const shortTitle = words.slice(0, 10).join(' ');
  if (shortTitle.length > 50) {
      return shortTitle.substring(0, 50) + '...';
  }
  return shortTitle || "New Chat";
}

// GET handler for fetching recent chat summaries for the logged-in user
export async function GET() {
  let sessionUserId: string | undefined;
  const endpoint = '/api/chats'; // Log consistently for this route

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Return 401 if no authenticated session
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;

    // Optional: Validate session user ID format if needed
    // if (!isValidObjectId(sessionUserId)) {
    //   logApiError('GET', endpoint, sessionUserId, new Error('Invalid session user ID format from session'));
    //   return NextResponse.json({ message: 'Invalid user identifier' }, { status: 400 });
    // }

    const userObjectId = new ObjectId(sessionUserId);

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Replace with your actual database name
    const chatsCollection = db.collection<ChatConversation>('chats');

    // Find chats belonging to the user, sort by updatedAt descending, and limit results (e.g., to 20)
    // Project only the necessary fields (_id, title, updatedAt) to keep the response light
    const recentChats = await chatsCollection.find(
      { userId: userObjectId },
      { projection: { _id: 1, title: 1, updatedAt: 1 } }
    )
    .sort({ updatedAt: -1 }) // Sort by most recently updated
    .limit(20) // Limit the number of recent chats
    .toArray();

    // Map results to the desired format for the client
    const chatSummaries = recentChats.map(chat => ({
      id: chat._id.toString(),
      title: chat.title,
      timestamp: chat.updatedAt.toISOString(), // Send ISO string, client formats
    }));

    return NextResponse.json(chatSummaries, { status: 200 });

  } catch (error: unknown) {
    // Log and return a generic server error
    logApiError('GET', endpoint, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to fetch recent chats. Please try again later.' }, { status: 500 });
  }
}


// POST handler for creating a new chat conversation (Existing code)
export async function POST(request: NextRequest) {
  let sessionUserId: string | undefined;
  const endpoint = '/api/chats'; // Log consistently for this route

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;

    // Optional: Validate session user ID format if needed
    // if (!isValidObjectId(sessionUserId)) {
    //   logApiError('POST', endpoint, sessionUserId, new Error('Invalid session user ID format from session'));
    //   return NextResponse.json({ message: 'Invalid user identifier' }, { status: 400 });
    // }

    const userObjectId = new ObjectId(sessionUserId);

    const body = await request.json();
    // Expecting an array of messages in the body
    const { messages: rawMessages } = body;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        logApiError('POST', endpoint, sessionUserId, new Error('Invalid or empty messages array in request body'));
        return NextResponse.json({ message: 'Messages array is required and cannot be empty' }, { status: 400 });
    }

    // Map client-side message structure ('text') to server-side ('content')
    const validMessages: ChatMessage[] = rawMessages.map((msg: { sender: string; text: string; timestamp: string }) => ({
        sender: typeof msg.sender === 'string' ? msg.sender : 'unknown',
        content: typeof msg.text === 'string' ? msg.text : '', // Client sends 'text', server expects 'content'
        timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : new Date(), // Ensure valid Date object
    })).filter(msg => msg.content.length > 0); // Filter out messages with empty content

    if (validMessages.length === 0) {
         logApiError('POST', endpoint, sessionUserId, new Error('No valid messages found after parsing'));
         return NextResponse.json({ message: 'No valid messages to save' }, { status: 400 });
    }

    // Generate a title for the new chat from the first message
    const title = generateChatTitle(rawMessages);

    const newChat: ChatConversation = {
      _id: new ObjectId(), // MongoDB will generate if not provided, but explicit is fine
      userId: userObjectId,
      title: title,
      messages: validMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Replace with your actual database name
    const chatsCollection = db.collection<ChatConversation>('chats');

    // Insert the new chat document into the collection
    const result = await chatsCollection.insertOne(newChat);

    if (!result.acknowledged) {
         logApiError('POST', endpoint, sessionUserId, new Error('MongoDB insert operation not acknowledged'));
        return NextResponse.json({ message: 'Failed to create chat' }, { status: 500 });
    }

    // Return the ID of the newly created chat document
    return NextResponse.json({ conversationId: result.insertedId.toString() }, { status: 201 });

  } catch (error: unknown) {
    // Catch JSON parsing errors specifically
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      logApiError('POST', endpoint, sessionUserId, new Error(`Invalid JSON payload: ${error.message}`));
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    // Log and return a generic server error for other issues
    logApiError('POST', endpoint, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to create chat. Please try again later.' }, { status: 500 });
  }
}