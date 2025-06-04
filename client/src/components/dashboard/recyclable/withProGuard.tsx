"use client";

import React from "react";

type WithProGuardProps = {
  subscriptionStatus: "active" | "canceled" | "past_due" | "free";
  isProOnly: boolean;
  children: React.ReactNode;
};

export default function WithProGuard({
  subscriptionStatus,
  isProOnly,
  children,
}: WithProGuardProps) {
  const isLocked = isProOnly && subscriptionStatus !== "active";

  if (isLocked) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-gray-300 dark:border-gray-700 p-4 bg-background">
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-sm z-10">
          Pro Feature — Upgrade to unlock
        </div>
        <div className="opacity-30 blur-sm pointer-events-none">{children}</div>
      </div>
    );
  }

  return <>{children}</>;
}
