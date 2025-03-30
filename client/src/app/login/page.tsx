"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import logo from '../../assets/brand/logo-v1.4.svg';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="">
        <div className="flex flex-col justify-center items-center">
          <Image className="w-14 h-14 mb-2" src={logo} alt="Flowivate logo"/>
          <h1 className="text-3xl font-bold text-center text-primary-black mb-6">Jump back in</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-primary-black">
              Email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-blue-200"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-primary-black">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-blue-200"
                required
              />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary-blue text-white py-2 rounded-md hover:bg-primary-blue transition-colors duration-300"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-primary-black">
          Don&#39;t have an account?{" "}
          <Link href="/register" className="text-primary-blue hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}