"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Something went wrong");
            }

            setIsSubmitted(true);
            toast.success("Reset link sent!");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[#121212] flex flex-col min-h-screen">
            <Navbar />

            <div className="flex-grow flex items-center justify-center px-4 pt-20">
                <div className="w-full max-w-[360px] flex flex-col items-center">
                    <h1 className="text-[22px] font-semibold text-white mb-2 tracking-tight">
                        Reset your password
                    </h1>
                    <p className="text-[#999999] text-center mb-8 text-sm">
                        Enter your email and we&apos;ll send you a link to reset your password.
                    </p>

                    {!isSubmitted ? (
                        <form onSubmit={handleSubmit} className="w-full space-y-3">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                className="w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-primary-blue transition-colors duration-200"
                                required
                                disabled={isLoading}
                            />

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-11 bg-primary-blue hover:bg-primary-blue/90 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                            >
                                {isLoading ? "Sending..." : "Send reset link"}
                            </button>
                        </form>
                    ) : (
                        <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 text-center">
                            <div className="w-12 h-12 bg-primary-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-primary-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-medium mb-1">Check your email</h3>
                            <p className="text-[#999999] text-sm mb-4">
                                We sent a password reset link to <span className="text-white">{email}</span>
                            </p>
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="text-sm text-primary-blue hover:underline"
                            >
                                Click to resend
                            </button>
                        </div>
                    )}

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
            </div>
            <Footer />
        </div>
    );
}
