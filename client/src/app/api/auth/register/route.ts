// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db("Flowivate");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    // Create new user
    await db.collection("users").insertOne({
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}