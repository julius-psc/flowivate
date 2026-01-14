"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface PaywallPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PaywallPopup({ isOpen, onClose }: PaywallPopupProps) {
    const [loading, setLoading] = useState(false);
    const [isAnnual, setIsAnnual] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Pricing constants (mirroring Pricing.tsx)
    const monthlyPrice = 8;
    const annualPrice = monthlyPrice * 12 * 0.8;
    const annualMonthlyPrice = annualPrice / 12;

    const proFeatures = [
        "Unlimited components",
        "AI-powered assistant",
        "Unlimited journal / book entries",
        "Advanced analytics",
    ];

    const handleUpgrade = async () => {
        try {
            setLoading(true);
            const monthlyPriceId = process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID;
            const annualPriceId = process.env.NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID;

            const priceId = isAnnual ? annualPriceId : monthlyPriceId;

            if (!priceId) {
                console.error("Price ID not found");
                return;
            }

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
        } catch (error) {
            console.error("Error creating checkout session:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="
          relative w-full max-w-sm 
          bg-white dark:bg-[#121212] 
          border border-gray-200 dark:border-zinc-800 
          rounded-xl shadow-2xl overflow-hidden
        "
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="p-6">
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-medium tracking-tight text-gray-900 dark:text-white">
                            Become a member of the ELITE.
                        </h2>
                    </div>

                    {/* Toggle */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${!isAnnual
                                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                    }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${isAnnual
                                    ? "bg-white dark:bg-zinc-800 text-black dark:text-white shadow-sm"
                                    : "text-gray-500 dark:text-zinc-400 hover:text-black dark:hover:text-white"
                                    }`}
                            >
                                Yearly
                                {isAnnual && (
                                    <span className="text-primary-blue text-[10px] font-bold">
                                        -20%
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline justify-center gap-1 mb-8">
                        <span className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight flex">
                            €
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={isAnnual ? "annual" : "monthly"}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="inline-block"
                                >
                                    {isAnnual ? annualMonthlyPrice.toFixed(0) : monthlyPrice.toFixed(0)}
                                </motion.span>
                            </AnimatePresence>
                        </span>
                        <span className="text-gray-500 dark:text-zinc-500 text-sm font-medium">/month</span>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                        {proFeatures.map((feature, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-blue text-white flex-shrink-0">
                                    <Check size={12} strokeWidth={2.5} />
                                </div>
                                <span className="text-gray-600 dark:text-zinc-300 text-sm">{feature}</span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleUpgrade}
                        disabled={loading}
                        className="
              flex items-center justify-center w-full px-4 py-3
              text-sm font-medium text-white 
              bg-primary-blue
              rounded-lg 
              hover:opacity-90 active:scale-[0.98]
              transition-all disabled:opacity-50 disabled:pointer-events-none
            "
                    >
                        {loading ? "Redirecting..." : "Upgrade to Elite"}
                    </button>
                    <p className="mt-4 text-[11px] text-center text-gray-400 dark:text-zinc-600">
                        Cancel anytime. Secure payment via Stripe.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
}
