import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export function configureLemonSqueezy() {
    const apiKey = process.env.LEMONSQUEEZY_API_KEY;

    if (!apiKey) {
        throw new Error(
            "LEMONSQUEEZY_API_KEY is not defined in the environment variables."
        );
    }

    lemonSqueezySetup({
        apiKey,
        onError: (error: Error) => console.error("Lemon Squeezy Error:", error),
    });
}
