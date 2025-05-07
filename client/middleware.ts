import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const locked = true;
  const { pathname } = request.nextUrl;

  console.log("Middleware triggered for:", pathname);

  // Allow access to waitlist and static files
  const allowedPaths = ["/waitlist", "/favicon.ico", "/robots.txt"];

  const isAllowed =
  allowedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`)) ||
  pathname.startsWith('/_next');

  if (locked && !isAllowed) {
    const url = request.nextUrl.clone();
    url.pathname = "/waitlist";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|waitlist).*)"],
};
