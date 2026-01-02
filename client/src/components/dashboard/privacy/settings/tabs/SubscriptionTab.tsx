"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "../useSettings";
import { AlertTriangle, Calendar, Check, Star, CreditCard, Zap, Crown } from "lucide-react";
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
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <CreditCard className="text-gray-400 dark:text-gray-500" size={20} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sign in required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          You need to be signed in to manage your billing and subscription.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  const proFeatures = [
    "Unlimited projects",
    "Advanced analytics",
    "Priority support",
    "Custom integrations",
    "Team collaboration",
    "Export capabilities",
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Billing & Subscription
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your subscription plan and payment details.
        </p>
      </div>

      <div className="space-y-6">
        {subscriptionStatus === "free" ? (
          <>
            <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900/30 dark:to-gray-900/50 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Zap size={20} className="text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Free Plan
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      Current plan
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You&#39;re currently on the Free plan with basic features.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0">
                    <Crown size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Upgrade to Pro
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        <Star size={12} />
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Unlock all features and take your productivity to the next level.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                      {proFeatures.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Check size={16} className="text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleUpgradeToPro}
                      className={`${styling.buttonBaseClasses} ${styling.buttonPrimaryClasses} inline-flex items-center gap-2`}
                    >
                      <Star size={16} />
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : subscriptionStatus === "active" ? (
          <>
            <div className="rounded-lg border border-green-200 dark:border-green-900/50 bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-gray-900/50 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <Crown size={20} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                        Pro Plan
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        <Check size={12} />
                        Active
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You have access to all Pro features.
                    </p>
                    {nextInvoice && (
                      <div className="flex items-center gap-2 mt-3 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar size={14} />
                        <span>Next billing date: {nextInvoice}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-green-200 dark:border-green-900/50">
                <button
                  onClick={handleManageSubscription}
                  className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses} inline-flex items-center gap-2`}
                >
                  <CreditCard size={16} />
                  Manage subscription
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {proFeatures.map((feature) => (
                <div key={feature} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <Check size={16} className="text-primary" />
                    <span>{feature}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : subscriptionStatus === "past_due" ? (
          <div className="rounded-lg border-2 border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-white dark:from-red-900/10 dark:to-gray-900/50 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Payment Issue
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                    <AlertTriangle size={12} />
                    Past due
                  </span>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                  Your last payment failed. Please update your payment method to maintain access to Pro features.
                </p>
                <button
                  onClick={handleManageSubscription}
                  className={`${styling.buttonBaseClasses} bg-red-600 hover:bg-red-700 text-white inline-flex items-center gap-2`}
                >
                  <CreditCard size={16} />
                  Update payment method
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <CreditCard size={18} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Payment method
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Manage your payment methods and billing information in the customer portal.
              </p>
              {subscriptionStatus !== "free" && (
                <button
                  onClick={handleManageSubscription}
                  className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses} text-sm`}
                >
                  Manage billing
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}