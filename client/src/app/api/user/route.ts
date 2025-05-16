import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongoose";
import { authOptions } from "@/lib/authOptions";
import User from "../../models/User";

const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 30;
const MAX_EMAIL_LENGTH = 100;
const BCRYPT_SALT_ROUNDS = 10;

interface ProfileUpdateBody {
  username?: string;
  email?: string;
}

interface PasswordUpdateBody {
  currentPassword: string;
  newPassword: string;
}

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

async function getUserObjectId(): Promise<mongoose.Types.ObjectId | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isValidObjectId(session.user.id)) {
    console.error(`Invalid or missing user ID in session: ${session?.user?.id ?? "none"}`);
    return null;
  }
  return new mongoose.Types.ObjectId(session.user.id);
}


export async function GET() {
  const userObjectId = await getUserObjectId();
  if (!userObjectId) {
    return NextResponse.json(
      { message: "Unauthorized or invalid user session" },
      { status: 401 }
    );
  }

  await connectDB();

  // findById returns a Document with createdAt on it
  const user = await User.findById(userObjectId)
    .select("createdAt")
    .exec();

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json(
    { joinedDate: user.createdAt },
    { status: 200 }
  );
}


export async function PUT(request: NextRequest) {
  const userObjectId = await getUserObjectId();
  if (!userObjectId) {
    return NextResponse.json(
      { message: "Unauthorized or invalid user session" },
      { status: 401 }
    );
  }

  let body: ProfileUpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { username, email } = body;
  if (!username && !email) {
    return NextResponse.json(
      { message: "Username or email required" },
      { status: 400 }
    );
  }

  const updateData: ProfileUpdateBody = {};
  if (username) {
    const trimmed = username.trim();
    if (trimmed.length < 3 || trimmed.length > MAX_USERNAME_LENGTH) {
      return NextResponse.json(
        { message: `Username must be 3–${MAX_USERNAME_LENGTH} characters` },
        { status: 400 }
      );
    }
    updateData.username = trimmed;
  }
  if (email) {
    const lower = email.trim().toLowerCase();
    if (!isValidEmail(lower) || lower.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }
    updateData.email = lower;
  }

  await connectDB();

  // check for uniqueness
  if (updateData.username || updateData.email) {
    const conflict = await User.findOne({
      $or: [
        ...(updateData.username ? [{ username: updateData.username }] : []),
        ...(updateData.email ? [{ email: updateData.email }] : []),
      ],
      _id: { $ne: userObjectId },
    }).lean();
    if (conflict) {
      return NextResponse.json(
        {
          message:
            conflict.email === updateData.email
              ? "Email already in use"
              : "Username already taken",
        },
        { status: 409 }
      );
    }
  }

  const updated = await User.findByIdAndUpdate(
    userObjectId,
    { $set: updateData },
    { new: true, runValidators: true, select: "email username" }
  ).exec();

  if (!updated) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      success: true,
      message: "Profile updated successfully",
      user: { email: updated.email, username: updated.username },
    },
    { status: 200 }
  );
}


export async function PATCH(request: NextRequest) {
  const userObjectId = await getUserObjectId();
  if (!userObjectId) {
    return NextResponse.json(
      { message: "Unauthorized or invalid user session" },
      { status: 401 }
    );
  }

  let body: PasswordUpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { message: "Current and new passwords required" },
      { status: 400 }
    );
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 }
    );
  }

  await connectDB();

  const user = await User.findById(userObjectId).exec();
  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }
  if (!user.password) {
    return NextResponse.json(
      { message: "Password update not supported for OAuth-only accounts" },
      { status: 400 }
    );
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return NextResponse.json(
      { message: "Incorrect current password" },
      { status: 401 }
    );
  }
  if (currentPassword === newPassword) {
    return NextResponse.json(
      { message: "New password must differ from current password" },
      { status: 400 }
    );
  }

  user.password = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
  await user.save();

  return NextResponse.json(
    { success: true, message: "Password updated successfully" },
    { status: 200 }
  );
}


export async function DELETE() {
  const userObjectId = await getUserObjectId();
  if (!userObjectId) {
    return NextResponse.json(
      { message: "Unauthorized or invalid user session" },
      { status: 401 }
    );
  }

  await connectDB();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const deleted = await User.findByIdAndDelete(userObjectId, { session });
      if (!deleted) throw new Error("User not found");

      // Cascade-delete related docs
      await mongoose.model("layouts").deleteOne({ userId: userObjectId }, { session });
      await mongoose.model("task_lists").deleteMany({ userId: userObjectId }, { session });
      await mongoose.model("journalEntries").deleteMany({ userId: userObjectId }, { session });
      await mongoose.model("sleep").deleteMany({ userId: userObjectId }, { session });
      await mongoose.model("moods").deleteMany({ userId: userObjectId }, { session });
      await mongoose.model("pomodoro").deleteOne({ userId: userObjectId }, { session });
    });
  } finally {
    session.endSession();
  }

  return NextResponse.json(
    { success: true, message: "Account and data deleted successfully" },
    { status: 200 }
  );
}
