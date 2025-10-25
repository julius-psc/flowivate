"use client";

import React, { ChangeEvent, useEffect } from "react";
import {
  KeyRound,
  Loader2,
  Shield,
  Check,
  Smartphone,
  Clock,
} from "lucide-react";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";

export default function SecurityTab(): React.JSX.Element {
  const {
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
    markDirtyForTab,
    clearDirtyForTab,
  } = useSettings();

  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] =
    React.useState<boolean>(false);
  const [showPasswordForm, setShowPasswordForm] =
    React.useState<boolean>(false);

  const canUpdatePassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isUpdatingPassword;

  const dirty =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  useEffect(() => {
    if (dirty) markDirtyForTab("security");
    else clearDirtyForTab("security");
  }, [dirty, markDirtyForTab, clearDirtyForTab]);

  const onCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setStatusMessage({ type: null, message: null });
    setShowPasswordForm(false);
  };

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword) return;
    setPasswordError(null);
    setStatusMessage({ type: null, message: null });

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await fetchApi("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      onCancel();
      setStatusMessage({
        type: "success",
        message: "Password updated successfully",
      });
    } catch (error: Error | unknown) {
      setPasswordError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setter(e.target.value);

  const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (
      passwordError === "New passwords do not match." &&
      e.target.value === newPassword
    )
      setPasswordError(null);
  };

  if (sessionStatus !== "authenticated" || !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Shield className="text-gray-400 dark:text-gray-500" size={20} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sign in required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          You need to be signed in to manage your security settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Security
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your password and keep your account secure.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <KeyRound
                    size={18}
                    className="text-gray-600 dark:text-gray-400"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Password
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {showPasswordForm
                      ? "Update your account password"
                      : "Set a unique password to protect your account"}
                  </p>
                  {!showPasswordForm && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={12} />
                      Last changed 3 months ago
                    </div>
                  )}
                </div>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses} text-sm`}
                >
                  Change password
                </button>
              )}
            </div>
          </div>

          {showPasswordForm && (
            <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="current-password-input"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Current password
                  </label>
                  <input
                    id="current-password-input"
                    name="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={handleInputChange(setCurrentPassword)}
                    className={styling.inputClasses}
                    autoComplete="current-password"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="new-password-input"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    New password
                  </label>
                  <input
                    id="new-password-input"
                    name="new-password"
                    type="password"
                    value={newPassword}
                    onChange={handleInputChange(setNewPassword)}
                    className={styling.inputClasses}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Enter new password"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Must be at least 8 characters long
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="confirm-password-input"
                    className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-password-input"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className={[
                      styling.inputClasses,
                      passwordError ||
                      (newPassword &&
                        confirmPassword &&
                        newPassword !== confirmPassword)
                        ? "border-red-400 dark:border-red-600 focus:ring-red-500"
                        : "",
                    ].join(" ")}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                  />
                  {passwordError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      {passwordError}
                    </p>
                  )}
                  {!passwordError &&
                    newPassword &&
                    confirmPassword &&
                    newPassword !== confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                        Passwords do not match
                      </p>
                    )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isUpdatingPassword}
                  className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={!canUpdatePassword}
                  className={`${styling.buttonBaseClasses} ${styling.buttonPrimaryClasses} inline-flex items-center gap-2`}
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      Update password
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Smartphone
                size={18}
                className="text-gray-600 dark:text-gray-400"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Two-factor authentication
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Add an extra layer of security to your account by requiring a
                verification code in addition to your password.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                Coming soon
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Passkeys
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Use biometrics or security keys for faster, more secure sign-ins
                without passwords.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                Coming soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
