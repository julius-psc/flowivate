import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcrypt";

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_SALT_ROUNDS = 10;
const USER_COLLECTION = "users";

interface UserDocument {
  _id: ObjectId;
  username?: string;
  email?: string;
  password?: string; 
}

interface ProfileUpdateBody {
  username?: string;
  email?: string;
}

interface PasswordUpdateBody {
  currentPassword?: string;
  newPassword?: string;
}

function isValidObjectId(id: string): boolean {
  if (typeof id !== "string") return false;
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getUserObjectId(): Promise<ObjectId | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return null;
  }
  if (!isValidObjectId(session.user.id)) {
    console.error(`Invalid user ID format in session: ${session.user.id}`);
    return null;
  }
  try {
    return new ObjectId(session.user.id);
  } catch (error) {
    console.error(
      "Error creating ObjectId from session user ID:",
      session.user.id,
      error
    );
    return null;
  }
}

export async function PUT(request: NextRequest) {
  let userObjectId: ObjectId | null = null;
  try {
    userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json(
        { message: "Unauthorized or invalid user session" },
        { status: 401 }
      );
    }

    let body: ProfileUpdateBody;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON in PUT /api/profile:`, jsonError);
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { username, email } = body;

    if (!username && !email) {
      return NextResponse.json(
        { message: "Username or email must be provided for update." },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};

    if (username !== undefined) {
      if (
        typeof username !== "string" ||
        username.trim().length < 3 ||
        username.trim().length > 30
      ) {
        return NextResponse.json(
          { message: "Username must be a string between 3 and 30 characters." },
          { status: 400 }
        );
      }
      // Add additional username validation if needed (e.g., allowed characters)
      updateData.username = username.trim();
    }

    if (email !== undefined) {
      if (typeof email !== "string" || !isValidEmail(email)) {
        return NextResponse.json(
          { message: "Invalid email format provided." },
          { status: 400 }
        );
      }
      updateData.email = email.toLowerCase().trim(); // Store emails consistently
    }

    const client: MongoClient = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection<UserDocument>(USER_COLLECTION);

    if (updateData.email) {
      const existingUser = await usersCollection.findOne({
        email: updateData.email,
        _id: { $ne: userObjectId },
      });
      if (existingUser) {
        return NextResponse.json(
          { message: "Email is already associated with another account." },
          { status: 409 }
        ); // 409 Conflict
      }
    }

    if (updateData.username) {
      const existingUser = await usersCollection.findOne({
        username: updateData.username,
        _id: { $ne: userObjectId },
      });
      if (existingUser) {
        return NextResponse.json(
          { message: "Username is already taken." },
          { status: 409 }
        ); // 409 Conflict
      }
    }

    const result = await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profile updated successfully",
        updatedFields: Object.keys(updateData),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/profile:", error);
    return NextResponse.json(
      { message: "Failed to update profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  let userObjectId: ObjectId | null = null;
  try {
    userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json(
        { message: "Unauthorized or invalid user session" },
        { status: 401 }
      );
    }

    let body: PasswordUpdateBody;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error(`Error parsing JSON in PATCH /api/profile:`, jsonError);
      return NextResponse.json(
        { message: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required." },
        { status: 400 }
      );
    }

    if (
      typeof newPassword !== "string" ||
      newPassword.length < MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        {
          message: `New password must be a string of at least ${MIN_PASSWORD_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const client: MongoClient = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection<UserDocument>(USER_COLLECTION);

    const user = await usersCollection.findOne({ _id: userObjectId });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Check if the user has a password set (might not if OAuth only)
    if (!user.password) {
      return NextResponse.json(
        {
          message:
            "Cannot update password. No current password is set for this account (possibly OAuth login only).",
        },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Incorrect current password provided." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "New password cannot be the same as the current password." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    await usersCollection.updateOne(
      { _id: userObjectId },
      { $set: { password: hashedPassword } }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PATCH /api/profile:", error);
    return NextResponse.json(
      { message: "Failed to update password" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  let userObjectId: ObjectId | null = null;
  try {
    userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json(
        { message: "Unauthorized or invalid user session" },
        { status: 401 }
      );
    }

    const client: MongoClient = await clientPromise;
    const db = client.db(DB_NAME);
    const usersCollection = db.collection(USER_COLLECTION);

    const result = await usersCollection.deleteOne({
      _id: userObjectId,
    });

    if (result.deletedCount === 0) {
      // This technically shouldn't happen if getUserObjectId succeeded, but good safety check
      return NextResponse.json(
        { message: "User not found for deletion" },
        { status: 404 }
      );
    }

    await db.collection("layouts").deleteOne({ userId: userObjectId });
    await db.collection("task_lists").deleteMany({ userId: userObjectId });
    await db.collection("journalEntries").deleteMany({ userId: userObjectId });
    await db.collection("sleep").deleteMany({ userId: userObjectId });
    await db.collection("moods").deleteMany({ userId: userObjectId });
    await db.collection("pomodoro").deleteOne({ userId: userObjectId });

    return NextResponse.json(
      {
        success: true,
        message: "Account deleted successfully",
      },
      { status: 200 }
    ); // 200 or 204
  } catch (error) {
    console.error("Error in DELETE /api/profile:", error);
    return NextResponse.json(
      { message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
