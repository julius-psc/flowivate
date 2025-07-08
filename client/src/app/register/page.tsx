import React from "react";
import dynamic from "next/dynamic";

const RegisterClient = dynamic(() => import("./RegisterClient"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-white">
      Loading login...
    </div>
  ),
});

export default function LoginPage() {
  return <RegisterClient />;
}
