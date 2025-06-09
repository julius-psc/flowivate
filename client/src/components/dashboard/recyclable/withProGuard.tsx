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
      <div className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-900/50">
        <div className="absolute inset-0 backdrop-blur-[2px] flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 z-10">
          <div className="text-4xl mb-3 animate-pulse">🔒</div>
          <div className="text-lg font-semibold mb-1 tracking-tight">
            Pro Feature
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Upgrade to unlock
          </div>
        </div>
        <div className="opacity-20 blur-[1px] pointer-events-none select-none">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
