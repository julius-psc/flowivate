import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    console.log("[subscription] No session email, returning free");
    return NextResponse.json({ subscriptionStatus: "free" });
  }

  await connectToDB();

  const user = await User.findOne({ email: session.user.email });
  const status = user?.subscriptionStatus ?? "free";
  console.log("[subscription] email:", session.user.email, "dbStatus:", user?.subscriptionStatus, "returning:", status);

  return NextResponse.json({
    subscriptionStatus: status,
    nextInvoiceDate: user?.lemonSqueezyRenewsAt ? new Date(user.lemonSqueezyRenewsAt).toLocaleDateString() : null,
  });
}