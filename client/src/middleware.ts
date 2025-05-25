import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAppLocked = process.env.NEXT_PUBLIC_APP_LOCKED === 'true';

  const isAlwaysPublic = ALWAYS_PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );
  if (isAlwaysPublic) return NextResponse.next();

  const earlyAccessCookie = request.cookies.get('earlyAccess')?.value;
  const hasAccess = earlyAccessCookie === 'granted';

  if (isAppLocked && !hasAccess) {
    if (![WAITLIST_PATH, EARLY_ACCESS_PATH].includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = WAITLIST_PATH;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};