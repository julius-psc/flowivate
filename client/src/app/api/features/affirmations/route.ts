import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import clientPromise from '../../../../lib/mongodb' // Adjust path if needed
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from 'mongodb';

interface UserDocument {
  _id: ObjectId;
  affirmations?: string[]; // Affirmations are optional and an array of strings
}

// --- GET Handler: Fetch user's affirmations ---
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Invalid user ID format for affirmations GET:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(); // Ensure your DB name is configured if not default
    const usersCollection = db.collection<UserDocument>('users'); // Use interface for type safety

    const user = await usersCollection.findOne({ _id: userObjectId }, {
      projection: { affirmations: 1 } // Only fetch the affirmations field
    });

    if (!user) {
      console.warn(`User not found during affirmations GET: ${userId}`);
      // It's okay if the user doesn't exist in the DB despite a valid session (e.g., deleted)
      // Or maybe the user document simply doesn't have the affirmations field yet.
      // Return empty array in both cases.
      return NextResponse.json({ affirmations: [] }, { status: 200 });
    }

    // Default to an empty array if affirmations field is null, undefined, or missing
    const affirmations = user.affirmations || [];
    return NextResponse.json({ affirmations }, { status: 200 });

  } catch (error) {
    console.error('Error in GET /api/features/affirmations:', error);
    return NextResponse.json({ message: 'Internal server error fetching affirmations' }, { status: 500 });
  }
}

// --- POST Handler: Add a new affirmation ---
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Invalid user ID format for affirmations POST:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    let affirmation: string;
    try {
      // Expecting a JSON body like: { "affirmation": "Your new affirmation text" }
      const body = await request.json();
      affirmation = body.affirmation;
    } catch (error) {
        console.error('Error parsing request body for affirmation:', error);
        return NextResponse.json({ message: 'Invalid request body. Expected { "affirmation": "text" }.' }, { status: 400 });
    }


    // Validate that affirmation is provided and is a non-empty string
    if (!affirmation || typeof affirmation !== 'string' || affirmation.trim().length === 0) {
      return NextResponse.json({ message: 'Valid, non-empty affirmation string is required' }, { status: 400 });
    }

    const trimmedAffirmation = affirmation.trim(); // Use the trimmed version

    const client = await clientPromise;
    const db = client.db(); // Ensure your DB name is configured
    const usersCollection = db.collection<UserDocument>('users');

    // Update user by _id, adding the new affirmation to the 'affirmations' array
    // Using $push to append to the array.
    // If the 'affirmations' field doesn't exist, $push will create it.
    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      { $push: { affirmations: trimmedAffirmation } }
      // No upsert: true needed. We only add affirmations to existing users identified by session.
    );

    if (updateResult.matchedCount === 0) {
         // This case might happen if the user was deleted between session creation and this request
         console.warn(`User not found for affirmation update: ${userId}`);
         return NextResponse.json({ message: 'User not found for update' }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
        // This could happen if the update operation technically succeeded but didn't change the document
        // (though $push should typically modify). Log a warning just in case.
        console.warn(`Affirmation might not have been added for user ${userId}, though user was matched.`);
    } else {
        console.log(`Affirmation added for user ${userId}`); // Log success
    }

    // Return the newly added affirmation along with success message
    return NextResponse.json({ message: 'Affirmation added successfully', affirmation: trimmedAffirmation }, { status: 201 }); // 201 Created status

  } catch (error) {
    console.error('Error in POST /api/features/affirmations:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return NextResponse.json({ message: 'Internal server error adding affirmation' }, { status: 500 });
  }
}

// --- DELETE Handler: Remove an affirmation ---
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    let userObjectId: ObjectId;

    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error('Invalid user ID format for affirmations DELETE:', userId, error);
      return NextResponse.json({ message: 'Invalid user ID format' }, { status: 400 });
    }

    let affirmation: string;
    try {
      // Expecting a JSON body like: { "affirmation": "The affirmation text to delete" }
      const body = await request.json();
      affirmation = body.affirmation;
    } catch (error) {
      console.error('Error parsing request body for affirmation deletion:', error);
      return NextResponse.json({ message: 'Invalid request body. Expected { "affirmation": "text" }.' }, { status: 400 });
    }

    // Validate that affirmation is provided and is a non-empty string
    if (!affirmation || typeof affirmation !== 'string' || affirmation.trim().length === 0) {
      return NextResponse.json({ message: 'Valid affirmation string is required for deletion' }, { status: 400 });
    }

    const trimmedAffirmation = affirmation.trim();

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection<UserDocument>('users');

    // Update user by _id, removing the specified affirmation from the 'affirmations' array
    // Using $pull to remove all instances of the exact string from the array
    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      { $pull: { affirmations: trimmedAffirmation } }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(`User not found for affirmation deletion: ${userId}`);
      return NextResponse.json({ message: 'User not found for deletion' }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0 && updateResult.matchedCount === 1) {
      // This could happen if the affirmation wasn't found in the array
      console.warn(`Affirmation "${trimmedAffirmation}" not found for user ${userId}`);
      return NextResponse.json({ message: 'Affirmation not found' }, { status: 404 });
    }

    console.log(`Affirmation deleted for user ${userId}`);
    return NextResponse.json({ message: 'Affirmation deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error in DELETE /api/features/affirmations:', error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return NextResponse.json({ message: 'Internal server error deleting affirmation' }, { status: 500 });
  }
}