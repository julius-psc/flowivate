import { NextResponse, NextRequest } from 'next/server';
import { auth } from "@/lib/auth";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

interface ChatMessage {
  sender: 'user' | 'ai' | string;
  content: string;
  timestamp: Date;
}

interface ChatConversation {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

function logApiError(
  operation: 'POST' | 'GET' | 'PUT' | 'DELETE',
  endpoint: string,
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


function generateChatTitle(messages: { sender: string; text: string; timestamp: string }[]): string {
  if (!messages || messages.length === 0) {
    return "New Chat";
  }
  const firstMessage = messages[0].text.trim();
  if (firstMessage.length === 0) {
    return "New Chat";
  }
  const words = firstMessage.split(/\s+/);
  const shortTitle = words.slice(0, 10).join(' ');
  if (shortTitle.length > 50) {
    return shortTitle.substring(0, 50) + '...';
  }
  return shortTitle || "New Chat";
}

export async function GET() {
  let sessionUserId: string | undefined;
  const endpoint = '/api/chats';

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;


    const userObjectId = new ObjectId(sessionUserId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const chatsCollection = db.collection<ChatConversation>('chats');

    const recentChats = await chatsCollection.find(
      { userId: userObjectId },
      { projection: { _id: 1, title: 1, updatedAt: 1 } }
    )
      .sort({ updatedAt: -1 })
      .limit(20)
      .toArray();

    const chatSummaries = recentChats.map(chat => ({
      id: chat._id.toString(),
      title: chat.title,
      timestamp: chat.updatedAt.toISOString(),
    }));

    return NextResponse.json(chatSummaries, { status: 200 });

  } catch (error: unknown) {
    logApiError('GET', endpoint, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to fetch recent chats. Please try again later.' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  let sessionUserId: string | undefined;
  const endpoint = '/api/chats';

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;


    const userObjectId = new ObjectId(sessionUserId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");

    // Verify subscription status directly from DB to avoid stale session data
    // This fixes the issue where a user upgrades but their session still says "free"
    const user = await db.collection('users').findOne(
      { _id: userObjectId },
      { projection: { subscriptionStatus: 1 } }
    );

    // @ts-ignore - Check if session status is available from our custom auth.ts
    // Use the DB status if available, fallback to session, then "free"
    const subscriptionStatus = user?.subscriptionStatus || session.user?.subscriptionStatus || "free";

    // Allow 'active' and maybe 'trialing' if you have that status.
    // Adjust logic based on your exact status enum
    if (subscriptionStatus !== "active" && subscriptionStatus !== "trialing") {
      logApiError('POST', endpoint, sessionUserId, new Error(`Restricted access attempted by user with status: ${subscriptionStatus}`));
      return NextResponse.json({ message: 'Upgrade to Elite to use Lumo.' }, { status: 403 });
    }

    const body = await request.json();
    const { messages: rawMessages } = body;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      logApiError('POST', endpoint, sessionUserId, new Error('Invalid or empty messages array in request body'));
      return NextResponse.json({ message: 'Messages array is required and cannot be empty' }, { status: 400 });
    }

    const validMessages: ChatMessage[] = rawMessages.map((msg: { sender: string; text: string; timestamp: string }) => ({
      sender: typeof msg.sender === 'string' ? msg.sender : 'unknown',
      content: typeof msg.text === 'string' ? msg.text : '',
      timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : new Date(),
    })).filter(msg => msg.content.length > 0);

    if (validMessages.length === 0) {
      logApiError('POST', endpoint, sessionUserId, new Error('No valid messages found after parsing'));
      return NextResponse.json({ message: 'No valid messages to save' }, { status: 400 });
    }

    const title = generateChatTitle(rawMessages);

    const newChat: ChatConversation = {
      _id: new ObjectId(),
      userId: userObjectId,
      title: title,
      messages: validMessages,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const chatsCollection = db.collection<ChatConversation>('chats');

    const result = await chatsCollection.insertOne(newChat);

    if (!result.acknowledged) {
      logApiError('POST', endpoint, sessionUserId, new Error('MongoDB insert operation not acknowledged'));
      return NextResponse.json({ message: 'Failed to create chat' }, { status: 500 });
    }

    return NextResponse.json({ conversationId: result.insertedId.toString() }, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      logApiError('POST', endpoint, sessionUserId, new Error(`Invalid JSON payload: ${error.message}`));
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    logApiError('POST', endpoint, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to create chat. Please try again later.' }, { status: 500 });
  }
}