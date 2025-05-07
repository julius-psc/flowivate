import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions"; // Ensure this path is correct
import clientPromise from '@/lib/mongodb'; // Ensure this path is correct
import { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';

// Interface for the expected shape of chat documents in MongoDB
interface ChatConversation {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  messages: { sender: string; content: string; timestamp: Date }[]; // Assuming timestamp is stored as BSON Date
  createdAt: Date;
  updatedAt: Date;
}

// Interface for the resolved dynamic route parameters
interface RouteContextParams {
  chatId: string;
}

// Common error logging function
function logApiError(
  operation: 'GET' | 'DELETE',
  chatId: string | undefined,
  error: unknown
): void {
  const endpointScope = chatId || "[chatId_resolution_failed_or_not_applicable]";
  let errorMessage = "An unknown error occurred";
  let errorDetails: Record<string, unknown> = {};

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = {
      name: error.name,
      message: error.message, // Redundant with errorMessage but good for structured log
      stack: error.stack,
      cause: error.cause, // Include if available (Node.js 16.9.0+)
    };
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorDetails = { errorString: error };
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = JSON.stringify(error); // Fallback for unknown objects
    errorDetails = { errorObject: error };
  }

  console.error(
    `[API_ERROR] Operation: ${operation}, Endpoint: /api/chats/${endpointScope}, Message: ${errorMessage}`,
    errorDetails
  );
}


// GET /api/chats/[chatId]
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<RouteContextParams> }
) {
  let chatIdFromParams: string | undefined;

  try {
    const params = await paramsPromise;
    chatIdFromParams = params.chatId; // Type { chatId: string } ensures it's a string here

    const session = await getServerSession(authOptions);
    // Ensure session.user.id is a string. next-auth types typically ensure this.
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userIdAuth: string = session.user.id;

    let userObjectId: ObjectId;
    let chatObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(userIdAuth);
      chatObjectId = new ObjectId(chatIdFromParams);
    } catch (idFormatError: unknown) {
      console.warn(
        `Invalid ObjectId format. Input userIdAuth: "${userIdAuth}", input chatIdFromParams: "${chatIdFromParams}".`,
        idFormatError
      );
      return NextResponse.json({ message: 'Invalid ID format for resource identification.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate"); // Consider making "Flowivate" a const or env variable
    const chatsCollection = db.collection<ChatConversation>('chats');

    const chat = await chatsCollection.findOne({
      _id: chatObjectId,
      userId: userObjectId
    });

    if (!chat) {
      return NextResponse.json({ message: 'Chat not found or unauthorized' }, { status: 404 });
    }

    // Prepare response, ensuring ObjectIds and Dates are stringified
    const chatResponse = {
      ...chat,
      _id: chat._id.toString(),
      userId: chat.userId.toString(),
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(), // Assumes msg.timestamp is a Date object
      })),
      createdAt: chat.createdAt.toISOString(), // Also stringify other dates if needed by client
      updatedAt: chat.updatedAt.toISOString(),
    };

    return NextResponse.json(chatResponse, { status: 200 });

  } catch (error: unknown) {
    logApiError('GET', chatIdFromParams, error);
    return NextResponse.json({ message: 'Internal server error. Please try again later.' }, { status: 500 });
  }
}

// DELETE /api/chats/[chatId]
export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<RouteContextParams> }
) {
  let chatIdFromParams: string | undefined;

  try {
    const params = await paramsPromise;
    chatIdFromParams = params.chatId;

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userIdAuth: string = session.user.id;

    let userObjectId: ObjectId;
    let chatObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(userIdAuth);
      chatObjectId = new ObjectId(chatIdFromParams);
    } catch (idFormatError: unknown) {
      console.warn(
        `Invalid ObjectId format. Input userIdAuth: "${userIdAuth}", input chatIdFromParams: "${chatIdFromParams}".`,
        idFormatError
      );
      return NextResponse.json({ message: 'Invalid ID format for resource identification.' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const chatsCollection = db.collection('chats'); // No generic needed here as we only need _id for deleteOne

    const deleteResult = await chatsCollection.deleteOne({
      _id: chatObjectId,
      userId: userObjectId
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Chat not found or unauthorized for deletion' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chat deleted successfully' }, { status: 200 });

  } catch (error: unknown) {
    logApiError('DELETE', chatIdFromParams, error);
    return NextResponse.json({ message: 'Internal server error. Please try again later.' }, { status: 500 });
  }
}