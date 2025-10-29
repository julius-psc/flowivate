import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongoose";
import User from "../../../models/User";
import { checkRateLimit } from "@/lib/checkRateLimit";
import mongoose from "mongoose";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

async function getUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id || !isValidObjectId(session.user.id)) {
    console.error(
      `Invalid or missing user ID in session: ${session?.user?.id ?? "none"}`
    );
    return null;
  }
  return session.user.id;
}

export async function POST(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized or invalid user session" },
      { status: 401 }
    );
  }

  const rateLimit = await checkRateLimit(userId, "avatar-upload", 5);
  if (rateLimit) return rateLimit;

  let formData;
  try {
    formData = await request.formData();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid request payload" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File;
  if (!file) {
    return NextResponse.json({ message: "No file provided" }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { message: "Invalid file type. Only images are allowed." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "File size must be 5MB or less." },
      { status: 400 }
    );
  }

  const fileExtension = file.name.split(".").pop();
  const blobName = `avatars/${userId}.${fileExtension}`;

  try {
    const blob = await put(blobName, file, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    await connectDB();
    await User.findByIdAndUpdate(userId, {
      $set: { image: blob.url },
    });

    return NextResponse.json({ newImageUrl: blob.url }, { status: 200 });
  } catch (error) {
    console.error("Failed to upload avatar:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload avatar.";
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}