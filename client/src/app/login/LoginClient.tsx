"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import Navbar from "@/components/landing-page/Navbar";
import Footer from "@/components/landing-page/Footer";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result) {
        toast.error("No response from server.");
      } else if (result.error) {
        toast.error(result.error);
      } else if (result.ok && !result.error) {
        toast.success("Login successful! Redirecting...");
        router.push("/dashboard");
        return;
      } else {
        toast.error("Unexpected login error. Please try again.");
      }
    } catch (err) {
      console.error("Sign-in exception:", err);
      toast.error("Something went wrong. Try again.");
    }

    setIsLoading(false);
  };

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="bg-[#121212] flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - min-h-screen pushes footer below viewport */}
      <div className="min-h-screen flex items-center justify-center px-4 pt-28">
        <div className="w-full max-w-[360px] flex flex-col items-center">
          {/* Title */}
          <h1 className="text-[22px] font-semibold text-white mb-6 tracking-tight">
            Log in to Flowivate
          </h1>

          {/* Social Auth Buttons */}
          <div className="flex gap-3 mb-5 w-full">
            <button
              onClick={() => handleSocialSignIn("github")}
              disabled={isLoading}
              className="flex-1 h-11 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] hover:border-[#333333] transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </button>
            <button
              onClick={() => handleSocialSignIn("google")}
              disabled={isLoading}
              className="flex-1 h-11 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg hover:bg-[#222222] hover:border-[#333333] transition-all duration-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center w-full mb-5">
            <div className="flex-1 h-px bg-[#2a2a2a]"></div>
            <span className="px-4 text-sm text-[#666666]">or</span>
            <div className="flex-1 h-px bg-[#2a2a2a]"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full h-11 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-primary-blue transition-colors duration-200"
              required
              disabled={isLoading}
            />

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-primary-blue hover:bg-primary-blue/90 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Logging in...
                </div>
              ) : (
                "Log in"
              )}
            </button>
          </form>

          {/* Bottom Links */}
          <div className="mt-5 w-full">
            <Link
              href="/onboarding"
              className="flex items-center justify-center gap-1 w-full h-11 bg-transparent border border-[#2a2a2a] rounded-lg text-[#999999] hover:text-white hover:border-[#333333] transition-all duration-200 text-sm"
            >
              Don&apos;t have an account? Sign up
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>

          <Link
            href="/forgot-password"
            className="mt-4 text-sm text-[#666666] hover:text-white transition-colors"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Footer - below the fold */}
      <Footer />
    </div>
  );
}