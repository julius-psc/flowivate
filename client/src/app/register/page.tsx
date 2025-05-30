"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner"; 
import logo from '../../assets/brand/logo-v1.5.svg';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import gradBg from '../../../public/assets/illustrations/gradient-bg-blue.svg';
import github from '../../assets/icons/github-logo.svg';
import google from '../../assets/icons/google-logo.svg';

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Registration failed. Please try again."); // Use toast
        return;
      }

      // Registration successful, now attempt sign in
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        // Map known errors if desired, otherwise show a generic message
        let signInError = "Login after registration failed. Please try logging in manually.";
        if (result.error === "CredentialsSignin") {
           signInError = "Invalid credentials used for automatic login. Please log in manually.";
        } else if (result.error) {
            signInError = result.error; // Use specific error if available
        }
        toast.error(signInError);
      } else if (result?.ok) {
        toast.success("Registration successful! Welcome."); // Optional success toast
        router.push("/dashboard");
      } else {
         // Handle unexpected signIn result after successful registration
         toast.warning("Registration complete, but auto-login failed. Please log in manually.");
         router.push("/login"); // Redirect to login page
      }
    } catch (err) {
      toast.error("An unexpected error occurred during registration."); // Use toast
      console.error("Registration error:", err);
    }
  };

  const handleSocialSignIn = (provider: string) => {
    // No toast.loading as requested
    signIn(provider, { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-black relative overflow-hidden">
      <div className="absolute opacity-60 inset-0 w-full h-full">
        <Image
          src={gradBg}
          alt="Gradient background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-col justify-center items-center">
          <Image className="w-24 h-auto mb-2" src={logo} alt="Flowivate logo" />
          <h1 className="text-3xl font-bold text-center text-secondary-white mb-6">
            Get started
          </h1>
        </div>

        <div className="flex justify-center items-center space-x-4 mb-4">
          <button
            onClick={() => handleSocialSignIn('github')}
            className="w-14 h-14 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors duration-200"
          >
            <Image className="w-10 h-auto" src={github} alt="Sign up with Github" />
          </button>
          <div className="bg-secondary-white opacity-14 h-10 w-px"></div>
          <button
            onClick={() => handleSocialSignIn('google')}
            className="w-14 h-14 flex items-center justify-center rounded-md hover:bg-gray-800 transition-colors duration-200"
          >
            <Image className="w-10 h-auto" src={google} alt="Sign up with Google" />
          </button>
        </div>

        <p className="text-center text-secondary-white py-2">or</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-4 py-2 border-1 border-accent-grey-hover rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-primary-blue-ring bg-transparent text-secondary-white placeholder-accent-grey-hover"
                required
              />
            </div>
          </div>

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
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2 border-1 border-accent-grey-hover rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-primary-blue-ring bg-transparent text-secondary-white placeholder-accent-grey-hover"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-accent-grey-hover hover:text-secondary-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <IconEyeOff size={20} />
                ) : (
                  <IconEye size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-blue hover:bg-primary-blue-hover text-white py-2 rounded-md transition-colors duration-200"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-secondary-white">
          Already have an account?{" "}
          <Link href="/login" className="text-primary-blue hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}