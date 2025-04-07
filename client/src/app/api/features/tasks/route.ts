import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const categoriesCollection = db.collection("categories");

    const categories = await categoriesCollection.find({ userEmail: email }).toArray();
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/tasks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { name, tasks } = await request.json();

    if (!name || !Array.isArray(tasks)) {
      return NextResponse.json({ message: "Name and tasks are required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const categoriesCollection = db.collection("categories");

    const result = await categoriesCollection.insertOne({
      name,
      tasks,
      userEmail: email,
    });

    return NextResponse.json({ id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/features/tasks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { id, tasks } = await request.json();

    if (!id || !ObjectId.isValid(id) || !Array.isArray(tasks)) {
      return NextResponse.json({ message: "Invalid ID or tasks" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const categoriesCollection = db.collection("categories");

    const result = await categoriesCollection.updateOne(
      { _id: new ObjectId(id), userEmail: email },
      { $set: { tasks } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ modified: result.modifiedCount }, { status: 200 });
  } catch (error) {
    console.error("Error in PUT /api/features/tasks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { id } = await request.json();

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const categoriesCollection = db.collection("categories");

    const result = await categoriesCollection.deleteOne({
      _id: new ObjectId(id),
      userEmail: email,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: result.deletedCount }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/features/tasks:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}