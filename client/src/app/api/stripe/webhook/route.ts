import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
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

  await connectToDB();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      await User.findByIdAndUpdate(userId, {
        stripeCustomerId: session.customer as string,
        subscriptionStatus: "active",
        subscriptionPriceId: session.metadata?.priceId,
      });

      console.log(`✅ [checkout.session.completed] User ${userId} is now active`);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { subscriptionStatus: "active" }
      );

      console.log(
        `✅ [invoice.payment_succeeded] Customer ${customerId} is active`
      );
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { subscriptionStatus: "canceled" }
      );

      console.log(
        `✅ [customer.subscription.deleted] Customer ${customerId} canceled`
      );
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await User.findOneAndUpdate(
        { stripeCustomerId: customerId },
        { subscriptionStatus: "past_due" }
      );

      console.log(
        `⚠️ [invoice.payment_failed] Customer ${customerId} payment failed`
      );
      break;
    }

    default: {
      console.log(`Unhandled event type: ${event.type}`);
      break;
    }
  }

  return NextResponse.json({ received: true });
}