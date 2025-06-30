import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../../lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";
import { checkRateLimit } from "@/lib/checkRateLimit";

interface UserDocument {
  _id: ObjectId;
  affirmations?: string[];
}

const MAX_AFFIRMATION_LENGTH = 500;
const DEFAULT_DB_NAME = process.env.MONGODB_DB || "Flowivate";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rateLimitResponse = await checkRateLimit(
      userId,
      "/api/features/affirmations",
      10
    );
    if (rateLimitResponse) return rateLimitResponse;

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error(
        "Invalid user ID format for GET /api/features/affirmations:",
        userId,
        error
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const usersCollection = db.collection<UserDocument>("users");

    const user = await usersCollection.findOne(
      { _id: userObjectId },
      { projection: { affirmations: 1 } }
    );

    if (!user) {
      return NextResponse.json({ affirmations: [] }, { status: 200 });
    }

    const affirmations = user.affirmations || [];
    return NextResponse.json({ affirmations }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/features/affirmations:", error);
    return NextResponse.json(
      { message: "Failed to retrieve affirmations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rateLimitResponse = await checkRateLimit(
      userId,
      "/api/features/affirmations",
      5
    );
    if (rateLimitResponse) return rateLimitResponse;

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error(
        "Invalid user ID format for POST /api/features/affirmations:",
        userId,
        error
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }

    let affirmationText: string;
    try {
      const body = await request.json();
      affirmationText = body.affirmation;
    } catch (error) {
      console.error(
        "Error parsing request body for POST /api/features/affirmations:",
        error
      );
      return NextResponse.json(
        {
          message: 'Invalid request body. Expected { "affirmation": "text" }.',
        },
        { status: 400 }
      );
    }

    if (
      !affirmationText ||
      typeof affirmationText !== "string" ||
      affirmationText.trim().length === 0
    ) {
      return NextResponse.json(
        {
          message:
            "Affirmation text is required and must be a non-empty string.",
        },
        { status: 400 }
      );
    }

    const trimmedAffirmation = affirmationText.trim();

    if (trimmedAffirmation.length > MAX_AFFIRMATION_LENGTH) {
      return NextResponse.json(
        {
          message: `Affirmation exceeds maximum length of ${MAX_AFFIRMATION_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const usersCollection = db.collection<UserDocument>("users");

    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      { $push: { affirmations: trimmedAffirmation } }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(
        `User not found for affirmation update during POST /api/features/affirmations: ${userId}`
      );
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: "Affirmation added successfully",
        affirmation: trimmedAffirmation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/features/affirmations:", error);
    return NextResponse.json(
      { message: "Failed to add affirmation" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const rateLimitResponse = await checkRateLimit(
      userId,
      "/api/features/affirmations",
      5
    );
    if (rateLimitResponse) return rateLimitResponse;

    let userObjectId: ObjectId;
    try {
      userObjectId = new ObjectId(userId);
    } catch (error) {
      console.error(
        "Invalid user ID format for DELETE /api/features/affirmations:",
        userId,
        error
      );
      return NextResponse.json(
        { message: "Invalid user identifier" },
        { status: 400 }
      );
    }

    let affirmationText: string;
    try {
      const body = await request.json();
      affirmationText = body.affirmation;
    } catch (error) {
      console.error(
        "Error parsing request body for DELETE /api/features/affirmations:",
        error
      );
      return NextResponse.json(
        {
          message: 'Invalid request body. Expected { "affirmation": "text" }.',
        },
        { status: 400 }
      );
    }

    if (
      !affirmationText ||
      typeof affirmationText !== "string" ||
      affirmationText.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "Affirmation text is required for deletion." },
        { status: 400 }
      );
    }

    const trimmedAffirmation = affirmationText.trim();

    if (trimmedAffirmation.length > MAX_AFFIRMATION_LENGTH) {
      return NextResponse.json(
        {
          message: `Affirmation for deletion exceeds maximum plausible length of ${MAX_AFFIRMATION_LENGTH} characters.`,
        },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(DEFAULT_DB_NAME);
    const usersCollection = db.collection<UserDocument>("users");

    const updateResult = await usersCollection.updateOne(
      { _id: userObjectId },
      { $pull: { affirmations: trimmedAffirmation } }
    );

    if (updateResult.matchedCount === 0) {
      console.warn(
        `User not found for affirmation deletion during DELETE /api/features/affirmations: ${userId}`
      );
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: "Affirmation not found in user list" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Affirmation deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/features/affirmations:", error);
    return NextResponse.json(
      { message: "Failed to delete affirmation" },
      { status: 500 }
    );
  }
}
