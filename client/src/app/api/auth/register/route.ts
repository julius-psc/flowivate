import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    // --- Basic Input Validation ---
    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    // --- More Specific Input Validation ---
    if (password.length < 6) { 
        return NextResponse.json(
            { error: "Password must be at least 6 characters long" },
            { status: 400 }
        );
    }
  
    await connectDB(); // Connect to MongoDB using Mongoose

    // --- Check if user already exists (by email or username) ---
    // Using $or to check for either existing email or username
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }], 
    }).exec(); // .exec() returns a true Promise

    // --- Hash the password ---
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // --- Handle Existing User Scenarios ---
    if (existingUser) {
      // Scenario 1: User exists but doesn't have a password set
      if (!existingUser.password) {
        // Check if the username they are trying to register with is different
        // and if that new username is already taken by someone else (excluding themselves)
        if (username !== existingUser.username) {
            const usernameTaken = await User.findOne({ _id: { $ne: existingUser._id }, username: username }).exec();
            if (usernameTaken) {
                return NextResponse.json(
                    { error: "Username is already taken. Try a different one." },
                    { status: 409 } 
                );
            }
            existingUser.username = username; // Update username
        }

        existingUser.password = hashedPassword;
        await existingUser.save();

        return NextResponse.json(
          { message: "Account password set and updated successfully." },
          { status: 200 }
        );
      } else {
        // Scenario 2: User exists and already has a password (or username conflict)
        let errorMessage = "User already exists.";
        if (existingUser.email.toLowerCase() === email.toLowerCase() && existingUser.username === username) {
            errorMessage = "Account with this email and username already exists.";
        } else if (existingUser.email.toLowerCase() === email.toLowerCase()) {
            errorMessage = "Account with this email already exists.";
        } else if (existingUser.username === username) {
            errorMessage = "Username is already taken.";
        }
        return NextResponse.json(
          { error: errorMessage },
          { status: 409 }
        );
      }
    }

    // --- Create New User ---
    // `createdAt` and `updatedAt` will be automatically handled by Mongoose
    await User.create({
      email: email.toLowerCase(), // Store email in lowercase for consistency
      username,
      password: hashedPassword,
    });

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );

  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Handle Mongoose validation errors specifically for better feedback
    if (error instanceof mongoose.Error.ValidationError) {
      const errorMessages: { [key: string]: string } = {};
      for (const field in error.errors) {
        errorMessages[field] = error.errors[field].message;
      }
      return NextResponse.json(
        { error: "Validation failed", details: errorMessages },
        { status: 400 }
      );
    }

    // Handle Mongoose duplicate key errors (e.g., if unique constraint is violated)
    // Mongoose wraps these in a generic error, code 11000 is for duplicate key
    type MongoError = Error & { code?: number; message: string };
    const mongoError = error as MongoError;

    if (mongoError.code === 11000) {
      let field = "unknown";
      if (mongoError.message.includes('email_1')) field = 'email'; // Adjust based on your index name if needed
      if (mongoError.message.includes('username_1')) field = 'username';

      return NextResponse.json(
        { error: `An account with this ${field} already exists.` },
        { status: 409 } // 409 Conflict
      );
    }

    return NextResponse.json(
      { error: "Registration failed due to an internal error." },
      { status: 500 }
    );
  }
}