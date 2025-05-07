import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const locked = process.env.NEXT_PUBLIC_APP_LOCKED === 'true';
  const { pathname } = request.nextUrl;

  // Allow access to waitlist and static files
  const allowedPaths = [
    '/waitlist',
    '/favicon.ico',
    '/robots.txt',
  ];

  const isAllowed = allowedPaths.some(path => pathname.startsWith(path)) || pathname.startsWith('/_next');

  if (locked && !isAllowed) {
    const url = request.nextUrl.clone();
    url.pathname = '/waitlist';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next|favicon.ico|waitlist).*)'],
};
