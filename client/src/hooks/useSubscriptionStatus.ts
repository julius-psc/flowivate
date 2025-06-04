"use client";

import { useEffect, useState } from "react";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | "free";

export default function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus>("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await fetch("/api/user/subscription");
        const data = await res.json();
        setStatus(data.subscriptionStatus);
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
