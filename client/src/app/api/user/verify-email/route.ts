import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongoose";
import User from "../../../models/User";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ message: "Token required" }, { status: 400 });
  }

  // Hash the incoming token to match what's stored in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  await connectDB();

  // Find a user with a valid (non-expired) token
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpires: { $gt: new Date() },
  }).exec();

  if (!user || !user.pendingEmail) {
    const url = new URL("/login", request.url);
    url.searchParams.set(
      "error",
      encodeURIComponent("Invalid or expired verification link.")
    );
    return NextResponse.redirect(url);
  }

  try {
    // Apply the pending email and clear verification fields
    user.email = user.pendingEmail;
    user.emailVerified = new Date();
    user.pendingEmail = null;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;

    await user.save();

    // Redirect to settings with success message
    const url = new URL("/dashboard/settings", request.url);
    url.searchParams.set("tab", "account");
    url.searchParams.set(
      "message",
      encodeURIComponent("Email address updated successfully!")
    );
    return NextResponse.redirect(url);
  } catch (err: unknown) {
    let errorMessage = "Failed to update email.";
    // Handle duplicate key (email already taken since request)
    if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
      errorMessage =
        "This email address has been taken by another account since you made the request.";
    }
    const url = new URL("/dashboard/settings", request.url);
    url.searchParams.set("tab", "account");
    url.searchParams.set("error", encodeURIComponent(errorMessage));
    return NextResponse.redirect(url);
  }
}