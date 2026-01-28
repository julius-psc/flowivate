import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const hmac = crypto.createHmac(
            "sha256",
            process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
        );
        const digest = Buffer.from(
            hmac.update(rawBody).digest("hex"),
            "utf8"
        );
        const signature = Buffer.from(
            req.headers.get("x-signature") || "",
            "utf8"
        );

        if (!crypto.timingSafeEqual(digest, signature)) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);
        const { meta, data } = payload;
        const eventName = meta.event_name;
        const customData = meta.custom_data; // This is where userId should be

        // Connect to DB
        await connectToDB();

        console.log(`Received Lemon Squeezy event: ${eventName}`);

        if (!customData || !customData.userId) {
            // If userId is not in custom_data (e.g. renewal), we might need to look it up by subscriptionId or customerId
            // But for creation it's essential. For updates, we can use customerId stored in DB.
            // Let's try to proceed if we have a customerId/subscriptionId match in DB.
        }

        const userId = customData?.userId;
        let user;

        if (userId) {
            user = await User.findById(userId);
        } else if (data.attributes.customer_id) {
            // Fallback: try to find user by Lemon Squeezy customer ID
            user = await User.findOne({ lemonSqueezyCustomerId: data.attributes.customer_id.toString() });
        }

        if (!user) {
            console.error(`User not found for event: ${eventName} (UserId: ${userId}, CustomerId: ${data.attributes.customer_id})`);
            return NextResponse.json({ message: "User not found" }, { status: 200 }); // Return 200 to acknowledge webhook
        }

        switch (eventName) {
            case "subscription_created":
            case "subscription_updated":
            case "subscription_resumed":
            case "subscription_payment_success": {
                const attributes = data.attributes;
                const status = attributes.status; // active, past_due, unpaid, cancelled, expired, on_trial, paused

                await User.findByIdAndUpdate(user._id, {
                    lemonSqueezyCustomerId: attributes.customer_id.toString(),
                    lemonSqueezySubscriptionId: data.id.toString(),
                    lemonSqueezyVariantId: attributes.variant_id.toString(),
                    subscriptionStatus: status,
                    lemonSqueezyRenewsAt: new Date(attributes.renews_at),
                });

                console.log(`✅ User ${user._id} subscription updated to ${status}`);
                break;
            }

            case "subscription_cancelled": { // Sometimes subscription_updated sends "cancelled" status, but specific event too
                const attributes = data.attributes;
                await User.findByIdAndUpdate(user._id, {
                    subscriptionStatus: "cancelled",
                    lemonSqueezyRenewsAt: new Date(attributes.renews_at), // Ends at period end usually
                });
                console.log(`❌ User ${user._id} subscription cancelled`);
                break;
            }

            case "subscription_expired": {
                await User.findByIdAndUpdate(user._id, {
                    subscriptionStatus: "expired",
                });
                break;
            }

            default:
                console.log(`Unhandled event: ${eventName}`);
        }

        return NextResponse.json({ received: true });

    } catch (err: unknown) {
        console.error("Webhook processing failed:", err);
        return NextResponse.json({ error: "Webhook Error" }, { status: 500 });
    }
}
