"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EarlyAccessPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/early-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/register");
    } else {
      const data = await res.json();
      setError(data.message || "Access denied.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      <h1 className="text-3xl font-bold mb-4">Early Access</h1>
      <form onSubmit={handleSubmit} className="w-80 flex flex-col gap-4">
        <input
          type="password"
          className="bg-gray-800 p-3 rounded text-white"
          placeholder="Enter access password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 p-3 rounded"
        >
          Unlock
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </form>
    </div>
  );
}