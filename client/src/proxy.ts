import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
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
        "/((?!_next/static|_next/image|favicon.ico|icon.png|public|api/auth|api/lemonsqueezy/webhook|api/stripe/webhook).*)",
    ],
};

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── App lock / waitlist redirect ──────────────────────────────────────────
    const isAppLocked = process.env.NEXT_PUBLIC_APP_LOCKED === 'true';
    const isAlwaysPublic = ALWAYS_PUBLIC_PATHS.some((path) => pathname.startsWith(path));

    if (!isAlwaysPublic && isAppLocked) {
        const earlyAccessCookie = request.cookies.get('earlyAccess')?.value;
        if (earlyAccessCookie !== 'granted') {
            const url = request.nextUrl.clone();
            url.pathname = WAITLIST_PATH;
            return NextResponse.redirect(url);
        }
    }

    // ── Auth protection (Edge-compatible via JWT decode, no bcrypt) ───────────
    // NextAuth v5 uses "authjs.session-token" cookie (not "next-auth.session-token")
    // In production (HTTPS), the cookie is prefixed with "__Secure-"
    const isSecure = request.nextUrl.protocol === "https:";
    const cookieName = isSecure
        ? "__Secure-authjs.session-token"
        : "authjs.session-token";

    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
        cookieName,
        salt: cookieName,
    });
    const isLoggedIn = !!token;

    const isAuthPage =
        pathname.startsWith("/login") ||
        pathname.startsWith("/register") ||
        pathname.startsWith("/forgot-password") ||
        pathname.startsWith("/reset-password");

    const isProtectedRoute = pathname.startsWith("/dashboard");

    const isProtectedApi =
        pathname.startsWith("/api/features") ||
        pathname.startsWith("/api/stats") ||
        pathname.startsWith("/api/layout") ||
        pathname.startsWith("/api/user") ||
        pathname.startsWith("/api/ai") ||
        pathname.startsWith("/api/chats") ||
        pathname.startsWith("/api/claude");

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
    }

    // Redirect unauthenticated users to login for protected routes
    if (isProtectedRoute && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(pathname + request.nextUrl.search);
        return NextResponse.redirect(
            new URL(`/login?callbackUrl=${callbackUrl}`, request.nextUrl)
        );
    }

    // Return 401 for unauthenticated API requests to protected endpoints
    if (isProtectedApi && !isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Rate limiting (API routes only) ───────────────────────────────────────
    if (!pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    if (!ratelimit) {
        if (process.env.NODE_ENV === "development") {
            console.warn("Upstash Redis not configured, skipping rate limiting.");
        }
        return NextResponse.next();
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0] : "127.0.0.1";
    const identifier = process.env.NODE_ENV === "development" ? "dev-user" : ip;

    const { success, pending, limit, reset, remaining } = await ratelimit.limit(identifier);
    await pending;

    const res = success
        ? NextResponse.next()
        : NextResponse.json({ message: "Too Many Requests" }, { status: 429 });

    res.headers.set("X-RateLimit-Limit", limit.toString());
    res.headers.set("X-RateLimit-Remaining", remaining.toString());
    res.headers.set("X-RateLimit-Reset", reset.toString());

    return res;
}
