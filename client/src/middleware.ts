import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  console.log("Middleware - Running for URL:", request.url);

  // Allow access to /login even if not authenticated
  if (path === "/login") {
    console.log("Middleware - Allowing access to /login");
    return NextResponse.next();
  }

  // Define protected routes
  const protectedPaths = ["/dashboard", "/dashboard/journal", "/dashboard/personal"];
  const isProtectedRoute = protectedPaths.some((route) => path.startsWith(route));

  if (isProtectedRoute) {
    if (!process.env.AUTH_SECRET) {
      console.error("AUTH_SECRET is not defined in environment variables");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    console.log("Middleware - Token:", token);

    if (!token) {
      console.log("Middleware - Redirecting to /login (unauthenticated user)");
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  console.log("Middleware - Allowing access to:", path);
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};