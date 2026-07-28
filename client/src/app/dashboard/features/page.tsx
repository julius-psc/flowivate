"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey, featureComponents } from "../../../components/dashboard/features/featureMap";
import { useTheme } from "next-themes";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { Skeleton } from "@/components/ui/Skeleton";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { isFreeStatus } from "@/lib/subscription";
import { IconLock } from "@tabler/icons-react";
import PaywallPopup from "@/components/dashboard/PaywallPopup";

const featureCategories = [
  {
    name: "AI",
    features: [
      { key: "Assistant", displayName: "Lumo", description: "AI-powered productivity assistant", icon: "✨" },
    ],
  },
  {
    name: "Focus",
    features: [
      { key: "Tasks", displayName: "Tasks", description: "Plan and track your daily tasks", icon: "✓" },
      { key: "Pomodoro", displayName: "Pomodoro", description: "Timed sessions for focused work", icon: "⏱" },
      { key: "DeepWork", displayName: "Deep Work", description: "Distraction-free work mode", icon: "🎯" },
      { key: "Ambient", displayName: "Ambient", description: "Background sounds for concentration", icon: "🎧" },
    ],
  },
  {
    name: "Wellness",
    features: [
      { key: "Meditation", displayName: "Meditation", description: "Guided sessions for mental clarity", icon: "🧘" },
      { key: "Affirmations", displayName: "Affirmations", description: "Daily positive reminders", icon: "💬" },
      { key: "Mood", displayName: "Mood", description: "Track and reflect on emotions", icon: "😊" },
    ],
  },
  {
    name: "Tracking",
    features: [
      { key: "Water", displayName: "Water", description: "Hydration tracking throughout the day", icon: "💧" },
      { key: "Sleep", displayName: "Sleep", description: "Monitor and improve rest quality", icon: "🌙" },
      { key: "Books", displayName: "Books", description: "Organize your reading list", icon: "📚" },
    ],
  },
];

// Toggle — sized for presence, not an afterthought
function ToggleSwitch({
  enabled,
  onChange,
  disabled,
  isSpecialTheme,
}: {
  enabled: boolean;
  onChange: () => void;
  disabled: boolean;
  isSpecialTheme: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      className={`
        relative inline-flex h-[22px] w-[40px] shrink-0 rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-1
        ${disabled ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
        ${enabled
          ? "bg-primary-blue"
          : isSpecialTheme
            ? "bg-white/[0.12]"
            : "bg-gray-200/90 dark:bg-zinc-700"
        }
      `}
    >
      <span
        className={`
          pointer-events-none absolute top-[3px] left-[3px]
          h-4 w-4 rounded-full bg-white
          shadow-[0_1px_4px_rgba(0,0,0,0.28)]
          transform transition-transform duration-200 ease-in-out
          ${enabled ? "translate-x-[18px]" : "translate-x-0"}
        `}
      />
    </button>
  );
}

