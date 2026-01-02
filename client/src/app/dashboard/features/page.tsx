"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import { useTheme } from "next-themes";
import useSubscriptionStatus from "@/hooks/useSubscriptionStatus";
import { motion, AnimatePresence } from "motion/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { specialSceneThemeNames } from "@/lib/themeConfig";

const allFeatures = [
  {
    key: "Assistant",
    description: "AI-powered support for smarter work",
    proOnly: true,
  },
  {
    key: "Tasks",
    description: "Plan and track your daily tasks",
    proOnly: false,
  },
  {
    key: "Pomodoro",
    description: "Timed sessions for focused work",
    proOnly: false,
  },
  {
    key: "DeepWork",
    description: "Distraction-free work mode",
    proOnly: false,
  },
  {
    key: "Ambient",
    description: "Background sounds for concentration",
    proOnly: false,
  },
  {
    key: "Meditation",
    description: "Guided sessions for mental clarity",
    proOnly: false,
  },
  {
    key: "Affirmations",
    description: "Daily positive reminders",
    proOnly: false,
  },
  {
    key: "Mood",
    description: "Track and reflect on emotions",
    proOnly: false,
  },
  {
    key: "Water",
    description: "Hydration tracking throughout the day",
    proOnly: false,
  },
  {
    key: "Sleep",
    description: "Monitor and improve rest quality",
    proOnly: false,
  },
  {
    key: "Books",
    description: "Organize your reading list",
    proOnly: false,
  },
];

export default function Features() {
  const { addFeature, removeFeature, isFeatureSelected, selectedFeatures } =
    useDashboard();
  const { status: subscriptionStatus, loading } = useSubscriptionStatus();
  const { theme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

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
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isFreeUser = subscriptionStatus === "free";

  const handleToggle = (key: FeatureKey, enabled: boolean) => {
    if (enabled) {
      addFeature(key);
    } else {
      removeFeature(key);
    }
  };

  return (
    <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className={`text-2xl font-semibold tracking-tight ${isSpecialTheme ? "text-secondary-white" : "text-secondary-black dark:text-secondary-white"}`}>
          Features
        </h1>
        <p className={`text-sm mt-1 ${isSpecialTheme ? "text-secondary-white/50" : "text-gray-500 dark:text-gray-400"}`}>
          {isFreeUser
            ? `${selectedFeatures.length}/4 features enabled`
            : `${selectedFeatures.length} features enabled`}
        </p>
      </div>

      <div className={`backdrop-blur-md rounded-xl border overflow-hidden ${isSpecialTheme ? "dark bg-secondary-black/50 border-bdr-dark/50" : "bg-secondary-white/80 dark:bg-secondary-black/80 border-bdr-light/50 dark:border-bdr-dark/50"}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-bdr-light/50 dark:bg-bdr-dark/50">
          {allFeatures.map((feature, index) => {
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
              lockReason = "Limit reached";
            }

            return (
              <div
                key={feature.key}
                className={`flex items-center justify-between px-6 py-5 ${isSpecialTheme
                  ? "bg-secondary-black/50"
                  : "bg-secondary-white/50 dark:bg-secondary-black/50"
                  }`}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-[15px] font-medium ${isSpecialTheme ? "text-secondary-white" : "text-secondary-black dark:text-secondary-white"}`}>
                      {feature.key}
                    </span>
                    {isProFeature && (
                      <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${isSpecialTheme
                        ? "text-secondary-white/40 bg-secondary-white/5"
                        : "text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-800"
                        }`}>
                        Pro
                      </span>
                    )}
                  </div>
                  <p className={`text-[13px] mt-1 ${isSpecialTheme ? "text-secondary-white/40" : "text-gray-500 dark:text-gray-400"}`}>
                    {feature.description}
                  </p>
                </div>

                <div className="relative flex-shrink-0">
                  {isLocked ? (
                    <div className="group relative">
                      <button
                        disabled
                        className={`relative h-6 w-11 rounded-full transition-colors ${isSpecialTheme
                          ? "bg-secondary-white/10"
                          : "bg-gray-200 dark:bg-zinc-700"
                          } cursor-not-allowed`}
                      >
                        <span
                          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full transition-transform ${isSpecialTheme
                            ? "bg-secondary-white/30"
                            : "bg-gray-400 dark:bg-zinc-500"
                            }`}
                        />
                      </button>
                      <div className={`absolute right-0 top-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] whitespace-nowrap ${isSpecialTheme ? "text-secondary-white/40" : "text-gray-400"
                        }`}>
                        {lockReason}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleToggle(feature.key as FeatureKey, !isSelected)
                      }
                      className={`relative h-6 w-11 rounded-full transition-colors ${isSelected
                        ? "bg-primary-blue"
                        : isSpecialTheme
                          ? "bg-secondary-white/10"
                          : "bg-gray-200 dark:bg-zinc-700"
                        }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full transition-all duration-200 ${isSelected
                          ? "left-[22px] bg-secondary-white"
                          : "left-0.5 bg-secondary-white dark:bg-gray-400"
                          }`}
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isFreeUser && (
        <p className={`text-[12px] mt-4 ${isSpecialTheme ? "text-secondary-white/30" : "text-gray-400 dark:text-gray-500"}`}>
          Upgrade to Pro to unlock all features and remove limits.
        </p>
      )}
    </div>
  );
}