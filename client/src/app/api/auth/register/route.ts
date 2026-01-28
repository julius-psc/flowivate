import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";
import mongoose from "mongoose";

type ErrorResponse = {
  error: string;
  code?: string;
  details?: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    const {
      email,
      username,
      password,
      persona,
      goals,
      workStyle,
      challenge,
      onboardingCompleted
    } = await request.json();

    if (!email || !username || !password) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Email, username, and password are required",
          code: "missing_fields",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Password must be at least 8 characters long",
          code: "weak_password",
        },
        { status: 400 }
      );
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return NextResponse.json<ErrorResponse>(
        {
          error: "Password must contain at least one uppercase letter, one lowercase letter, and one number",
          code: "weak_password",
        },
        { status: 400 }
      );
    }


    await connectDB();

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    }).exec();

    const lowerEmail = email.toLowerCase();

    if (existingUser) {
      if (!existingUser.password) {
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

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email: lowerEmail,
      username,
      password: hashedPassword,
      persona,
      goals,
      workStyle,
      challenge,
      onboardingCompleted: onboardingCompleted ?? false,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

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

    type MongoError = Error & { code?: number; message: string };
    const mongoError = error as MongoError;

    if (mongoError.code === 11000) {
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

    return NextResponse.json<ErrorResponse>(
      {
        error: "Registration failed due to an internal error.",
        code: "internal_error",
      },
      { status: 500 }
    );
  }
}