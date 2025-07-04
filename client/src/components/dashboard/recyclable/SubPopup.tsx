"use client";

import React, { useEffect, useState } from "react";
import { X, Crown, Sparkles } from "lucide-react";

interface SubPopupProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  showBadge?: boolean;
}

const SubPopup: React.FC<SubPopupProps> = ({
  open,
  onClose,
  description = "Unlock unlimited lists, tasks, AI assistant, and more premium features.",
  showBadge = true,
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (open) {
      document.addEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "unset";
    };
  }, [onClose, open]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
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
      } else {
        console.error("Checkout session error:", data);
        setLoading(false);
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-2">
            {showBadge && (
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                <Crown size={12} />
                Pro
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles size={24} className="text-primary" />
            </div>
          </div>

          {/* Description */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Upgrade to Pro"}
              {!loading && <Crown size={16} />}
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubPopup;
