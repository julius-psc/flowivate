import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import clientPromise from "../../../lib/mongodb";
import { FeatureKey } from "@/components/dashboard/features/featureMap";

// GET endpoint to retrieve layout
export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    
    const client = await clientPromise;
    const db = client.db("Flowivate");
    const layoutsCollection = db.collection("layouts");

    const userLayout = await layoutsCollection.findOne({ email });

    if (!userLayout) {
      return NextResponse.json({ features: [] }, { status: 200 });
    }

    return NextResponse.json({ features: userLayout.features }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/layout:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to save layout
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email;
    const { features } = await request.json() as { features: FeatureKey[] };
    
    if (!Array.isArray(features)) {
      return NextResponse.json({ message: "Invalid features format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("Flowivate");
    const layoutsCollection = db.collection("layouts");

    // Upsert layout - update if exists, insert if doesn't
    await layoutsCollection.updateOne(
      { email },
      { $set: { email, features, updatedAt: new Date() } },
      { upsert: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in POST /api/layout:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}