import { NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rateLimiter";

export async function checkRateLimit(userId: string, route: string, maxRequests: number) {
  const limited = await isRateLimited(userId, route, maxRequests);
  if (limited) {
    return NextResponse.json(
      { message: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }
  return null; 
}
