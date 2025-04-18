"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import gradBg from "../../../public/assets/illustrations/gradient-bg.svg";

import logo from "../../assets/brand/logo-v1.5.svg";
import github from "../../assets/icons/github-logo.svg";
import google from "../../assets/icons/google-logo.svg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    const result = await signIn("credentials", {
      redirect: false, // Handle redirect manually
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
    }
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
            className="w-14 h-14 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors duration-200"
          >
            <Image className="w-14 h-auto" src={github} alt="Github login" />
          </button>
          <div className="bg-secondary-white opacity-14 h-10 w-px"></div>
          <button 
            onClick={() => handleSocialSignIn('google')}
            className="w-14 h-14 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors duration-200"
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
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white py-2 rounded-md transition-colors duration-200"
          >
            Log In
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