"use client";

import React, { ChangeEvent, useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";

export default function DangerTab(): React.JSX.Element {
  const { session, sessionStatus, setStatusMessage, styling, signOut } = useSettings();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  const username = session?.user?.username ?? "";
  const email = session?.user?.email ?? "";

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setCurrentPassword("");
    setStatusMessage({ type: null, message: null });
  };

  const canDeleteAccount =
    showDeleteConfirm &&
    currentPassword.length > 0 &&
    (deleteConfirmText.trim().toLowerCase() === "delete my account" ||
      deleteConfirmText === username ||
      deleteConfirmText === email) &&
    deleteConfirmText.length > 0 &&
    !isDeletingAccount;

  const handleDeleteAccount = async () => {
    if (!canDeleteAccount) {
      setStatusMessage({
        type: "error",
        message: "Please enter your password and confirmation text correctly.",
      });
      return;
    }
    setIsDeletingAccount(true);
    setStatusMessage({ type: null, message: null });
    try {
      await fetchApi("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });
      await signOut({ redirect: false });
      window.location.href = "/";
    } catch (error: unknown) {
      setStatusMessage({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete account",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
      (e: ChangeEvent<HTMLInputElement>) =>
        setter(e.target.value);

  if (sessionStatus !== "authenticated" || !session?.user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <Trash2 className="text-zinc-500" size={20} />
        </div>
        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Sign in required
        </h3>
        <p className="text-[13px] text-zinc-500 max-w-sm">
          You need to be signed in to access these settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 tracking-tight">
          Danger Zone
        </h2>
        <p className="text-[13px] text-zinc-500 mt-1">
          Irreversible actions. Proceed with caution.
        </p>
      </div>

      <div className="space-y-6">
        {/* Delete Account */}
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <div>
            <label className="text-[13px] font-medium text-red-600 dark:text-red-400">
              Delete account
            </label>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Permanent action
            </p>
          </div>
          <div>
            {!showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-[13px] text-zinc-600 dark:text-zinc-400">
                  This will permanently delete your account and all associated data.
                </p>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className={`${styling.buttonBaseClasses} ${styling.buttonDangerOutlineClasses}`}
                  disabled={isDeletingAccount}
                >
                  Delete my account
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                <p className="text-[12px] text-red-700 dark:text-red-400">
                  This will delete all projects, cancel subscriptions, and erase your profile.
                </p>

                <div>
                  <label
                    htmlFor="current-password-input"
                    className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Your password
                  </label>
                  <input
                    id="current-password-input"
                    name="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={handleInputChange(setCurrentPassword)}
                    className={styling.inputClasses}
                    placeholder="Enter your password"
                    disabled={isDeletingAccount}
                    autoFocus
                  />
                </div>

                <div>
                  <label
                    htmlFor="delete-confirm-input"
                    className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                  >
                    Type{" "}
                    <code className="px-1 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono text-[11px]">
                      delete my account
                    </code>{" "}
                    to confirm
                  </label>
                  <input
                    id="delete-confirm-input"
                    name="delete-confirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={handleInputChange(setDeleteConfirmText)}
                    className={styling.inputClasses}
                    placeholder="delete my account"
                    disabled={isDeletingAccount}
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleDeleteAccount}
                    className={`${styling.buttonBaseClasses} ${styling.buttonDangerClasses} inline-flex items-center gap-2`}
                    disabled={!canDeleteAccount}
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete permanently"
                    )}
                  </button>
                  <button
                    onClick={cancelDeleteAccount}
                    className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses}`}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Help */}
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <div>
            <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              Need help?
            </label>
          </div>
          <div>
            <a
              href="mailto:support@flowivate.com"
              className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses}`}
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}