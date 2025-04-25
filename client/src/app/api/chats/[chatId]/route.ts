import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route'; // Adjust path
import clientPromise from '../../../../lib/mongodb'; // Adjust path
import { ObjectId } from 'mongodb';

interface ChatConversation {
    _id?: ObjectId;
    userId: ObjectId;
    title: string;
    messages: { sender: string; content: string; timestamp: Date }[]; // Define message structure
    createdAt: Date;
    updatedAt: Date;
}


// GET /api/chats/[chatId] - Fetch a specific chat conversation
export async function GET(
    request: Request,
    { params }: { params: { chatId: string } }
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
            console.log(error);
            return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const chatsCollection = db.collection<ChatConversation>('chats');

        const chat = await chatsCollection.findOne({
            _id: chatObjectId,
            userId: userObjectId // Ensure the user owns this chat
        });

        if (!chat) {
            return NextResponse.json({ message: 'Chat not found or unauthorized' }, { status: 404 });
        }

        // Return the full chat object, converting ObjectId to string for the client
        const chatResponse = {
            ...chat,
            _id: chat._id.toString(),
            userId: chat.userId.toString(), // Convert userId ObjectId to string
             // Ensure messages timestamps are strings or numbers suitable for JSON
            messages: chat.messages.map(msg => ({
                ...msg,
                timestamp: msg.timestamp.toISOString() // Or keep as Date object if client handles it
            }))
        };


        return NextResponse.json(chatResponse, { status: 200 });

    } catch (error) {
        console.error(`Error in GET /api/chats/${params.chatId}:`, error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}


// DELETE /api/chats/[chatId] - Delete a specific chat conversation
export async function DELETE(
    request: Request,
    { params }: { params: { chatId: string } }
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
            console.error(error);
            return NextResponse.json({ message: 'Invalid ID format' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const chatsCollection = db.collection('chats');

        const deleteResult = await chatsCollection.deleteOne({
            _id: chatObjectId,
            userId: userObjectId // Ensure the user owns this chat before deleting
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