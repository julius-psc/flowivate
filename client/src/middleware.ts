import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt'; 

const WAITLIST_PATH = '/waitlist';
const LOGIN_PATH = '/login';

// Paths that are always public or explicitly exempt from certain checks
const ALWAYS_PUBLIC_PATHS = [
  WAITLIST_PATH,
  LOGIN_PATH,
  '/api/auth',
  '/_next/static',
  '/_next/image',
  '/favicon.ico',
];

const PROTECTED_DASHBOARD_PATHS = [
  '/dashboard', // Matches /dashboard, /dashboard/journal, etc.
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAppLocked = process.env.NEXT_PUBLIC_APP_LOCKED === 'true';
  console.log(`🚀 Single Middleware Activated for: ${pathname}`);

  // --- 1. Handle Always Public Paths ---
  const isGenerallyPublicAssetOrNextInternal = ALWAYS_PUBLIC_PATHS.some(p => pathname.startsWith(p) && (p.includes('/_next/') || p.includes('/api/') || p.includes('.')));
  if (isGenerallyPublicAssetOrNextInternal) {
    return NextResponse.next();
  }


  // --- 2. Site-Wide Lock (Waitlist Mode) ---
  if (isAppLocked) {
    if (pathname !== WAITLIST_PATH && pathname !== LOGIN_PATH /* maybe allow login attempts */) {
      console.log(`🔒 Site Locked: Redirecting "${pathname}" to ${WAITLIST_PATH}`);
      const url = request.nextUrl.clone();
      url.pathname = WAITLIST_PATH;
      return NextResponse.redirect(url);
    }
  }

  // --- 3. Authentication for Protected Routes (Runs if site is not locked or if path is exempt from lock but needs auth) ---
  const isProtectedRoute = PROTECTED_DASHBOARD_PATHS.some(p => pathname.startsWith(p));

  if (isProtectedRoute) {
    if (!process.env.AUTH_SECRET) {
      console.error('CRITICAL: AUTH_SECRET is not defined. Cannot authenticate.');
      if (pathname !== LOGIN_PATH) { // Avoid redirect loop on login page itself
         const loginUrl = request.nextUrl.clone();
         loginUrl.pathname = LOGIN_PATH;
         return NextResponse.redirect(loginUrl);
      }
      return NextResponse.next();
    }

    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    console.log(`🔑 Auth check for "${pathname}". Token: ${token ? 'PRESENT' : 'ABSENT'}`);

    if (!token) {
      console.log(`🚫 No token for protected route "${pathname}". Redirecting to ${LOGIN_PATH}.`);
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.searchParams.set('callbackUrl', pathname + request.nextUrl.search); // Preserve original destination
      return NextResponse.redirect(loginUrl);
    }
    console.log(`👍 Token valid for "${pathname}". Allowing access.`);
  }

  // If none of the above conditions caused a redirect, allow the request to proceed.
  console.log(`✅ Access allowed by default for: ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
     '/login',
     '/waitlist',
  ],
};