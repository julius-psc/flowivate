import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Next.js Middleware for route protection.
 * Redirects unauthenticated users away from protected routes (dashboard, API)
 * and redirects authenticated users away from auth pages (login, register).
 */
export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;

    const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password");

    const isProtectedRoute =
        nextUrl.pathname.startsWith("/dashboard");

    const isProtectedApi =
        nextUrl.pathname.startsWith("/api/features") ||
        nextUrl.pathname.startsWith("/api/layout") ||
        nextUrl.pathname.startsWith("/api/user") ||
        nextUrl.pathname.startsWith("/api/ai");

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    // Redirect unauthenticated users to login for protected routes
    if (isProtectedRoute && !isLoggedIn) {
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
        return NextResponse.redirect(
            new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl)
        );
    }

    // Return 401 for unauthenticated API requests to protected endpoints
    if (isProtectedApi && !isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
});

export const config = {
    // Match all routes except static files and Next.js internals
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|icon.png|public|api/auth|api/lemonsqueezy/webhook|api/stripe/webhook).*)",
    ],
};
