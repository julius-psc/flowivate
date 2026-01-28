import { NextResponse } from "next/server";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ subscriptionStatus: "free" });
  }

  await connectToDB();

  const user = await User.findOne({ email: session.user.email });

  return NextResponse.json({
    subscriptionStatus: user?.subscriptionStatus ?? "free",
    nextInvoiceDate: user?.lemonSqueezyRenewsAt ? new Date(user.lemonSqueezyRenewsAt).toLocaleDateString() : null,
  });
}