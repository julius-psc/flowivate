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

  // Modern, clean styling inspired by Vercel/Linear
  const styling: StylingClasses = useMemo(
    () => ({
      inputClasses:
        "w-full h-9 px-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:focus:ring-zinc-100/10 focus:border-zinc-400 dark:focus:border-zinc-600 text-zinc-900 dark:text-zinc-100 text-[13px] placeholder:text-zinc-400 dark:placeholder:text-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors",
      labelClasses:
        "block text-[13px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5",
      buttonBaseClasses:
        "text-[13px] font-medium rounded-lg inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed",
      buttonPrimaryClasses:
        "px-3.5 h-9 text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-100",
      buttonSecondaryClasses:
        "px-3.5 h-9 text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 focus-visible:ring-zinc-400",
      buttonDangerClasses:
        "px-3.5 h-9 text-white bg-red-600 hover:bg-red-700 focus-visible:ring-red-500",
      buttonDangerOutlineClasses:
        "px-3.5 h-9 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 focus-visible:ring-red-500",
      linkButtonPrimaryClasses: "text-xs !px-3 !h-8",
      linkButtonSecondaryClasses: "text-xs !px-3 !h-8 inline-flex items-center",
      sectionHeaderClasses:
        "border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6",
      sectionTitleClasses:
        "text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight",
      sectionDescriptionClasses: "text-[13px] text-zinc-500 dark:text-zinc-500 mt-1",
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