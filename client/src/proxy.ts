import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WAITLIST_PATH = '/waitlist';
const EARLY_ACCESS_PATH = '/early-access';

const ALWAYS_PUBLIC_PATHS = [
    WAITLIST_PATH,
    EARLY_ACCESS_PATH,
    '/api/early-access',
    '/api/auth',
    '/_next/static',
    '/_next/image',
    '/favicon.ico',
];

// Create a new ratelimiter, that allows 10 requests per 10 seconds
// You can adjust this as needed.
const ratelimit =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Ratelimit({
            redis: Redis.fromEnv(),
            limiter: Ratelimit.slidingWindow(50, "10 s"),
            analytics: true,
            prefix: "@upstash/ratelimit",
        })
        : null;

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
        "/api/:path*"
    ],
};

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // --- Proxy/Waitlist Logic ---
    const isAppLocked = process.env.NEXT_PUBLIC_APP_LOCKED === 'true';

    const isAlwaysPublic = ALWAYS_PUBLIC_PATHS.some((path) =>
        pathname.startsWith(path)
    );

    // If it's a public path, we generally allow it, 
    // BUT we still might want to rate limit API calls even if they are public.
    // However, the original proxy logic returned next() immediately.
    // Let's preserve proxy logic first for non-API routes or stick to the original flow.

    // Check for App Lock Redirection
    if (!isAlwaysPublic && isAppLocked) {
        const earlyAccessCookie = request.cookies.get('earlyAccess')?.value;
        const hasAccess = earlyAccessCookie === 'granted';

        if (!hasAccess) {
            const url = request.nextUrl.clone();
            url.pathname = WAITLIST_PATH;
            return NextResponse.redirect(url);
        }
    }

    // --- Rate Limiting Logic (Only for API) ---
    // Only rate limit API routes
    if (!request.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // If Upstash is not configured, we just proceed without rate limiting
    // Ideally, we should log this or handle it better in production
    if (!ratelimit) {
        if (process.env.NODE_ENV === "development") {
            console.warn("Upstash Redis not configured, skipping rate limiting.");
        }
        return NextResponse.next();
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";

    // Use a constant string for localhost to avoid issues with varying IPs in dev
    const identifier = process.env.NODE_ENV === "development" ? "dev-user" : ip;

    const { success, pending, limit, reset, remaining } = await ratelimit.limit(
        identifier
    );

    await pending;

    const res = success
        ? NextResponse.next()
        : NextResponse.json(
            { message: "Too Many Requests" },
            { status: 429 }
        );

    res.headers.set("X-RateLimit-Limit", limit.toString());
    res.headers.set("X-RateLimit-Remaining", remaining.toString());
    res.headers.set("X-RateLimit-Reset", reset.toString());

    return res;
}
