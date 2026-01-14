"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AlertCircle, AlertTriangle, ArrowRight } from "lucide-react";
import JournalLog from "../../../components/dashboard/features/journal/Journal";
import PaywallPopup from "@/components/dashboard/PaywallPopup";
import { Skeleton } from "@/components/ui/Skeleton";
import Link from "next/link";

export default function Journal() {
  const { status: sessionStatus } = useSession();
  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "active" | "canceled" | "past_due" | "free"
  >("free");
  const [loadingSub, setLoadingSub] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetch("/api/user/subscription")
        .then((res) => res.json())
        .then((data) => {
          setSubscriptionStatus(data.subscriptionStatus);
        })
        .catch(() => {
          setSubscriptionStatus("free");
        })
        .finally(() => setLoadingSub(false));
    } else {
      setLoadingSub(false);
    }
  }, [sessionStatus]);

  const handleManageSubscription = async () => {
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  const handleUpgradeToPro = async () => {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!;
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        cancelUrl: window.location.href,
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    }
  };

  if (sessionStatus === "loading" || loadingSub) {
    return (
      <div className="flex flex-col h-full w-full">
        {/* Header Skeleton */}
        <div className="px-4 py-4">
          <div className="max-w-screen-lg mx-auto flex justify-end items-center space-x-1">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 overflow-hidden max-w-screen-lg mx-auto w-full p-6 space-y-6">
          <Skeleton className="h-12 w-[30%] rounded-lg" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-[90%] rounded-md" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-[75%] rounded-md" />
          </div>
        </div>
      </div>
    );
  }


  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6">
        <AlertCircle
          className="mb-3 text-gray-400 dark:text-gray-500"
          size={24}
        />
        <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm text-center">
          Please log in to access the Journal.
        </p>
        <Link
          href="/api/auth/signin"
          className="text-sm text-primary hover:text-primary/80 dark:text-primary/70 dark:hover:text-primary/50 inline-flex items-center py-1 px-3 rounded-md border border-primary/30 dark:border-primary/50 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 dark:focus:ring-offset-gray-950"
        >
          Go to login <ArrowRight size={14} className="ml-1" />
        </Link>
      </div>
    );
  }

  if (subscriptionStatus === "free") {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6">
        <p className="text-center text-lg text-secondary-black dark:text-secondary-white">
          Journalling is available to users part of the{" "}
          <span
            onClick={() => setShowPaywall(true)}
            className="text-primary-blue cursor-pointer hover:underline font-medium"
          >
            Elite
          </span>
        </p>
        <PaywallPopup isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
      </div>
    );
  }

  // subscriptionStatus is "active", "past_due", or "canceled"
  if (subscriptionStatus === "past_due" || subscriptionStatus === "canceled") {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          {subscriptionStatus === "past_due"
            ? "Payment Failed"
            : "Subscription Canceled"}
        </h2>
        <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
          {subscriptionStatus === "past_due"
            ? "Your payment method failed. Please update your payment to continue accessing the Journal."
            : "Your subscription is canceled. Re-subscribe to access the Journal."}
        </p>
        <button
          onClick={handleManageSubscription}
          className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/80 transition-colors flex items-center gap-2"
        >
          {subscriptionStatus === "past_due" ? (
            <>
              <AlertTriangle size={16} />
              Update Payment
            </>
          ) : (
            <>
              <AlertTriangle size={16} />
              Manage Subscription
            </>
          )}
        </button>
      </div>
    );
  }
  return (
    <div className="h-full w-full">
      <JournalLog />
    </div>
  );
}