import React from "react";
import dynamic from "next/dynamic";

const LoginClient = dynamic(() => import("./LoginClient"), {
  loading: () => (
    <div className="min-h-screen flex items-center justify-center text-white">
      Loading login...
    </div>
  ),
});

export default function LoginPage() {
  return <LoginClient />;
}
