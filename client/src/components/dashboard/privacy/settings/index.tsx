"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { createPortal } from "react-dom";
import { X, User, Palette, CreditCard, AlertTriangle } from "lucide-react";
import StatusIndicator from "./StatusIndicator";
import { useSettings } from "./useSettings";
import { SettingsModalProps, Tab, TabId } from "./types";

const AccountTab = React.lazy(() => import("./tabs/AccountTab"));
const AppearanceTab = React.lazy(() => import("./tabs/AppearanceTab"));
const SubscriptionTab = React.lazy(() => import("./tabs/SubscriptionTab"));
const DangerTab = React.lazy(() => import("./tabs/DangerTab"));

const tabs: Tab[] = [
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Palette size={16} /> },
  { id: "subscription", label: "Billing", icon: <CreditCard size={16} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={16} /> },
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
        className="fixed inset-0 z-1000 bg-white dark:bg-[#09090B]"
      >
        <div className="grid w-full h-full grid-cols-1 sm:grid-cols-[220px_1fr]">
          {/* Sidebar */}
          <aside className="hidden sm:flex flex-col border-r border-zinc-200 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/30">
            <nav className="flex-1 px-3 pt-6 pb-4">
              <h1 id="settings-modal-title" className="sr-only">Settings</h1>
              <div className="space-y-0.5">
                {tabs.map((t) => {
                  const active = validActive === t.id;
                  const isDirty = dirtyTabs.has(t.id);
                  const danger = t.id === "danger";
                  return (
                    <button
                      key={t.id}
                      onClick={() => onChangeTab(t.id)}
                      className={[
                        "w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 text-[13px] transition-all duration-150",
                        active
                          ? "bg-zinc-200/70 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                          : danger
                            ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-200",
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="inline-flex items-center gap-2.5">
                        <span
                          className={
                            danger
                              ? "text-red-500 dark:text-red-400"
                              : active
                                ? "text-zinc-700 dark:text-zinc-300"
                                : "text-zinc-500 dark:text-zinc-500"
                          }
                        >
                          {t.icon}
                        </span>
                        {t.label}
                      </span>
                      {isDirty && (
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-amber-500"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <section className="relative flex flex-col h-full overflow-y-auto bg-white dark:bg-[#09090B]">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 z-20 rounded-md p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>

            {/* Content Area */}
            <div className="w-full px-6 sm:px-12 py-10">
              <div className="max-w-2xl">
                <Suspense
                  fallback={
                    <div className="space-y-4">
                      <div className="h-7 w-32 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-4 w-64 rounded bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-32 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse mt-6" />
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