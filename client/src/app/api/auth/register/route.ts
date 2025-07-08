import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";
import mongoose from "mongoose";

type ErrorResponse = {
  error: string;
  code?: string; // optional machine-readable error code
  details?: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    // --- Basic Input Validation ---
    if (!email || !username || !password) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Email, username, and password are required",
          code: "missing_fields",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Password must be at least 6 characters long",
          code: "weak_password",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // --- Check if user exists by email or username ---
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    }).exec();

    const lowerEmail = email.toLowerCase();

    if (existingUser) {
      // User found

      // If user exists but password is empty (e.g. social login user without password)
      if (!existingUser.password) {
        // If trying to update username to another taken username (by someone else)
        if (username !== existingUser.username) {
          const usernameTaken = await User.findOne({
            _id: { $ne: existingUser._id },
            username,
          }).exec();

          if (usernameTaken) {
            return NextResponse.json<ErrorResponse>(
              {
                error: "Username is already taken. Try a different one.",
                code: "username_taken",
              },
              { status: 409 }
            );
          }
          existingUser.username = username;
        }

        existingUser.password = await bcrypt.hash(password, 10);
        await existingUser.save();

        return NextResponse.json(
          { message: "Account password set and updated successfully." },
          { status: 200 }
        );
      }

      // User has password - determine conflict reason
      const conflicts: string[] = [];
      if (existingUser.email.toLowerCase() === lowerEmail)
        conflicts.push("email");
      if (existingUser.username === username) conflicts.push("username");

      let errorMessage = "User already exists.";
      let errorCode = "user_exists";

      if (conflicts.length === 2) {
        errorMessage = "Account with this email and username already exists.";
        errorCode = "email_username_exists";
      } else if (conflicts.includes("email")) {
        errorMessage = "Account with this email already exists.";
        errorCode = "email_exists";
      } else if (conflicts.includes("username")) {
        errorMessage = "Username is already taken.";
        errorCode = "username_taken";
      }

      return NextResponse.json<ErrorResponse>(
        { error: errorMessage, code: errorCode },
        { status: 409 }
      );
    }

    // --- Create New User ---
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: lowerEmail,
      username,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Handle Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      const details: Record<string, string> = {};
      for (const key in error.errors) {
        details[key] = error.errors[key].message;
      }
      return NextResponse.json<ErrorResponse>(
        { error: "Validation failed", code: "validation_error", details },
        { status: 400 }
      );
    }

    // Handle Mongoose duplicate key errors
    type MongoError = Error & { code?: number; message: string };
    const mongoError = error as MongoError;

    if (mongoError.code === 11000) {
      // Extract duplicate key field from error message
      const message = mongoError.message.toLowerCase();
      let field = "field";
      if (message.includes("email")) field = "email";
      else if (message.includes("username")) field = "username";

      return NextResponse.json<ErrorResponse>(
        {
          error: `An account with this ${field} already exists.`,
          code: `${field}_exists`,
        },
        { status: 409 }
      );
    }

    // Fallback for unknown error shapes
    return NextResponse.json<ErrorResponse>(
      {
        error: "Registration failed due to an internal error.",
        code: "internal_error",
      },
      { status: 500 }
    );
  }
}
