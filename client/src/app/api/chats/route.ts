import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route'; // Adjust path if needed
import clientPromise from '../../../lib/mongodb'; // Adjust path if needed
import { ObjectId } from 'mongodb';

interface Message {
    sender: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

interface ChatConversation {
    _id?: ObjectId; // Added by MongoDB
    userId: ObjectId;
    title: string;
    messages: Message[];
    createdAt: Date;
    updatedAt: Date;
}

// GET /api/chats - Fetch recent chat summaries for the logged-in user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        let userObjectId: ObjectId;
        try {
            userObjectId = new ObjectId(session.user.id);
        } catch (error) {
            console.log(error);
            console.error('Invalid user ID format:', session.user.id);
            return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const chatsCollection = db.collection<ChatConversation>('chats'); // Use a 'chats' collection

        // Fetch recent chats, sorted by update time, limit results
        const recentChats = await chatsCollection
            .find({ userId: userObjectId })
            .sort({ updatedAt: -1 }) // Show most recent first
            .limit(10) // Limit the number of recent chats shown
            .project({ // Only project necessary fields for summary
                _id: 1,
                title: 1,
                updatedAt: 1,
                // Optionally add a preview (e.g., first user message) if needed
                // preview: { $substr: [ "$messages.0.text", 0, 50 ] } // Example preview
            })
            .toArray();

        // Format the response
        const chatSummaries = recentChats.map(chat => ({
            id: chat._id.toString(),
            title: chat.title || 'Untitled Chat', // Fallback title
            // preview: chat.preview || '...', // Use preview if projected
            timestamp: chat.updatedAt.toISOString(), // Or format as needed
        }));

        return NextResponse.json(chatSummaries, { status: 200 });

    } catch (error) {
        console.error('Error in GET /api/chats:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/chats - Create a new chat or update an existing one
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        let userObjectId: ObjectId;
        try {
            userObjectId = new ObjectId(session.user.id);
        } catch (error) {
            console.log(error);
            console.error('Invalid user ID format:', session.user.id);
            return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
        }

        const { messages, conversationId } = await request.json();

        // Basic validation
        if (!Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ message: 'Messages array is required' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const chatsCollection = db.collection<ChatConversation>('chats');

        const now = new Date();
        // Use the first user message as a potential title, or generate one
        const potentialTitle = messages.find(m => m.sender === 'user')?.text.substring(0, 50) || 'New Chat';

        let resultConversationId: string;

        if (conversationId) {
            // --- Update existing conversation ---
            let chatObjectId: ObjectId;
            try {
                chatObjectId = new ObjectId(conversationId);
            } catch (error) {
                return NextResponse.json({ message: 'Invalid conversationId format' }, { status: 400 });
                console.log(error);
            }

            const updateResult = await chatsCollection.updateOne(
                { _id: chatObjectId, userId: userObjectId }, // Ensure user owns the chat
                {
                    $set: {
                        messages: messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })), // Ensure dates are stored correctly
                        updatedAt: now,
                        // Optionally update title if it's still the default
                        // title: { $cond: { if: { $eq: ["$title", "New Chat"] }, then: potentialTitle, else: "$title" } } // More complex update
                    },
                    $setOnInsert: { // Set these only if inserting (upsert case, though less likely here)
                        userId: userObjectId,
                        createdAt: now,
                        title: potentialTitle // Set initial title
                    }
                }
                // Consider adding upsert: true if you want POST to also create if ID doesn't exist
                // but it might be cleaner to separate create/update logic fully
            );

            if (updateResult.matchedCount === 0) {
                // If upsert is false (or not used), and no match, the chat doesn't exist or doesn't belong to the user
                 return NextResponse.json({ message: 'Chat not found or unauthorized' }, { status: 404 });
            }
             resultConversationId = conversationId; // Return the ID used for update

        } else {
             // --- Create new conversation ---
            const newChat: Omit<ChatConversation, '_id'> = {
                userId: userObjectId,
                title: potentialTitle, // Use the generated title
                messages: messages.map((m: Message) => ({ ...m, timestamp: new Date(m.timestamp) })), // Ensure dates
                createdAt: now,
                updatedAt: now,
            };

            const insertResult = await chatsCollection.insertOne(newChat);
            resultConversationId = insertResult.insertedId.toString(); // Return the new ID
        }


        return NextResponse.json({ message: 'Chat saved', conversationId: resultConversationId }, { status: 200 });

    } catch (error) {
        console.error('Error in POST /api/chats:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}