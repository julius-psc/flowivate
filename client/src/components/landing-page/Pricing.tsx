"use client";

import React, { useState } from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const freeFeatures = [
    "4 basic components",
    "Restricted AI access",
    "Custom themes",
  ];

  const proFeatures = [
    "Unlimited components",
    "AI-powered assistant",
    "Unlimited journal / book entries",
    "Advanced analytics",
  ];

  const monthlyPrice = 8;
  const annualPrice = monthlyPrice * 12 * 0.8;
  const annualMonthlyPrice = annualPrice / 12;

  const monthlyVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_VARIANT_ID!;
  const annualVariantId = process.env.NEXT_PUBLIC_LEMONSQUEEZY_ANNUAL_VARIANT_ID!;

  const handleCheckout = async () => {
    try {
      const res = await fetch("/api/lemonsqueezy/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantId: isAnnual ? annualVariantId : monthlyVariantId,
          redirectUrl: `${window.location.origin}/dashboard`,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create checkout session", data);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  return (
    <div id="pricing" className="w-full px-4 py-16 md:py-20 relative overflow-hidden">
      <div className="max-w-3xl mx-auto relative z-10">

        {/* Header - Minimalist, just the toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${!isAnnual
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 relative ${isAnnual
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
                }`}
            >
              Yearly
              {isAnnual && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="ml-2 text-primary-blue text-xs font-bold"
                >
                  -20%
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto items-stretch">
          {/* Free Plan */}
          <div className="flex flex-col min-h-[450px] md:min-h-[550px] rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-5 md:p-8">
            <div className="flex flex-col h-full">
              <div className="mb-6 md:mb-8">
                <h3 className="text-lg font-medium text-white mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-2 h-10">
                  <span className="text-3xl md:text-4xl font-bold text-white tracking-tight">€0</span>
                  <span className="text-white text-sm font-medium">/year</span>
                </div>
                <p className="text-gray-400 text-sm">
                  The perfect starting point for new users.
                </p>
              </div>

              <div className="mb-6 md:mb-8">
                <button
                  className="w-full py-2.5 rounded-full bg-zinc-800 text-white font-medium text-sm hover:bg-zinc-700 transition-all shadow-sm"
                >
                  Start Free
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                <p className="text-sm font-medium text-white">Includes:</p>
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-zinc-700 bg-zinc-800/50 flex-shrink-0">
                      <Check size={12} className="text-gray-400" />
                    </div>
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col min-h-[450px] md:min-h-[550px] relative rounded-2xl border border-zinc-800 bg-[#1a1a1a] p-5 md:p-8 shadow-xl">
            <div className="flex flex-col h-full">
              <div className="mb-6 md:mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-white">Elite</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary-blue text-white text-[10px] font-bold uppercase tracking-wider">
                      Popular
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-1 mb-2 h-10">
                  <span className="text-3xl md:text-4xl font-bold text-white tracking-tight flex">
                    €
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={isAnnual ? "annual" : "monthly"}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="inline-block"
                      >
                        {isAnnual
                          ? annualMonthlyPrice.toFixed(0)
                          : monthlyPrice.toFixed(0)}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  <span className="text-white text-sm font-medium">/month</span>
                </div>
                <p className="text-gray-400 text-sm">
                  Unlock your full potential with advanced capabilities.
                </p>
              </div>

              <div className="mb-6 md:mb-8">
                <button
                  onClick={handleCheckout}
                  className="w-full py-2.5 rounded-full bg-primary-blue text-white font-medium text-sm hover:bg-[var(--color-primary-blue-hover)] transition-all"
                >
                  Upgrade to Elite
                </button>
              </div>

              <div className="space-y-3 md:space-y-4">
                <p className="text-sm font-medium text-white">Everything in Free +</p>
                {proFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-primary-blue/20 bg-primary-blue/10 text-primary-blue flex-shrink-0">
                      <Check size={12} strokeWidth={2.5} />
                    </div>
                    <span className="text-gray-200 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
