import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { email, username, password } = await request.json();

    if (!email || !username || !password) {
      return NextResponse.json({ error: "Email, username, and password are required" }, { status: 400 });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("Flowivate");

    // Check if user already exists (by email or username)
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { username }],
    });
    
    // If user exists by email but doesn't have a password (social login only)
    if (existingUser && !existingUser.password) {
      // Update the existing social user with password and username
      await db.collection("users").updateOne(
        { _id: existingUser._id },
        { 
          $set: {
            username,
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
      
      return NextResponse.json({ message: "Account updated successfully" }, { status: 200 });
    }
    
    // If user already exists with password or username conflict
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or username already exists" },
        { status: 400 }
      );
    }

    // Create new user
    await db.collection("users").insertOne({
      email,
      username,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}