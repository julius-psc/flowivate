"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import { X, User, Settings, CreditCard, AlertTriangle } from "lucide-react";
import StatusIndicator from "./StatusIndicator";
import { useSettings } from "./useSettings";
import { SettingsModalProps, Tab, TabId } from "./types";

const AccountTab = React.lazy(() => import("./tabs/AccountTab"));
const AppearanceTab = React.lazy(() => import("./tabs/AppearanceTab"));
const SubscriptionTab = React.lazy(() => import("./tabs/SubscriptionTab"));
const DangerTab = React.lazy(() => import("./tabs/DangerTab"));

const tabs: Tab[] = [
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Settings size={16} /> },
  { id: "subscription", label: "Billing", icon: <CreditCard size={16} /> },
  { id: "danger", label: "Danger", icon: <AlertTriangle size={16} /> },
];

function useQueryState(key: string, initial: string) {
  const [value, setValue] = useState<string>(() => {
    if (typeof window === "undefined") return initial;
    const params = new URLSearchParams(window.location.search);
    return params.get(key) ?? initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, "", url.toString());
  }, [key, value]);

  return [value, setValue] as const;
}

function isTabId(v: string): v is TabId {
  return tabs.some((t) => t.id === v);
}

export default function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps): React.JSX.Element | null {
  const isClient = typeof window !== "undefined";
  const [activeTab, setActiveTab] = useQueryState("tab", "account");
  const {
    statusMessage,
    setStatusMessage,
    clearStatusMessage,
    styling,
    dirtyTabs,
    clearDirtyForTab,
  } = useSettings();

  const validActive: TabId = useMemo(
    () => (isTabId(activeTab) ? activeTab : "account"),
    [activeTab]
  );

  // Handle URL query params for messages (async schedule to avoid sync setState in effect body)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const message = params.get("message");
    const error = params.get("error");

    if (message || error) {
      queueMicrotask(() => {
        if (message) {
          setStatusMessage({
            type: "success",
            message: decodeURIComponent(message),
          });
        } else if (error) {
          setStatusMessage({
            type: "error",
            message: decodeURIComponent(error),
          });
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("message");
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.toString());
      });
    }
  }, [setStatusMessage]);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && /^[1-4]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const t = tabs[idx];
        if (t) setActiveTab(t.id);
      }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const idx = tabs.findIndex((t) => t.id === validActive);
        const next =
          e.key === "ArrowRight"
            ? tabs[(idx + 1) % tabs.length]
            : tabs[(idx - 1 + tabs.length) % tabs.length];
        setActiveTab(next.id);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, setActiveTab, validActive, onClose]);

  if (!isOpen || !isClient) return null;

  const onChangeTab = (id: TabId) => {
    clearDirtyForTab(validActive);
    setActiveTab(id);
  };

  const content = (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        className="fixed inset-0 z-1000 bg-white dark:bg-[#0B0B0D]"
      >
        <div className="grid w-full h-full grid-cols-1 sm:grid-cols-[240px_1fr]">
          <aside className="hidden sm:flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111113]">
            <div className="px-4 py-5 border-b border-gray-200/80 dark:border-gray-800/80">
              <h1
                id="settings-modal-title"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100"
              >
                Settings
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage your Flowivate workspace
              </p>
            </div>
            <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
              {tabs.map((t) => {
                const active = validActive === t.id;
                const isDirty = dirtyTabs.has(t.id);
                const danger = t.id === "danger";
                return (
                  <button
                    key={t.id}
                    onClick={() => onChangeTab(t.id)}
                    className={[
                      "w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium"
                        : danger
                        ? "text-red-600 dark:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-950/30"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className={danger ? "text-red-500" : undefined}>
                        {t.icon}
                      </span>
                      {t.label}
                    </span>
                    {isDirty && (
                      <span
                        className="ml-2 h-2 w-2 rounded-full bg-amber-500"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="relative flex flex-col h-full overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 rounded-md p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>

            <div className="w-full px-6 sm:px-10 py-8">
              <div className="max-w-3xl mx-auto">
                <Suspense
                  fallback={
                    <div className="animate-pulse space-y-3">
                      <div className="h-6 w-40 rounded-md bg-gray-200 dark:bg-gray-800" />
                      <div className="h-4 w-72 rounded-md bg-gray-200 dark:bg-gray-800" />
                      <div className="h-24 rounded-md bg-gray-200 dark:bg-gray-800" />
                    </div>
                  }
                >
                  {validActive === "account" && <AccountTab />}
                  {validActive === "appearance" && <AppearanceTab />}
                  {validActive === "subscription" && <SubscriptionTab />}
                  {validActive === "danger" && <DangerTab />}
                </Suspense>
              </div>
            </div>
          </section>
        </div>
      </div>

      <StatusIndicator
        statusMessage={statusMessage}
        clearStatusMessage={clearStatusMessage}
        styling={styling}
      />
    </>
  );

  return createPortal(content, document.body);
}