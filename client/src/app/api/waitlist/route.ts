import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    ipAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  if (entry.count >= MAX_ATTEMPTS) return true;
  entry.count++;
  return false;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabase =
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    : null;

export async function POST(request: NextRequest) {
  if (!supabase) {
    console.error("Missing Supabase env vars");
    return NextResponse.json({ message: "Server misconfiguration." }, { status: 500 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { message: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid request." }, { status: 400 });
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : null;

  if (!email || !EMAIL_REGEX.test(email) || email.length > 254) {
    return NextResponse.json({ message: "Invalid email." }, { status: 400 });
  }

  const { error } = await supabase.from("waitlist").insert({ email });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ message: "duplicate" }, { status: 409 });
    }
    console.error("Supabase insert error:", error);
    return NextResponse.json({ message: "Something went wrong." }, { status: 500 });
  }

  const { count } = await supabase
    .from("waitlist")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ position: count ?? 1 }, { status: 201 });
}
