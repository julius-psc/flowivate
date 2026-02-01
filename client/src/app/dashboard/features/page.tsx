"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import { useTheme } from "next-themes";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { Skeleton } from "@/components/ui/Skeleton";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { IconLock } from "@tabler/icons-react";
import PaywallPopup from "@/components/dashboard/PaywallPopup";

// Feature categories with their features
const featureCategories = [
  {
    name: "AI",
    features: [
      {
        key: "Assistant",
        displayName: "Lumo",
        description: "AI-powered productivity assistant",
        proOnly: true,
        icon: "✨",
      },
    ],
  },
  {
    name: "Focus",
    features: [
      {
        key: "Tasks",
        displayName: "Tasks",
        description: "Plan and track your daily tasks",
        proOnly: false,
        icon: "✓",
      },
      {
        key: "Pomodoro",
        displayName: "Pomodoro",
        description: "Timed sessions for focused work",
        proOnly: false,
        icon: "⏱",
      },
      {
        key: "DeepWork",
        displayName: "Deep Work",
        description: "Distraction-free work mode",
        proOnly: false,
        icon: "🎯",
      },
      {
        key: "Ambient",
        displayName: "Ambient",
        description: "Background sounds for concentration",
        proOnly: false,
        icon: "🎧",
      },
    ],
  },
  {
    name: "Wellness",
    features: [
      {
        key: "Meditation",
        displayName: "Meditation",
        description: "Guided sessions for mental clarity",
        proOnly: false,
        icon: "🧘",
      },
      {
        key: "Affirmations",
        displayName: "Affirmations",
        description: "Daily positive reminders",
        proOnly: false,
        icon: "💬",
      },
      {
        key: "Mood",
        displayName: "Mood",
        description: "Track and reflect on emotions",
        proOnly: false,
        icon: "😊",
      },
    ],
  },
  {
    name: "Tracking",
    features: [
      {
        key: "Water",
        displayName: "Water",
        description: "Hydration tracking throughout the day",
        proOnly: false,
        icon: "💧",
      },
      {
        key: "Sleep",
        displayName: "Sleep",
        description: "Monitor and improve rest quality",
        proOnly: false,
        icon: "🌙",
      },
      {
        key: "Books",
        displayName: "Books",
        description: "Organize your reading list",
        proOnly: false,
        icon: "📚",
      },
    ],
  },
];

// Toggle Switch Component
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
        relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer 
        rounded-full border-2 border-transparent 
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2
        ${disabled ? "cursor-not-allowed opacity-40" : ""}
        ${enabled
          ? "bg-primary-blue"
          : isSpecialTheme
            ? "bg-secondary-white/20"
            : "bg-secondary-black/15 dark:bg-secondary-white/20"
        }
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 
          transform rounded-full bg-white 
          transition duration-200 ease-in-out
          ${enabled ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}

