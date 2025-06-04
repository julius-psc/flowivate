"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSettings } from "../useSettings";
import { AlertCircle, ArrowRight, Loader2, AlertTriangle } from "lucide-react";

const SubscriptionTab = (): React.JSX.Element => {
  const { styling, sessionStatus, session } = useSettings();

  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "active" | "canceled" | "past_due" | "free"
  >("free");

  useEffect(() => {
    const fetchSubscription = async () => {
      const res = await fetch("/api/user/subscription");
      const data = await res.json();
      setSubscriptionStatus(data.subscriptionStatus);
    };

    if (sessionStatus === "authenticated") {
      fetchSubscription();
    }
  }, [sessionStatus]);

  const handleManageSubscription = async () => {
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Failed to create portal session", data);
    }
  };

const handleUpgradeToPro = async () => {
  const priceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!;

  const res = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId,
      cancelUrl: window.location.href, // dynamic cancelUrl 🚀
    }),
  });

  const data = await res.json();
  if (data.url) {
    window.location.href = data.url;
  } else {
    console.error("Failed to create checkout session", data);
  }
};

  const renderContent = () => (
    <div className="space-y-6">
      <div className={styling.sectionHeaderClasses}>
        <h2 className={styling.sectionTitleClasses}>Subscription</h2>
        <p className={styling.sectionDescriptionClasses}>
          Manage your plan and billing details.
        </p>
      </div>

      <div className="space-y-5">
        {/* CURRENT PLAN */}
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Current Plan
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subscriptionStatus === "active"
                  ? "You are on the Pro plan."
                  : subscriptionStatus === "past_due"
                  ? "Payment failed — please update your payment method."
                  : "You are currently on the Free plan."}
              </p>
            </div>
            <span
              className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                subscriptionStatus === "active"
                  ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20"
                  : subscriptionStatus === "past_due"
                  ? "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20"
                  : "text-primary dark:text-primary/70 bg-primary/10 dark:bg-primary/20"
              }`}
            >
              {subscriptionStatus === "active"
                ? "Pro"
                : subscriptionStatus === "past_due"
                ? "Payment Issue"
                : "Free"}
            </span>
          </div>

          {/* DYNAMIC BUTTON */}
          {subscriptionStatus === "active" ? (
            <button
              onClick={handleManageSubscription}
              className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/80 transition-colors"
            >
              Manage Subscription
            </button>
          ) : subscriptionStatus === "past_due" ? (
            <button
              onClick={handleManageSubscription}
              className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <AlertTriangle size={16} />
              Update Payment Method
            </button>
          ) : (
            <button
              onClick={handleUpgradeToPro}
              className="mt-3 rounded-md px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/80 transition-colors"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2
          className="animate-spin text-gray-400 dark:text-gray-500"
          size={24}
        />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-4">
        <AlertCircle
          className="mb-3 text-gray-400 dark:text-gray-500"
          size={24}
        />
        <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
          Please log in to manage this section.
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

  if (sessionStatus === "authenticated" && session?.user) {
    return renderContent();
  }

  return (
    <p className="text-center text-gray-500 dark:text-gray-400">
      Session data not available.
    </p>
  );
};

export default SubscriptionTab;
