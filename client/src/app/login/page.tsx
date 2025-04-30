"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner"; // Import Sonner toast

import gradBg from "../../../public/assets/illustrations/gradient-bg.svg";
import logo from "../../assets/brand/logo-v1.5.svg";
import github from "../../assets/icons/github-logo.svg";
import google from "../../assets/icons/google-logo.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); 
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    const toastId: string | number | undefined = undefined; 

    try {
      const result = await signIn("credentials", {
        redirect: false, 
        email,
        password,
      });

      if (result?.error) {

        let errorMessage = "Login failed. Please try again."; // Default error
        // Map known technical errors to user-friendly messages
        if (result.error === "CredentialsSignin") {
          errorMessage = "Invalid email or password.";
        } else if (result.error) {
            errorMessage = result.error;
        }

        // Show error toast
        toast.error(errorMessage, { id: toastId }); // Update loading toast or show new error
      } else if (result?.ok && !result?.error) {
        // Login successful
        toast.success("Login successful! Redirecting...", { id: toastId });
        router.push("/dashboard");
        // No need to set isLoading false here as we are navigating away
        return; // Exit early on success
      } else {
          // Handle unexpected cases where result is null or not ok but no error specified
           toast.error("An unexpected error occurred during login.", { id: toastId });
      }
    } catch (err) {
        console.error("Login submit error:", err);
        toast.error("An unexpected error occurred. Please check console.", { id: toastId });
    }

    setIsLoading(false); // Set loading to false only if not redirecting
  };

  const handleSocialSignIn = (provider: string) => {
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-black relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute opacity-60 inset-0 w-full h-full">
        <Image
          src={gradBg}
          alt="Gradient background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* Content with higher z-index */}
      <div className="relative z-10">
        <div className="flex flex-col justify-center items-center">
          <Image className="w-24 h-auto" src={logo} alt="Flowivate logo" />
          <h1 className="text-3xl font-bold text-center text-secondary-white mb-6">
            Jump back in
          </h1>
        </div>

        {/* Social Login Buttons */}
        <div className="flex justify-center items-center space-x-4 mb-4">
          <button
            onClick={() => handleSocialSignIn('github')}
            disabled={isLoading} // Optional: Disable while credential login is processing
            className="w-14 h-14 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
          >
            <Image className="w-14 h-auto" src={github} alt="Github login" />
          </button>
          <div className="bg-secondary-white opacity-14 h-10 w-px"></div>
          <button
            onClick={() => handleSocialSignIn('google')}
            disabled={isLoading} // Optional: Disable while credential login is processing
            className="w-14 h-14 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50"
          >
            <Image className="w-14 h-auto" src={google} alt="Google login" />
          </button>
        </div>

        <p className="text-center text-secondary-white py-4">or</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-2 border-1 border-accent-grey-hover rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-primary-blue-ring bg-transparent text-secondary-white placeholder-accent-grey-hover"
                required
                disabled={isLoading} // Optional: Disable during submit
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 border-1 border-accent-grey-hover rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-primary-blue-ring bg-transparent text-secondary-white placeholder-accent-grey-hover"
                required
                disabled={isLoading} // Optional: Disable during submit
              />
            </div>
          </div>
          {/* REMOVE error display paragraph */}
          {/* {error && <p className="text-red-500 text-sm text-center">{error}</p>} */}
          <button
            type="submit"
            disabled={isLoading} // Optional: Disable button during submit
            className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Log In"} {/* Optional: Change text during load */}
          </button>
        </form>
        <p className="mt-4 text-sm text-secondary-white">
          Don&#39;t have an account?{" "}
          <Link href="/register" className="text-primary-blue hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-2 text-sm text-secondary-white">
          Forgot your password?{" "}
          <Link href="/forgot-password" className="text-primary-blue hover:underline">
            Reset it
          </Link>
        </p>
      </div>
    </div>
  );
}