export default function Features() {
  const { addFeature, removeFeature, isFeatureSelected, selectedFeatures } =
    useDashboard();
  const { status: subscriptionStatus, loading } = useSubscriptionStatus();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  if (loading || !isMounted) {
    return (
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-7 w-28 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="space-y-8">
          {[...Array(3)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-[72px] w-full rounded-xl" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isFreeUser = subscriptionStatus === "free";

  const handleToggle = (key: FeatureKey) => {
    const isSelected = isFeatureSelected(key);
    if (isSelected) {
      removeFeature(key);
    } else {
      addFeature(key);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1
          className={`text-xl font-medium tracking-tight ${isSpecialTheme
            ? "text-secondary-white"
            : "text-secondary-black dark:text-secondary-white"
            }`}
        >
          Features
        </h1>
        <p
          className={`text-sm mt-1 ${isSpecialTheme
            ? "text-secondary-white/50"
            : "text-secondary-black/50 dark:text-secondary-white/50"
            }`}
        >
          Customize your dashboard by enabling the features you need
        </p>
      </div>

      {/* Feature Categories */}
      <div className="space-y-8">
        {featureCategories.map((category) => (
          <div key={category.name}>
            {/* Category Heading */}
            <h2
              className={`text-xs font-medium uppercase tracking-wider mb-3 ${isSpecialTheme
                ? "text-secondary-white/40"
                : "text-secondary-black/40 dark:text-secondary-white/40"
                }`}
            >
              {category.name}
            </h2>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {category.features.map((feature) => {
                const isSelected = isFeatureSelected(feature.key as FeatureKey);
                const isProFeature = feature.proOnly;
                const hasReachedLimit =
                  isFreeUser && selectedFeatures.length >= 4 && !isSelected;

                let isLocked = false;
                let lockReason = "";

                if (isProFeature && isFreeUser) {
                  isLocked = true;
                  lockReason = "Pro";
                } else if (hasReachedLimit) {
                  isLocked = true;
                  lockReason = "Limit";
                }

                return (
                  <div
                    key={feature.key}
                    className={`
                      relative p-4 rounded-xl transition-all duration-150
                      ${isLocked
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer"
                      }
                      ${isSpecialTheme
                        ? "bg-zinc-900/60 backdrop-blur-md"
                        : "border"
                      }
                      ${isSelected
                        ? isSpecialTheme
                          ? "bg-zinc-900/70"
                          : "border-secondary-black/12 bg-secondary-black/[0.02] dark:border-secondary-white/15 dark:bg-secondary-white/[0.03]"
                        : isSpecialTheme
                          ? "hover:bg-zinc-900/80"
                          : "border-secondary-black/[0.06] hover:border-secondary-black/10 dark:border-secondary-white/[0.08] dark:hover:border-secondary-white/12"
                      }
                    `}
                    onClick={() => {
                      if (isLocked) {
                        setShowPaywall(true);
                      } else {
                        handleToggle(feature.key as FeatureKey);
                      }
                    }}
                  >
                    {/* Card Layout: Icon left, Content middle, Toggle right */}
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <span
                        className="text-xl flex-shrink-0"
                        role="img"
                        aria-label={feature.displayName}
                      >
                        {feature.icon}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[14px] font-medium ${isSpecialTheme
                              ? "text-secondary-white"
                              : "text-secondary-black dark:text-secondary-white"
                              }`}
                          >
                            {feature.displayName}
                          </span>
                          {/* Pro Badge - inline with name */}
                          {isProFeature && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded text-primary-blue bg-primary-blue/10">
                              Pro
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] mt-0.5 leading-relaxed ${isSpecialTheme
                            ? "text-secondary-white/40"
                            : "text-secondary-black/50 dark:text-secondary-white/40"
                            }`}
                        >
                          {feature.description}
                        </p>
                      </div>

                      {/* Toggle or Lock */}
                      <div className="flex-shrink-0 ml-2">
                        {isLocked ? (
                          <div className="flex items-center gap-1">
                            <IconLock
                              size={12}
                              strokeWidth={2}
                              className={
                                isSpecialTheme
                                  ? "text-secondary-white/40"
                                  : "text-secondary-black/40 dark:text-secondary-white/40"
                              }
                            />
                            <span
                              className={`text-[10px] font-medium uppercase tracking-wide ${isSpecialTheme
                                ? "text-secondary-white/40"
                                : "text-secondary-black/40 dark:text-secondary-white/40"
                                }`}
                            >
                              {lockReason}
                            </span>
                          </div>
                        ) : (
                          <ToggleSwitch
                            enabled={isSelected}
                            onChange={() =>
                              handleToggle(feature.key as FeatureKey)
                            }
                            disabled={isLocked}
                            isSpecialTheme={isSpecialTheme}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      {isFreeUser && (
        <p
          className={`text-[12px] mt-8 text-center ${isSpecialTheme
            ? "text-secondary-white/30"
            : "text-secondary-black/40 dark:text-secondary-white/30"
            }`}
        >
          Free plan is limited to 4 features.{" "}
          <span
            onClick={() => setShowPaywall(true)}
            className="text-primary-blue cursor-pointer hover:underline"
          >
            Upgrade to Pro
          </span>{" "}
          for unlimited access.
        </p>
      )}
      <PaywallPopup isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  );
}