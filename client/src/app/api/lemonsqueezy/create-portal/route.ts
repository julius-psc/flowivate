import { NextResponse } from "next/server";
import { getSubscription } from "@lemonsqueezy/lemonsqueezy.js";
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

        configureLemonSqueezy();
        await connectToDB();

        const user = await User.findOne({ email: session.user.email });

        if (!user || !user.lemonSqueezySubscriptionId) {
            return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
        }

        const { data, error } = await getSubscription(parseInt(user.lemonSqueezySubscriptionId));

        if (error) {
            console.error("Lemon Squeezy Get Subscription Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const portalUrl = data?.data?.attributes?.urls?.customer_portal;

        if (!portalUrl) {
            return NextResponse.json({ error: "Portal URL not found" }, { status: 500 });
        }

        return NextResponse.json({ url: portalUrl });

    } catch (err: unknown) {
        console.error("Error creating portal session:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
