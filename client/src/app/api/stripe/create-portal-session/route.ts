import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { auth } from "@/lib/auth";

// NOTE: Stripe is deprecated in favor of LemonSqueezy.
// This route is kept for backward compatibility only.
// New users should use the LemonSqueezy portal endpoint instead.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
});

export async function POST() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Redirect to LemonSqueezy portal instead
  return NextResponse.json(
    { error: "Stripe billing portal is no longer available. Please use the LemonSqueezy portal." },
    { status: 410 }
  );
}