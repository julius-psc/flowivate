"use client";

import React, { ChangeEvent } from "react";
import { KeyRound, Pencil, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";
import Link from "next/link";

const SecurityTab = (): React.JSX.Element => {
  const {
    isEditingPassword,
    setIsEditingPassword,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    setStatusMessage,
    styling,
    sessionStatus,
    session,
  } = useSettings();
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = React.useState<boolean>(false);

  const canUpdatePassword =
    isEditingPassword &&
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isUpdatingPassword;

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword) return;
    setPasswordError(null);
    setStatusMessage({ type: null, message: null });

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await fetchApi("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsEditingPassword(false);
      setStatusMessage({
        type: "success",
        message: "Password updated successfully",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      setPasswordError(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (
      passwordError === "New passwords do not match." &&
      e.target.value === newPassword
    ) {
      setPasswordError(null);
    }
  };

  const renderContent = () => (
    <div className="space-y-6">
      <div className={styling.sectionHeaderClasses}>
        <h2 className={styling.sectionTitleClasses}>Security</h2>
        <p className={styling.sectionDescriptionClasses}>
          Manage your password and account security.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={styling.labelClasses + " mb-0 flex items-center"}>
              <KeyRound
                size={16}
                className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
              Password
            </label>
            {!isEditingPassword && (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="text-sm text-primary hover:text-primary/80 dark:text-primary/70 dark:hover:text-primary/50 flex items-center focus:outline-none focus:underline"
              >
                Change <Pencil size={12} className="ml-1" />
              </button>
            )}
          </div>
          {!isEditingPassword && (
            <div className="flex items-center text-gray-800 dark:text-gray-200 text-sm pl-8">
              <span className="tracking-wider">••••••••</span>
            </div>
          )}
        </div>
        {isEditingPassword && (
          <div className="space-y-4 bg-gray-50 dark:bg-gray-900/30 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <div>
              <label htmlFor="current-password-input" className={styling.labelClasses}>
                Current Password
              </label>
              <input
                id="current-password-input"
                name="current-password"
                type="password"
                value={currentPassword}
                onChange={handleInputChange(setCurrentPassword)}
                className={styling.inputClasses}
                placeholder="Enter your current password"
                autoComplete="current-password"
                required
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <label htmlFor="new-password-input" className={styling.labelClasses}>
                New Password
              </label>
              <input
                id="new-password-input"
                name="new-password"
                type="password"
                value={newPassword}
                onChange={handleInputChange(setNewPassword)}
                className={styling.inputClasses}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <label htmlFor="confirm-password-input" className={styling.labelClasses}>
                Confirm New Password
              </label>
              <input
                id="confirm-password-input"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`${styling.inputClasses} ${
                  passwordError ||
                  (newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword)
                    ? "border-red-400 dark:border-red-600 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                disabled={isUpdatingPassword}
              />
              {passwordError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" /> {passwordError}
                </p>
              )}
              {!passwordError &&
                newPassword &&
                confirmPassword &&
                newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    Passwords do not match.
                  </p>
                )}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsEditingPassword(false);
                  setStatusMessage({ type: null, message: null });
                }}
                disabled={isUpdatingPassword}
                className={styling.buttonSecondaryClasses}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={!canUpdatePassword}
                className={styling.buttonPrimaryClasses}
              >
                {isUpdatingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>
        )}
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

export default SecurityTab;