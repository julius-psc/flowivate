import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcrypt";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";

const BCRYPT_SALT_ROUNDS = 12;

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { message: "Password must be at least 8 characters long" },
                { status: 400 }
            );
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        await connectDB();

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Invalid or expired password reset token" },
                { status: 400 }
            );
        }

        // Set new password
        user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        user.passwordLastUpdatedAt = new Date();

        await user.save();

        return NextResponse.json(
            { message: "Password reset successful. You can now log in." },
            { status: 200 }
        );
    } catch (err) {
        console.error("Reset password error:", err);
        return NextResponse.json(
            { message: "Something went wrong." },
            { status: 500 }
        );
    }
}