export default function Features() {
  const { addFeature, removeFeature, isFeatureSelected, selectedFeatures } = useDashboard();
  const { status: subscriptionStatus, loading } = useSubscriptionStatus();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const isSpecialTheme =
    isMounted && !!theme && specialSceneThemeNames.includes(theme as (typeof specialSceneThemeNames)[number]);

  // ── Loading skeleton ──────────────────────────────────────────────
  if (loading || !isMounted) {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="mb-10">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-3.5 w-52" />
        </div>
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-14 mb-3" />
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-800">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className={`flex items-center gap-4 px-4 py-3.5 ${j < 2 ? "border-b border-gray-100 dark:border-zinc-800/80" : ""}`}>
                    <Skeleton className="h-8 w-8 rounded-[8px] shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-3.5 w-24 mb-1.5" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <Skeleton className="h-[22px] w-[40px] rounded-full shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isFreeUser = isFreeStatus(subscriptionStatus);

  const handleToggle = (key: FeatureKey) => {
    if (isFeatureSelected(key)) removeFeature(key);
    else addFeature(key);
  };

  // ── Theme tokens ──────────────────────────────────────────────────
  const headingText = isSpecialTheme
    ? "text-white"
    : "text-gray-900 dark:text-white";

  const subText = isSpecialTheme
    ? "text-white/40"
    : "text-gray-500 dark:text-zinc-500";

  const categoryLabel = isSpecialTheme
    ? "text-white/30"
    : "text-gray-400 dark:text-zinc-500";

  const ruleColor = isSpecialTheme
    ? "bg-white/[0.06]"
    : "bg-gray-200/70 dark:bg-zinc-800/70";

  const containerBorder = isSpecialTheme
    ? "border-white/[0.07]"
    : "border-gray-200 dark:border-zinc-800";

  const rowDivider = isSpecialTheme
    ? "border-white/[0.05]"
    : "border-gray-100 dark:border-zinc-800/80";

  const rowHover = isSpecialTheme
    ? "hover:bg-white/[0.04]"
    : "hover:bg-gray-50/60 dark:hover:bg-zinc-900/50";

  const rowSelected = isSpecialTheme
    ? "bg-white/[0.06]"
    : "bg-primary-blue/[0.03] dark:bg-primary-blue/[0.05]";

  const featureName = isSpecialTheme
    ? "text-white"
    : "text-gray-900 dark:text-white";

  const featureDesc = isSpecialTheme
    ? "text-white/35"
    : "text-gray-400 dark:text-zinc-500";

  const iconBase = isSpecialTheme
    ? "bg-white/[0.06]"
    : "bg-gray-100 dark:bg-zinc-800/80";

  const iconSelected = isSpecialTheme
    ? "bg-white/10"
    : "bg-primary-blue/[0.1] dark:bg-primary-blue/[0.12]";

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="mb-10">
        <h1 className={`text-[18px] font-semibold tracking-[-0.02em] ${headingText}`}>
          Features
        </h1>
        <p className={`text-[13px] mt-1 ${subText}`}>
          Customize your dashboard by enabling the features you need
        </p>
      </div>

      {/* ── Categories ───────────────────────────────────────────── */}
      <div className="space-y-7">
        {featureCategories.map((category) => (
          <div key={category.name}>
            {/* Category label + rule */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-[11px] font-medium tracking-[0.04em] whitespace-nowrap ${categoryLabel}`}>
                {category.name}
              </span>
              <div className={`flex-1 h-px ${ruleColor}`} />
            </div>

            {/* Feature list inside a bordered container */}
            <div className={`rounded-xl border overflow-hidden ${containerBorder}`}>
              {category.features.map((feature, idx) => {
                const isSelected = isFeatureSelected(feature.key as FeatureKey);
                const isEliteFeature = featureComponents[feature.key as FeatureKey]?.isPro;
                const hasReachedLimit = isFreeUser && selectedFeatures.length >= 4 && !isSelected;

                let isLocked = false;
                let lockReason = "";
                if (isEliteFeature && isFreeUser) { isLocked = true; lockReason = "Elite"; }
                else if (hasReachedLimit) { isLocked = true; lockReason = "Limit"; }

                const isLast = idx === category.features.length - 1;

                return (
                  <div
                    key={feature.key}
                    onClick={() => {
                      if (isLocked) setShowPaywall(true);
                      else handleToggle(feature.key as FeatureKey);
                    }}
                    className={`
                      flex items-center gap-3.5 px-4 py-3.5
                      transition-colors duration-100
                      ${!isLast ? `border-b ${rowDivider}` : ""}
                      ${isLocked ? "opacity-45 cursor-not-allowed" : "cursor-pointer"}
                      ${isSelected ? rowSelected : rowHover}
                    `}
                  >
                    {/* Icon chip */}
                    <div className={`w-8 h-8 rounded-[8px] flex items-center justify-center text-[14px] shrink-0 transition-colors duration-100 ${isSelected ? iconSelected : iconBase}`}>
                      {feature.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-[2px]">
                        <span className={`text-[13px] font-medium leading-none ${featureName}`}>
                          {feature.displayName}
                        </span>
                        {isEliteFeature && (
                          <span className="text-[8px] font-bold uppercase tracking-[0.09em] px-[5px] py-[2px] rounded-[4px] text-primary-blue border border-primary-blue/25 bg-primary-blue/[0.07]">
                            Elite
                          </span>
                        )}
                      </div>
                      <p className={`text-[12px] leading-relaxed ${featureDesc}`}>
                        {feature.description}
                      </p>
                    </div>

                    {/* Right side: lock or toggle */}
                    <div className="shrink-0">
                      {isLocked ? (
                        <div className="flex items-center gap-1.5">
                          <IconLock
                            size={11}
                            strokeWidth={2}
                            className={isSpecialTheme ? "text-white/20" : "text-gray-400/50 dark:text-zinc-600"}
                          />
                          <span className={`text-[10px] font-semibold uppercase tracking-[0.07em] ${isSpecialTheme ? "text-white/20" : "text-gray-400/50 dark:text-zinc-600"}`}>
                            {lockReason}
                          </span>
                        </div>
                      ) : (
                        <ToggleSwitch
                          enabled={isSelected}
                          onChange={() => handleToggle(feature.key as FeatureKey)}
                          disabled={isLocked}
                          isSpecialTheme={isSpecialTheme}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Free plan note ────────────────────────────────────────── */}
      {isFreeUser && (
        <p className={`text-[12px] mt-8 text-center ${isSpecialTheme ? "text-white/25" : "text-gray-400/70 dark:text-zinc-600"}`}>
          Free plan is limited to 4 features.{" "}
          <span
            onClick={() => setShowPaywall(true)}
            className="text-primary-blue cursor-pointer hover:underline underline-offset-2"
          >
            Upgrade to Elite
          </span>{" "}
          for unlimited access.
        </p>
      )}

      <PaywallPopup isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}
