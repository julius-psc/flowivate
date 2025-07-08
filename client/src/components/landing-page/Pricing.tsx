"use client";

import React, { useState } from "react";
import { Check, ArrowUpRight, Crown } from "lucide-react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const freeFeatures = [
    "4 basic components",
    "Restricted AI access",
    "Custom themes",
  ];

  const proFeatures = [
    "Unlimited entries",
    "AI-powered assistant",
    "Unlimited components",
    "Advanced analytics",
  ];

  const monthlyPrice = 4.99;
  const annualPrice = monthlyPrice * 12 * 0.7;
  const annualMonthlyPrice = annualPrice / 12;

  const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!;
  const annualPriceId = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID!;

  const handleCheckout = async () => {
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId: isAnnual ? annualPriceId : monthlyPriceId,
        cancelUrl: window.location.href,
      }),
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Failed to create checkout session", data);
    }
  };

  return (
    <div id="pricing" className="min-h-screen bg-secondary-black px-4 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Choose your plan
          </h1>
          <p className="text-lg text-gray-400 max-w-lg mx-auto mb-8">
            Start free and upgrade when you&#39;re ready to unlock more features
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-secondary-black border border-gray-600/40">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !isAnnual
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all relative ${
                isAnnual
                  ? "bg-white text-gray-900 shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Annual
              {isAnnual && (
                <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold">
                  -30%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="relative rounded-2xl border border-gray-600/40 bg-secondary-black p-6 hover:border-gray-500/40 transition-all">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Starter</h3>
              <p className="text-gray-400 text-sm mb-4">
                Perfect for getting started
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-gray-400 text-sm">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {freeFeatures.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button className="relative w-full px-4 py-2.5 rounded-lg bg-white text-gray-900 font-medium text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow">
              <span className="relative z-10 flex items-center gap-1">
                Get started
                <ArrowUpRight size={16} />
              </span>
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-2xl bg-gradient-to-b from-blue-700/20 to-blue-900/30 border border-blue-500/30 p-6 hover:border-blue-400/40 transition-all">
            {/* Popular Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-blue text-white text-xs font-semibold">
                <Crown size={12} />
                Most Popular
              </div>
            </div>

            {/* Subtle glow */}
            <div className="absolute inset-0 rounded-2xl bg-blue-600/10 blur-2xl -z-10"></div>

            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Everything you need to excel
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    $
                    {isAnnual
                      ? annualMonthlyPrice.toFixed(2)
                      : monthlyPrice.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                {isAnnual && (
                  <p className="text-green-400 text-xs mt-1">
                    Billed annually (${annualPrice.toFixed(2)}/year)
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check size={16} className="text-blue-400 flex-shrink-0" />
                    <span className="text-gray-200 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={handleCheckout}
                className="relative w-full px-4 py-2.5 rounded-lg bg-white text-gray-900 font-medium text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow"
              >
                <span className="relative z-10 flex items-center gap-1">
                  Upgrade
                  <ArrowUpRight size={16} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
