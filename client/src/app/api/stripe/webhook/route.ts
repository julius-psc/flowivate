// app/api/stripe/webhook/route.ts
import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  // Handle event types
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;

    await connectToDB();

    await User.findByIdAndUpdate(userId, {
      stripeCustomerId: session.customer,
      subscriptionStatus: "active",
      subscriptionPriceId: session.metadata?.priceId,
    });

    console.log("✅ User subscription updated");
  }

  return NextResponse.json({ received: true });
}