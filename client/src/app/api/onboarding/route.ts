import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { persona, goals, workStyle, challenge } = await request.json();

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.persona = persona;
    user.goals = goals;
    user.workStyle = workStyle;
    user.challenge = challenge;
    user.onboardingCompleted = true;

    await user.save();

    return NextResponse.json(
      { message: "Onboarding completed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Onboarding completion error:", error);
    return NextResponse.json(
      { error: "Failed to complete onboarding" },
      { status: 500 }
    );
  }
}
