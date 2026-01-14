import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongoose";
import User from "@/app/models/User";

const RESET_TOKEN_EXPIRES = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            );
        }

        await connectDB();
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Return success even if user not found to prevent email enumeration
            return NextResponse.json(
                { message: "If that email exists, we've sent a reset link to it." },
                { status: 200 }
            );
        }

        if (!user.password) {
            return NextResponse.json(
                { message: "This account uses social login (Google/GitHub). Please sign in with that provider." },
                { status: 400 }
            );
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES);
        await user.save();

        // Create reset URL
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        // Send email via Resend
        const resendApiKey = process.env.RESEND_API_KEY;

        if (resendApiKey) {
            const { Resend } = await import("resend");
            const resend = new Resend(resendApiKey);

            await resend.emails.send({
                from: "Flowivate <onboarding@resend.dev>",
                to: email,
                subject: "Reset your Flowivate password",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Reset your password</h2>
                    <p>You requested a password reset for your Flowivate account.</p>
                    <p>Click the button below to set a new password:</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                    <p style="color: #666; font-size: 14px;">If you didn't ask for this, you can safely ignore this email.</p>
                    <p style="color: #666; font-size: 14px; margin-top: 30px;">Link not working? Paste this URL into your browser:<br>${resetUrl}</p>
                  </div>
                `,
            });
            console.log(`[INFO] Password reset email sent to ${email} via Resend`);
        } else {
            // Fallback for dev if key is missing
            console.log("==========================================");
            console.log("⚠️ RESEND_API_KEY not found in env");
            console.log("🔐 PASSWORD RESET LINK (Fallback Log)");
            console.log(`For: ${email}`);
            console.log(`Link: ${resetUrl}`);
            console.log("==========================================");
        }

        return NextResponse.json(
            { message: "If that email exists, we've sent a reset link to it." },
            { status: 200 }
        );
    } catch (err) {
        console.error("Forgot password error:", err);
        return NextResponse.json(
            { message: "Something went wrong." },
            { status: 500 }
        );
    }
}
