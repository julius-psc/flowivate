import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import type { NextRequest } from 'next/server';

interface ChatConversation {
  _id: ObjectId;
  userId: ObjectId;
  title: string;
  messages: { sender: string; content: string; timestamp: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

interface RouteContext {
  params: {
    chatId: string;
  };
}

// GET /api/chats/[chatId]
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.chatId;

    let userObjectId: ObjectId;
    let chatObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(session.user.id);
      chatObjectId = new ObjectId(chatId);
    } catch (error) {
      console.log("Invalid ID format error:", error);
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
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
        timestamp: msg.timestamp.toISOString()
      }))
    };

    return NextResponse.json(chatResponse, { status: 200 });

  } catch (error) {
    console.error(`Error in GET /api/chats/${params.chatId}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chats/[chatId]
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.chatId;

    let userObjectId: ObjectId;
    let chatObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(session.user.id);
      chatObjectId = new ObjectId(chatId);
    } catch (error) {
      console.error("Invalid ID format error:", error);
      return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const chatsCollection = db.collection('chats');

    const deleteResult = await chatsCollection.deleteOne({
      _id: chatObjectId,
      userId: userObjectId
    });

    if (deleteResult.deletedCount === 0) {
      return NextResponse.json({ message: 'Chat not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Chat deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error(`Error in DELETE /api/chats/${params.chatId}:`, error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
