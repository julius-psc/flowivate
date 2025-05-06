import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import clientPromise from '../../../../lib/mongodb';
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from 'mongodb'; // Import ObjectId

export async function GET() {
  try {
    // Use the correctly typed getServerSession with your authOptions
    const session = await getServerSession(authOptions);

    // Check for user ID in the session instead of email
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // Validate and convert the string ID to a MongoDB ObjectId
    try {
        userObjectId = new ObjectId(userId);
    } catch (error) {
      console.log(error);
        console.error('Invalid user ID format:', userId);
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Ensure your DB name is configured if not default
    const usersCollection = db.collection('users');

    // Find user by _id instead of email
    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      // Although the session exists, the user might have been deleted
      // Or handle this case as needed (e.g., return default status)
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Default to 'Active' if status is not set in the DB
    const defaultStatus = 'Active';
    return NextResponse.json({ status: user.status || defaultStatus }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/features/status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check for user ID in the session instead of email
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    // Validate and convert the string ID to a MongoDB ObjectId
    try {
        userObjectId = new ObjectId(userId);
    } catch (error) {
        console.log(error);
        console.error('Invalid user ID format:', userId);
        return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const { status } = await request.json();

    // Validate that status is provided and is one of the allowed values (optional but recommended)
    const allowedStatuses = ["Active", "Focusing", "Idle", "DND"];
    if (!status || typeof status !== 'string' || !allowedStatuses.includes(status)) {
      return NextResponse.json({ message: 'Valid status (Active, Focusing, Idle, DND) is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Ensure your DB name is configured
    const usersCollection = db.collection('users');

    // Update user by _id instead of email
    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { status } }
      // Removed upsert: true - We only want to update existing users identified by session ID.
      // If the user doesn't exist (despite having a session), something is wrong.
    );

    if (updateResult.matchedCount === 0) {
         return NextResponse.json({ message: 'User not found for update' }, { status: 404 });
    }

    console.log(`Status updated for user ${userId} to ${status}`); // Log success
    return NextResponse.json({ message: 'Status updated' }, { status: 200 });

  } catch (error) {
    console.error('Error in POST /api/features/status:', error);
    // Log the specific error if possible
    if (error instanceof Error) {
      console.error(error.message);
    }
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}