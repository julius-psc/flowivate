"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

import gradBg from "../../../public/assets/illustrations/landing-gradient.png";
import logo from "../../assets/brand/logo-v1.5.svg";
import github from "../../assets/icons/github-logo.svg";
import google from "../../assets/icons/google-logo.svg";

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
    <div className="min-h-screen bg-secondary-black flex relative">
      <Link
        href="/"
        className="absolute top-6 left-6 text-gray-500 hover:text-white transition"
      >
        <ArrowLeft size={24} />
      </Link>

      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-2">
            <Image className="w-22 h-auto" src={logo} alt="Flowivate logo" />
            <h1 className="text-2xl font-bold text-white mb-2">Jump back in</h1>
          </div>

          <div className="flex space-x-4 mb-4 justify-center">
            <button
              onClick={() => handleSocialSignIn("github")}
              disabled={isLoading}
              className="w-14 h-14 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
            >
              <Image
                className="w-20 h-20 hover:scale-110 transition-transform"
                src={github}
                alt="Github login"
              />
            </button>
            <button
              onClick={() => handleSocialSignIn("google")}
              disabled={isLoading}
              className="w-14 h-14 flex items-center justify-center transition-all duration-200 disabled:opacity-50"
            >
              <Image
                className="w-20 h-20 hover:scale-110 transition-transform"
                src={google}
                alt="Google login"
              />
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-400/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-gray-400 bg-secondary-black">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-300 block"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john.doe@gmail.com"
                className="w-full h-12 px-4 bg-transparent border border-gray-400/20 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20 text-secondary-white placeholder-gray-400/40 transition-all duration-200"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1 relative">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-300 block"
              >
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="veryStrongPassword123@"
                className="w-full h-12 px-4 pr-12 bg-transparent border border-gray-400/20 rounded-xl focus:outline-none focus:border-primary-blue focus:ring-2 focus:ring-blue-500/20 text-secondary-white placeholder-gray-400/40 transition-all duration-200"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-[38px] text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary-blue hover:bg-primary-blue/80 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Logging in...
                </div>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-3 text-sm">
            <p className="text-gray-400">
              Don’t have an account?{" "}
              <Link
                href="/register"
                className="text-primary-blue font-medium hover:text-primary-blue/80 transition"
              >
                Sign up
              </Link>
            </p>
            <p className="text-gray-400">
              Forgot your password?{" "}
              <Link
                href="/forgot-password"
                className="text-primary-blue font-medium hover:text-primary-blue/80 transition"
              >
                Reset it
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="w-1/2 p-3">
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src={gradBg}
            alt="Gradient background"
            fill
            style={{ objectFit: "cover" }}
            priority
            className="rounded-3xl"
          />
        </div>
      </div>
    </div>
  );
}