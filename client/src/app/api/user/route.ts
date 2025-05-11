import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongoose";
import { authOptions } from "@/lib/authOptions";

const MIN_PASSWORD_LENGTH = 8;
const MAX_USERNAME_LENGTH = 30;
const MAX_EMAIL_LENGTH = 100;
const BCRYPT_SALT_ROUNDS = 10;

// Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  username: { type: String, required: false, unique: true, trim: true },
  password: { type: String, required: false }, // Allow null for OAuth users
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

interface ProfileUpdateBody {
  username?: string;
  email?: string;
}

interface PasswordUpdateBody {
  currentPassword: string;
  newPassword: string;
}

// Validation Functions
const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

// Get Authenticated User ID
async function getUserObjectId(): Promise<mongoose.Types.ObjectId | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isValidObjectId(session.user.id)) {
    console.error(`Invalid or missing user ID in session: ${session?.user?.id || 'none'}`);
    return null;
  }
  return new mongoose.Types.ObjectId(session.user.id);
}

export async function PUT(request: NextRequest) {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    let body: ProfileUpdateBody;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing JSON in PUT /api/user:", error);
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const { username, email } = body;
    if (!username && !email) {
      return NextResponse.json({ message: "Username or email required" }, { status: 400 });
    }

    const updateData: ProfileUpdateBody = {};
    if (username) {
      if (typeof username !== "string" || username.trim().length < 3 || username.trim().length > MAX_USERNAME_LENGTH) {
        return NextResponse.json(
          { message: `Username must be 3-${MAX_USERNAME_LENGTH} characters` },
          { status: 400 }
        );
      }
      updateData.username = username.trim();
    }

    if (email) {
      if (typeof email !== "string" || !isValidEmail(email) || email.length > MAX_EMAIL_LENGTH) {
        return NextResponse.json({ message: "Invalid email format" }, { status: 400 });
      }
      updateData.email = email.trim().toLowerCase();
    }

    await connectDB();
    if (updateData.email || updateData.username) {
      const existingUser = await User.findOne({
        $or: [
          ...(updateData.email ? [{ email: updateData.email }] : []),
          ...(updateData.username ? [{ username: updateData.username }] : []),
        ],
        _id: { $ne: userObjectId },
      });

      if (existingUser) {
        return NextResponse.json(
          { message: updateData.email && existingUser?.email === updateData.email ? "Email already in use" : "Username already taken" },
          { status: 409 }
        );
      }
    }

    const user = await User.findByIdAndUpdate(
      userObjectId,
      { $set: updateData },
      { new: true, runValidators: true, select: "email username" }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: { email: user.email, username: user.username },
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in PUT /api/user:", error);
    if ((error as { code?: number })?.code === 11000) {
      return NextResponse.json({ message: "Username or email already exists" }, { status: 409 });
    }
    return NextResponse.json({ message: "Failed to update profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    let body: PasswordUpdateBody;
    try {
      body = await request.json();
    } catch (error) {
      console.error("Error parsing JSON in PATCH /api/user:", error);
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Current and new passwords required" }, { status: 400 });
    }

    if (typeof newPassword !== "string" || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findById(userObjectId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json(
        { message: "Password update not supported for OAuth-only accounts" },
        { status: 400 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ message: "Incorrect current password" }, { status: 401 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { message: "New password must differ from current password" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("Error in PATCH /api/user:", error);
    return NextResponse.json({ message: "Failed to update password" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const userObjectId = await getUserObjectId();
    if (!userObjectId) {
      return NextResponse.json({ message: "Unauthorized or invalid user session" }, { status: 401 });
    }

    await connectDB();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const user = await User.findByIdAndDelete(userObjectId, { session });
        if (!user) {
          throw new Error("User not found");
        }

        // Cascade delete related collections
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

    return NextResponse.json({
      success: true,
      message: "Account and associated data deleted successfully",
    }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in DELETE /api/user:", error);
    return NextResponse.json(
      { message: (error instanceof Error && error.message === "User not found") ? "User not found" : "Failed to delete account" },
      { status: error instanceof Error && error.message === "User not found" ? 404 : 500 }
    );
  }
}