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

function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

function logApiError(
  operation: 'GET' | 'PUT' | 'DELETE',
  chatId: string | undefined,
  userId: string | undefined,
  error: unknown
): void {
  const endpointScope = chatId || "[chatId_resolution_failed]";
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
    `[API_ERROR] Operation: ${operation}, UserID: ${userScope}, Endpoint: /api/chats/${endpointScope}, Message: ${errorMessage}`,
    errorDetails
  );
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  let sessionUserId: string | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;

    if (!isValidObjectId(sessionUserId)) {
      logApiError('GET', chatId, sessionUserId, new Error('Invalid session user ID format'));
      return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    if (!isValidObjectId(chatId)) {
      logApiError('GET', chatId, sessionUserId, new Error('Invalid chat ID format'));
      return NextResponse.json({ message: 'Invalid chat ID format' }, { status: 400 });
    }

    const userObjectId = new ObjectId(sessionUserId);
    const chatObjectId = new ObjectId(chatId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const chatsCollection = db.collection<ChatConversation>('chats');

    const chat = await chatsCollection.findOne({
      _id: chatObjectId,
      userId: userObjectId
    });

    if (!chat) {
      return NextResponse.json({ message: 'Chat not found or not authorized' }, { status: 404 });
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

  } catch (error) {
    logApiError('GET', chatId, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to retrieve chat. Please try again later.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  let sessionUserId: string | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;

    if (!isValidObjectId(sessionUserId)) {
      logApiError('PUT', chatId, sessionUserId, new Error('Invalid session user ID format'));
      return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    if (!isValidObjectId(chatId)) {
      logApiError('PUT', chatId, sessionUserId, new Error('Invalid chat ID format'));
      return NextResponse.json({ message: 'Invalid chat ID format' }, { status: 400 });
    }

    const { title } = await request.json();

    if (typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ message: 'Title is required and must be a non-empty string' }, { status: 400 });
    }

    const userObjectId = new ObjectId(sessionUserId);
    const chatObjectId = new ObjectId(chatId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const chatsCollection = db.collection<ChatConversation>('chats');

    const updateResult = await chatsCollection.findOneAndUpdate(
      { _id: chatObjectId, userId: userObjectId },
      {
        $set: {
          title: title.trim(),
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!updateResult) {
      return NextResponse.json({ message: 'Chat not found or not authorized for update' }, { status: 404 });
    }

    const updatedChat = updateResult;

    const chatResponse = {
      ...updatedChat,
      _id: updatedChat._id.toString(),
      userId: updatedChat.userId.toString(),
      messages: updatedChat.messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString(),
      })),
      createdAt: updatedChat.createdAt.toISOString(),
      updatedAt: updatedChat.updatedAt.toISOString(),
    };

    return NextResponse.json(chatResponse, { status: 200 });

  } catch (error: unknown) {
    if (error instanceof SyntaxError && error.message.includes("JSON")) {
      logApiError('PUT', chatId, sessionUserId, new Error(`Invalid JSON payload: ${error.message}`));
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    logApiError('PUT', chatId, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to update chat. Please try again later.' }, { status: 500 });
  }
}


export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  let sessionUserId: string | undefined;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    sessionUserId = session.user.id;

    if (!isValidObjectId(sessionUserId)) {
      logApiError('DELETE', chatId, sessionUserId, new Error('Invalid session user ID format'));
      return NextResponse.json({ message: 'Invalid user ID format in session' }, { status: 400 });
    }
    if (!isValidObjectId(chatId)) {
      logApiError('DELETE', chatId, sessionUserId, new Error('Invalid chat ID format'));
      return NextResponse.json({ message: 'Invalid chat ID format' }, { status: 400 });
    }

    const userObjectId = new ObjectId(sessionUserId);
    const chatObjectId = new ObjectId(chatId);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB || "Flowivate");
    const chatsCollection = db.collection('chats');

    const deleteResult = await chatsCollection.deleteOne({
      _id: chatObjectId,
      userId: userObjectId
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Chat not found or not authorized for deletion' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chat deleted successfully' }, { status: 200 });

  } catch (error) {
    logApiError('DELETE', chatId, sessionUserId, error);
    return NextResponse.json({ message: 'Failed to delete chat. Please try again later.' }, { status: 500 });
  }
}