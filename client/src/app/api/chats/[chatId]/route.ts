import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';

// Interface for chat document
interface ChatConversation {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  messages: { sender: string; content: string; timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

// Interface for dynamic route parameters
interface RouteContextParams {
  chatId: string;
}

// Error logging helper
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
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  } else if (typeof error === 'string') {
    errorMessage = error;
    errorDetails = { errorString: error };
  } else if (typeof error === 'object' && error !== null) {
    errorMessage = JSON.stringify(error);
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
  { params }: { params: RouteContextParams }
) {
  const chatIdFromParams = params.chatId;

  try {
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
    const chatsCollection = db.collection<ChatConversation>('chats');

    const chat = await chatsCollection.findOne({
      _id: chatObjectId,
      userId: userObjectId
    });

    if (!chat) {
      return NextResponse.json({ message: 'Chat not found or unauthorized' }, { status: 404 });
    }

    const chatResponse = {
      ...chat,
      _id: chat._id.toString(),
      userId: chat.userId.toString(),
      messages: chat.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
      createdAt: chat.createdAt.toISOString(),
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
  { params }: { params: RouteContextParams }
) {
  const chatIdFromParams = params.chatId;

  try {
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
    const chatsCollection = db.collection('chats');

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
