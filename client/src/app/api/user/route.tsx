import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { MongoClient, ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcrypt";

// Update user profile (username, email)
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { username, email } = await request.json();
    
    // Validate inputs
    if (!username && !email) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }
    
    const client: MongoClient = await clientPromise;
    const db = client.db("Flowivate");
    
    // Prepare update payload
    const updateData: Record<string, string> = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    
    // Check if email already exists (if changing email)
    if (email) {
      const existingUser = await db.collection("users").findOne({ 
        email, 
        _id: { $ne: new ObjectId(session.user.id) } 
      });
      
      if (existingUser) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 });
      }
    }
    
    // Update user
    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      updated: Object.keys(updateData)
    });
    
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Update password
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    // Validate inputs
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    
    const client: MongoClient = await clientPromise;
    const db = client.db("Flowivate");
    
    // Get current user
    const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { password: hashedPassword } }
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully" 
    });
    
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Delete user account
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const client: MongoClient = await clientPromise;
    const db = client.db("Flowivate");
    
    // Delete user
    const result = await db.collection("users").deleteOne({ 
      _id: new ObjectId(session.user.id) 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // TODO: Clean up any user-related data in other collections
    // Example: await db.collection("userPosts").deleteMany({ userId: session.user.id });
    
    return NextResponse.json({ 
      success: true, 
      message: "Account deleted successfully" 
    });
    
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}