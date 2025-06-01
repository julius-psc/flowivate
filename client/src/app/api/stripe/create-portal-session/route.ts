import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDB();

  const user = await User.findOne({ email: session.user.email });

  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer found" }, { status: 400 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`, 
  });

  return NextResponse.json({ url: portalSession.url });
}
