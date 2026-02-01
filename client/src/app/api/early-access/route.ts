import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const correctPassword = process.env.EARLY_ACCESS_PASSWORD;

  if (password !== correctPassword) {
    return NextResponse.json({ message: 'Incorrect password' }, { status: 401 });
  }

  const res = NextResponse.json({ message: 'Access granted' });

  res.cookies.set('earlyAccess', 'granted', {
    path: '/',
    httpOnly: true,
    expires: new Date('2030-06-02T23:59:59Z'),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res;
}