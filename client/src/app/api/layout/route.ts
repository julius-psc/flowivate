import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/authOptions";
import { ObjectId } from "mongodb";
import { FeatureKey } from "@/components/dashboard/features/featureMap"; // Assuming this import is correct

const DB_NAME = process.env.MONGODB_DB || "Flowivate";
const COLLECTION_NAME = "layouts";

interface LayoutDocument {
  _id: ObjectId;
  userId: ObjectId;
  features: FeatureKey[];
  createdAt: Date;
  updatedAt: Date;
}

interface LayoutResponse {
  _id: string;
  userId: string;
  features: FeatureKey[];
  createdAt: string;
  updatedAt: string;
}

function isValidObjectId(id: string): boolean {
  if (typeof id !== 'string') return false;
  return ObjectId.isValid(id) && (new ObjectId(id).toString() === id);
}

const transformLayoutForResponse = (doc: LayoutDocument | null): LayoutResponse | null => {
    if (!doc) return null;
    return {
        _id: doc._id.toString(),
        userId: doc.userId.toString(),
        features: doc.features,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
};


export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
        console.error(`Error in GET /api/layout: Invalid session user ID format - ${userId}`);
        return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const layoutsCollection = db.collection<LayoutDocument>(COLLECTION_NAME);

    const userLayoutDoc = await layoutsCollection.findOne({ userId: userObjectId });

    if (!userLayoutDoc) {
      // Return an empty features array or a default layout if preferred
      return NextResponse.json({ features: [] }, { status: 200 });
    }

    // For consistency, if we returned the full layout, we'd transform it.
    // Since only features are returned, no transformation on this specific path is strictly needed,
    // but if more fields were returned, transformLayoutForResponse(userLayoutDoc) would be used.
    return NextResponse.json({ features: userLayoutDoc.features }, { status: 200 });

  } catch (error) {
    console.error("Error in GET /api/layout:", error);
    return NextResponse.json({ message: "Failed to retrieve layout" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    if (!isValidObjectId(userId)) {
        console.error(`Error in POST /api/layout: Invalid session user ID format - ${userId}`);
        return NextResponse.json({ message: "Invalid user identifier" }, { status: 400 });
    }
    const userObjectId = new ObjectId(userId);

    let requestBody;
    try {
        requestBody = await request.json() as { features: FeatureKey[] };
    } catch (jsonError) {
        console.error(`Error parsing JSON in POST /api/layout:`, jsonError);
        return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    
    const { features } = requestBody;
    
    if (!Array.isArray(features) || !features.every(f => typeof f === 'string')) { // Basic check, assuming FeatureKey are strings
      return NextResponse.json({ message: "Features must be an array of valid feature keys." }, { status: 400 });
    }
    // Add more specific validation for FeatureKey values if FeatureKey is an enum or specific set of strings.

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    const layoutsCollection = db.collection<LayoutDocument>(COLLECTION_NAME);

    const now = new Date();
    const result = await layoutsCollection.updateOne(
      { userId: userObjectId },
      { 
        $set: { features: features, updatedAt: now },
        $setOnInsert: { userId: userObjectId, createdAt: now, _id: new ObjectId() }
      },
      { upsert: true }
    );

    if (!result.acknowledged) {
        console.error(`Error in POST /api/layout: DB operation not acknowledged for user ${userId}`);
        return NextResponse.json({ message: "Failed to save layout due to a database issue." }, { status: 500 });
    }
    
    // Optionally, fetch and return the saved layout
    const savedLayout = await layoutsCollection.findOne({ userId: userObjectId });

    return NextResponse.json(
        { 
            success: true, 
            message: "Layout saved successfully",
            layout: transformLayoutForResponse(savedLayout) // Return the full saved layout
        }, 
        { status: 200 }
    );

  } catch (error) {
    console.error("Error in POST /api/layout:", error);
    return NextResponse.json({ message: "Failed to save layout" }, { status: 500 });
  }
}