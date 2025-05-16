"use client";

import React from "react";
import Link from "next/link";
import { useSettings } from "../useSettings";
import { AlertCircle, ArrowRight, ExternalLink, Loader2 } from "lucide-react";

const SubscriptionTab = (): React.JSX.Element => {
  const { styling, sessionStatus, session } = useSettings();

  const renderContent = () => (
    <div className="space-y-6">
      <div className={styling.sectionHeaderClasses}>
        <h2 className={styling.sectionTitleClasses}>Subscription</h2>
        <p className={styling.sectionDescriptionClasses}>
          Manage your plan and billing details.
        </p>
      </div>
      <div className="space-y-5">
        <div className="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Current Plan
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You are currently on the free plan.
              </p>
            </div>
            <span className="text-sm font-semibold text-primary dark:text-primary/70 px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20">
              Free
            </span>
          </div>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Upgrade Options
            </h3>
          </div>
          <div className="p-3 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Pro Plan
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Unlock premium features and priority support.
                </p>
              </div>
              <Link
                href="/pricing"
                className={`${styling.buttonPrimaryClasses} ${styling.linkButtonPrimaryClasses}`}
              >
                Upgrade
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Enterprise Plan
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Custom solutions for teams.
                </p>
              </div>
              <Link
                href="/contact-sales"
                className={`${styling.buttonSecondaryClasses} ${styling.linkButtonSecondaryClasses}`}
              >
                Contact Sales <ExternalLink size={12} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2
          className="animate-spin text-gray-400 dark:text-gray-500"
          size={24}
        />
      </div>
    );
  }
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center p-4">
        <AlertCircle
          className="mb-3 text-gray-400 dark:text-gray-500"
          size={24}
        />
        <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
          Please log in to manage this section.
        </p>
        <Link
          href="/api/auth/signin"
          className="text-sm text-primary hover:text-primary/80 dark:text-primary/70 dark:hover:text-primary/50 inline-flex items-center py-1 px-3 rounded-md border border-primary/30 dark:border-primary/50 bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-1 dark:focus:ring-offset-gray-950"
        >
          Go to login <ArrowRight size={14} className="ml-1" />
        </Link>
      </div>
    );
  }
  if (sessionStatus === "authenticated" && session?.user) {
    return renderContent();
  }
  return (
    <p className="text-center text-gray-500 dark:text-gray-400">
      Session data not available.
    </p>
  );
};

export default SubscriptionTab;