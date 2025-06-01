import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ subscriptionStatus: "free" });
  }

  await connectToDB();

  const user = await User.findOne({ email: session.user.email });

  return NextResponse.json({
    subscriptionStatus: user?.subscriptionStatus ?? "free",
  });
}
