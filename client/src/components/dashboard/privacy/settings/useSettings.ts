"use client";

import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import { useSession, signOut } from "next-auth/react";
import type { StatusMessage, Theme, StylingClasses, TabId } from "./types";

export const useSettings = () => {
  const {
    data: session,
    status,
    update: updateSession,
  } = useSession();

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) ?? "system";
    }
    return "system";
  });

  const [statusMessage, setStatusMessage] = useState<StatusMessage>({
    type: null,
    message: null,
  });

  const [dirtyTabs, setDirtyTabs] = useState<Set<TabId>>(new Set());

  const markDirtyForTab = useCallback((tab: TabId) => {
    setDirtyTabs((prev) => {
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, []);

  const clearDirtyForTab = useCallback((tab: TabId) => {
    setDirtyTabs((prev) => {
      if (!prev.has(tab)) return prev;
      const next = new Set(prev);
      next.delete(tab);
      return next;
    });
  }, []);

  const clearAllDirty = useCallback(() => setDirtyTabs(new Set()), []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    } else {
      root.classList.toggle("dark", theme === "dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const prefersDark = mq.matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const clearStatusMessage = useCallback(
    () => setStatusMessage({ type: null, message: null }),
    []
  );

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout> | null = null;
    if (statusMessage.type && statusMessage.message) {
      timerId = setTimeout(clearStatusMessage, 3500);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [statusMessage, clearStatusMessage]);

  const styling: StylingClasses = useMemo(
    () => ({
      inputClasses:
        "w-full h-9 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed",
      labelClasses:
        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5",
      buttonBaseClasses:
        "text-sm font-medium rounded-md inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed",
      buttonPrimaryClasses:
        "px-4 h-9 text-white bg-primary hover:bg-primary/85 focus:ring-primary min-w-[96px]",
      buttonSecondaryClasses:
        "px-4 h-9 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-400",
      buttonDangerClasses:
        "px-4 h-9 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 min-w-[96px]",
      buttonDangerOutlineClasses:
        "px-4 h-9 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 hover:bg-red-100/30 dark:hover:bg-red-900/20 focus:ring-red-500",
      linkButtonPrimaryClasses: "text-xs !px-3 !h-8",
      linkButtonSecondaryClasses: "text-xs !px-3 !h-8 inline-flex items-center",
      sectionHeaderClasses:
        "border-b border-gray-200 dark:border-gray-800 pb-4 mb-6",
      sectionTitleClasses:
        "text-xl font-semibold text-gray-900 dark:text-gray-100",
      sectionDescriptionClasses: "text-sm text-gray-500 dark:text-gray-400 mt-1",
    }),
    []
  );

  // Expose a no-op cancel hook useful for external callers (e.g., closing Danger tab)
  const cancelDeleteAccount = useCallback(() => {
    clearStatusMessage();
  }, [clearStatusMessage]);

  return {
    theme,
    setTheme,
    statusMessage,
    setStatusMessage,
    clearStatusMessage,
    session,
    sessionStatus: status,
    updateSession,
    styling,
    signOut,
    dirtyTabs,
    markDirtyForTab,
    clearDirtyForTab,
    clearAllDirty,
    cancelDeleteAccount,
  };
};