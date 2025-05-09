import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import clientPromise from '../../../../lib/mongodb';
import { authOptions } from "@/lib/authOptions";    
import { ObjectId } from 'mongodb';

interface UserStatusDocument {
  _id: ObjectId; 
  status?: string;
}

const DEFAULT_DB_NAME = "Flowivate"; // Your database name

function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!isValidObjectId(userId)) {
      console.error(`Error in GET /api/features/status: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: 'Invalid user identifier format' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const usersCollection = db.collection<UserStatusDocument>('users');
    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { status: 1 } } 
    );
    if (!user) {
      return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
    }

    const defaultStatus = 'Active'; 
    return NextResponse.json({ status: user.status || defaultStatus }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/features/status:', error);
    return NextResponse.json({ message: 'Failed to retrieve user status due to a server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    if (!isValidObjectId(userId)) {
      console.error(`Error in POST /api/features/status: Invalid session user ID format - ${userId}`);
      return NextResponse.json({ message: 'Invalid user identifier format' }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    let requestBody;
    try {
        requestBody = await request.json();
    } catch (parseError) {
        console.error("Error in POST /api/features/status: Invalid JSON payload", parseError);
        return NextResponse.json({ message: "Invalid request body. Expected JSON." }, { status: 400 });
    }

    const { status } = requestBody;

    const allowedStatuses = ["Active", "Focusing", "Idle", "DND"]; // Whitelist of allowed statuses
    if (!status || typeof status !== 'string' || !allowedStatuses.includes(status)) {
      return NextResponse.json({
        message: `Status is required and must be a string from the allowed list: ${allowedStatuses.join(', ')}.`,
      }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const usersCollection = db.collection('users');


    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { status: status } }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ message: 'User not found for status update' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Status updated successfully', status: status }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/features/status:', error);
    return NextResponse.json({ message: 'Failed to update user status due to a server error' }, { status: 500 });
  }
}