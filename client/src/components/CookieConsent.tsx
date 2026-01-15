"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Shield, Activity, User } from "lucide-react";
import { cn } from "@/lib/utils";

type ConsentState = {
    essential: boolean;
    performance: boolean;
    personalization: boolean;
};

const defaultConsent: ConsentState = {
    essential: true,
    performance: false,
    personalization: false,
};

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [consent, setConsent] = useState<ConsentState>(defaultConsent);

    useEffect(() => {
        const storedConsent = localStorage.getItem("cookie_consent");
        if (storedConsent) {
            const parsedConsent = JSON.parse(storedConsent);
            setConsent(parsedConsent);
            applyConsent(parsedConsent);
        } else {
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }

        const handleOpenSettings = () => {
            setIsVisible(true);
            setIsExpanded(true);
        };

        window.addEventListener("openCookieSettings", handleOpenSettings);
        return () => window.removeEventListener("openCookieSettings", handleOpenSettings);
    }, []);

    const applyConsent = (consentData: ConsentState) => {
        if (typeof window !== "undefined" && (window as any).gtag) {
            (window as any).gtag("consent", "update", {
                analytics_storage: consentData.performance ? "granted" : "denied",
                ad_storage: consentData.personalization ? "granted" : "denied",
                ad_user_data: consentData.personalization ? "granted" : "denied",
                ad_personalization: consentData.personalization ? "granted" : "denied",
            });
        }

        if (typeof window !== "undefined" && (window as any).dataLayer) {
            (window as any).dataLayer.push({
                event: "consent_update",
                consent_performance: consentData.performance,
                consent_personalization: consentData.personalization,
            });
        }
    };

    const handleAcceptAll = () => {
        const allGranted = { essential: true, performance: true, personalization: true };
        setConsent(allGranted);
        saveConsent(allGranted);
    };

    const handleRejectAll = () => {
        const allDenied = { essential: true, performance: false, personalization: false };
        setConsent(allDenied);
        saveConsent(allDenied);
    };

    const handleSavePreferences = () => {
        saveConsent(consent);
    };

    const saveConsent = (consentData: ConsentState) => {
        localStorage.setItem("cookie_consent", JSON.stringify(consentData));
        localStorage.setItem("cookie_consent_timestamp", new Date().toISOString());
        applyConsent(consentData);
        setIsVisible(false);
        setIsExpanded(false);
        console.log("Consent saved:", consentData, "Timestamp:", new Date().toISOString());
    };

    const toggleCategory = (category: keyof ConsentState) => {
        if (category === "essential") return;
        setConsent((prev) => ({ ...prev, [category]: !prev[category] }));
    };

    if (!isVisible && !isExpanded) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 right-4 z-[9999] w-[92vw] max-w-[400px] md:bottom-6 md:right-6"
                >
                    <div className="rounded-xl border border-white/10 bg-[#121212] p-5 text-sm text-zinc-400">
                        {!isExpanded ? (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-medium text-white text-[15px] mb-1">Cookie Preferences</h3>
                                    <p className="text-zinc-500 text-xs leading-relaxed">
                                        We use cookies to enhance your experience and analyze traffic.
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleRejectAll}
                                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 text-white transition-colors text-xs font-medium"
                                    >
                                        Reject All
                                    </button>
                                    <button
                                        onClick={handleAcceptAll}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors text-xs font-medium"
                                    >
                                        Accept All
                                    </button>
                                </div>

                                <button
                                    onClick={() => setIsExpanded(true)}
                                    className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                                >
                                    Customize
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium text-white text-[15px]">Cookie Preferences</h3>
                                    <button
                                        onClick={() => setIsExpanded(false)}
                                        className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <p className="text-zinc-500 text-xs leading-relaxed">
                                    Choose which cookies you allow. Your preferences apply across the site.
                                </p>

                                <div className="space-y-3">
                                    {/* Essential */}
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Shield size={14} className="text-emerald-500" />
                                                <span className="text-white text-xs font-medium">Essential</span>
                                            </div>
                                            <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wide">
                                                Required
                                            </span>
                                        </div>
                                        <p className="text-zinc-500 text-[11px] leading-relaxed">
                                            Required for Flowivate to function securely. Handles your login session and privacy preferences.
                                        </p>
                                    </div>

                                    {/* Performance */}
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <Activity size={14} className="text-blue-500" />
                                                <span className="text-white text-xs font-medium">Performance</span>
                                            </div>
                                            <Toggle
                                                checked={consent.performance}
                                                onChange={() => toggleCategory("performance")}
                                            />
                                        </div>
                                        <p className="text-zinc-500 text-[11px] leading-relaxed">
                                            Measures how you interact with the dashboard. Data is anonymized to optimize speed and fix bugs.
                                        </p>
                                    </div>

                                    {/* Personalization */}
                                    <div className="p-3 rounded-lg bg-white/5">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-purple-500" />
                                                <span className="text-white text-xs font-medium">Personalization</span>
                                            </div>
                                            <Toggle
                                                checked={consent.personalization}
                                                onChange={() => toggleCategory("personalization")}
                                            />
                                        </div>
                                        <p className="text-zinc-500 text-[11px] leading-relaxed">
                                            Provides extra features and personalization. May be set by us or partners whose services we use.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleRejectAll}
                                        className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 text-white transition-colors text-xs font-medium"
                                    >
                                        Reject All
                                    </button>
                                    <button
                                        onClick={handleSavePreferences}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 transition-colors text-xs font-medium"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={cn(
                "w-8 h-[18px] rounded-full relative transition-colors duration-150 focus:outline-none",
                checked ? "bg-blue-500" : "bg-zinc-700"
            )}
            aria-pressed={checked}
        >
            <span className="sr-only">Toggle</span>
            <span
                className={cn(
                    "absolute top-[3px] left-[3px] w-3 h-3 rounded-full bg-white transition-transform duration-150",
                    checked && "translate-x-[14px]"
                )}
            />
        </button>
    );
}
