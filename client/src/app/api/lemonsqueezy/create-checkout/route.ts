import { NextResponse } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import connectToDB from "@/lib/mongoose";
import User from "@/app/models/User";
import { auth } from "@/lib/auth";
import { configureLemonSqueezy } from "@/lib/lemonsqueezy";

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { variantId, redirectUrl } = await req.json();

        if (!variantId) {
            return NextResponse.json({ error: "Missing variantId" }, { status: 400 });
        }

        configureLemonSqueezy();
        await connectToDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const storeId = process.env.LEMONSQUEEZY_STORE_ID;

        if (!storeId) {
            return NextResponse.json({ error: "Store ID not configured" }, { status: 500 });
        }

        const checkoutObject = {
            checkoutOptions: {
                embed: false,
                media: false,
                buttonColor: "#2DD272",
            },
            checkoutData: {
                email: user.email,
                custom: {
                    userId: user._id.toString(),
                },
            },
            productOptions: {
                enabledVariants: [parseInt(variantId)],
                redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                receiptButtonText: "Go to Dashboard",
                receiptThankYouNote: "Thank you for subscribing to Flowivate Elite!",
            },
        };

        const { data, error } = await createCheckout(
            parseInt(storeId),
            parseInt(variantId),
            checkoutObject
        );

        if (error) {
            console.error("Lemon Squeezy Checkout Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!data?.data?.attributes?.url) {
            return NextResponse.json({ error: "Failed to create checkout URL" }, { status: 500 });
        }

        return NextResponse.json({ url: data.data.attributes.url });

    } catch (err: unknown) {
        console.error("Error creating checkout session:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
