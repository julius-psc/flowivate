"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "../useSettings";
import { CreditCard, ExternalLink } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

type SubStatus = "active" | "canceled" | "past_due" | "free";

export default function SubscriptionTab(): React.JSX.Element {
  const { styling, sessionStatus, session, setStatusMessage } = useSettings();
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubStatus>("free");
  const [nextInvoice, setNextInvoice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/user/subscription");
        const data = await res.json();
        setSubscriptionStatus(data.subscriptionStatus as SubStatus);
        setNextInvoice(data.nextInvoiceDate ?? null);
      } catch {
        setStatusMessage({
          type: "error",
          message: "Failed to load subscription",
        });
      } finally {
        setLoading(false);
      }
    };
    if (sessionStatus === "authenticated") fetchSubscription();
  }, [sessionStatus, setStatusMessage]);

  const handleManageSubscription = async () => {
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else
      setStatusMessage({ type: "error", message: "Failed to open billing portal" });
  };

  const handleUpgradeToPro = async () => {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!;
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, cancelUrl: window.location.href }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else
      setStatusMessage({ type: "error", message: "Failed to create checkout" });
  };

  if (sessionStatus !== "authenticated" || !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <CreditCard className="text-zinc-500" size={20} />
        </div>
        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Sign in required
        </h3>
        <p className="text-[13px] text-zinc-500 max-w-sm">
          You need to be signed in to manage your billing.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <Skeleton className="h-7 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Billing
        </h2>
        <p className="text-[13px] text-zinc-500 mt-1">
          Manage your subscription and payment.
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Plan */}
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <div>
            <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              Plan
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-zinc-900 dark:text-zinc-100">
                {subscriptionStatus === "free" ? "Free" : "Elite"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${subscriptionStatus === "active"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : subscriptionStatus === "past_due"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  }`}
              >
                {subscriptionStatus === "active"
                  ? "Active"
                  : subscriptionStatus === "past_due"
                    ? "Past due"
                    : subscriptionStatus === "canceled"
                      ? "Canceled"
                      : "Current"}
              </span>
            </div>
            {subscriptionStatus === "free" ? (
              <button
                onClick={handleUpgradeToPro}
                className={`${styling.buttonBaseClasses} ${styling.buttonPrimaryClasses}`}
              >
                Upgrade to Elite
              </button>
            ) : (
              <button
                onClick={handleManageSubscription}
                className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses} inline-flex items-center gap-1.5`}
              >
                Manage
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Next billing date - only show for active subscriptions */}
        {subscriptionStatus === "active" && nextInvoice && (
          <>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
              <div>
                <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                  Next billing
                </label>
              </div>
              <div>
                <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
                  {nextInvoice}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Past due warning */}
        {subscriptionStatus === "past_due" && (
          <>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-4">
              <p className="text-[13px] text-red-700 dark:text-red-400">
                Your payment failed. Please update your payment method to continue using Elite features.
              </p>
              <button
                onClick={handleManageSubscription}
                className={`${styling.buttonBaseClasses} ${styling.buttonDangerClasses} mt-3`}
              >
                Update payment
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}