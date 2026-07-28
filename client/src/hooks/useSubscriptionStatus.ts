"use client";

import { useEffect, useState } from "react";

export type SubscriptionStatus =
  | "active"
  | "paid"
  | "pro"
  | "on_trial"
  | "trialing"
  | "canceled"
  | "cancelled"
  | "past_due"
  | "unpaid"
  | "expired"
  | "paused"
  | "free";

export default function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/user/subscription");
        const data = await res.json();
        setStatus((data.subscriptionStatus || "free") as SubscriptionStatus);
      } catch (err) {
        console.error("Failed to fetch subscription status", err);
        setStatus("free");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  return { status, loading };
}
