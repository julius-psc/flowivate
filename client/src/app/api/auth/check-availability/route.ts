import { NextResponse } from "next/server";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";

export async function POST(request: Request) {
    try {
        const { username, email } = await request.json();

        if (!username && !email) {
            return NextResponse.json(
                { error: "Username or email required" },
                { status: 400 }
            );
        }

        await connectDB();

        const conflicts: Record<string, string> = {};

        if (username) {
            // Check for exact match for now, consistent with existing register logic
            // Ideally this should be case-insensitive, but let's stick to the current pattern first
            const usernameExists = await User.findOne({ username }).select("_id").lean();
            if (usernameExists) {
                conflicts.username = "Username is already taken";
            }
        }

        if (email) {
            const emailExists = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
            if (emailExists) {
                conflicts.email = "Email is already registered";
            }
        }

        if (Object.keys(conflicts).length > 0) {
            return NextResponse.json({ available: false, conflicts }, { status: 200 });
        }

        return NextResponse.json({ available: true }, { status: 200 });
    } catch (error) {
        console.error("Check availability error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
