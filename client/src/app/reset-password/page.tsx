"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            toast.success("Password reset successfully!");
            router.push("/login");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center">
                <h1 className="text-[22px] font-semibold text-white mb-2">Invalid Link</h1>
                <p className="text-[#999999] mb-6">This password reset link is invalid or has expired.</p>
                <Link
                    href="/forgot-password"
                    className="h-11 px-6 inline-flex items-center justify-center bg-primary-blue hover:bg-primary-blue/90 text-white font-medium rounded-lg transition-all"
                >
                    Request new link
                </Link>
            </div>
        )
    }

    return (
        <div className="w-full max-w-[360px] flex flex-col items-center">
            <h1 className="text-[22px] font-semibold text-white mb-2 tracking-tight">
                Set new password
            </h1>
            <p className="text-[#999999] text-center mb-8 text-sm">
                Please enter your new password below.
            </p>

            <form onSubmit={handleSubmit} className="w-full space-y-3">
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="New password"
                        className="w-full h-11 px-4 pr-11 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-primary-blue transition-colors duration-200"
                        required
                        disabled={isLoading}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full h-11 px-4 pr-11 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-primary-blue transition-colors duration-200"
                        required
                        disabled={isLoading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 bg-primary-blue hover:bg-primary-blue/90 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                    {isLoading ? "Resetting..." : "Reset password"}
                </button>
            </form>

            <Link
                href="/login"
                className="mt-6 text-sm text-[#666666] hover:text-white transition-colors flex items-center gap-1"
            >
                <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                </svg>
                Back to log in
            </Link>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="bg-[#121212] flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-grow flex items-center justify-center px-4 pt-20">
                <Suspense fallback={<div className="text-white">Loading...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
            <Footer />
        </div>
    );
}
