"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { StatusMessage, Theme, StylingClasses } from "./types";

export const useSettings = () => {
  const { data: session, status, update: updateSession } = useSession();

  // Initialize theme directly from localStorage to avoid a flash on mount
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

  // Security State for cancellation
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  // Danger Zone State for cancellation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");

  // Apply theme synchronously before paint to avoid a flash
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

  // Keep in sync with OS when in "system" mode
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") {
        const prefersDark = mediaQuery.matches;
        document.documentElement.classList.toggle("dark", prefersDark);
      }
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // Status Message Effect: auto-clear after 5 seconds
  const clearStatusMessage = useCallback(() => {
    setStatusMessage({ type: null, message: null });
  }, []);

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (statusMessage.type && statusMessage.message) {
      timerId = setTimeout(clearStatusMessage, 5000);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [statusMessage, clearStatusMessage]);

  // Cancellation Handlers
  const cancelEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsEditingPassword(false);
    setStatusMessage({ type: null, message: null });
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setStatusMessage({ type: null, message: null });
  };

  // Styling Classes
  const styling: StylingClasses = {
    inputClasses:
      "w-full p-2 bg-secondary-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed",
    labelClasses:
      "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
    buttonBaseClasses:
      "text-sm font-medium rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed",
    buttonPrimaryClasses:
      "px-4 py-1.5 text-secondary-white bg-primary hover:bg-primary/80 focus:ring-primary min-w-[80px]",
    buttonSecondaryClasses:
      "px-4 py-1.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-400",
    buttonDangerClasses:
      "px-4 py-1.5 text-secondary-white bg-red-600 hover:bg-red-700 focus:ring-red-500 min-w-[80px]",
    buttonDangerOutlineClasses:
      "px-4 py-1.5 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 hover:bg-red-100/30 dark:hover:bg-red-900/20 focus:ring-red-500",
    linkButtonPrimaryClasses: "text-xs !px-3 !py-1",
    linkButtonSecondaryClasses: "text-xs !px-3 !py-1 flex items-center",
    sectionHeaderClasses:
      "border-b border-gray-200 dark:border-gray-700 pb-3 mb-5",
    sectionTitleClasses:
      "text-lg font-semibold text-gray-900 dark:text-gray-100",
    sectionDescriptionClasses:
      "text-sm text-gray-500 dark:text-gray-400 mt-1",
  };

  return {
    theme,
    setTheme,
    statusMessage,
    setStatusMessage,
    clearStatusMessage,
    session,
    sessionStatus: status,
    updateSession,
    isEditingPassword,
    setIsEditingPassword,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    cancelEditPassword,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmText,
    setDeleteConfirmText,
    cancelDeleteAccount,
    styling,
    signOut,
  };
};