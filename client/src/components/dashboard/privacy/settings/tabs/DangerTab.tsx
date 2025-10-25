"use client";

import React, { ChangeEvent } from "react";
import { AlertTriangle, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";

export default function DangerTab(): React.JSX.Element {
  const {
    session,
    sessionStatus,
    showDeleteConfirm,
    setShowDeleteConfirm,
    deleteConfirmText,
    setDeleteConfirmText,
    setStatusMessage,
    styling,
    signOut,
    cancelDeleteAccount,
  } = useSettings();

  const [isDeletingAccount, setIsDeletingAccount] =
    React.useState<boolean>(false);
  const username = session?.user?.username ?? "";
  const email = session?.user?.email ?? "";

  const canDeleteAccount =
    showDeleteConfirm &&
    (deleteConfirmText.trim().toLowerCase() === "delete my account" ||
      deleteConfirmText === username ||
      deleteConfirmText === email) &&
    deleteConfirmText.length > 0 &&
    !isDeletingAccount;

  const handleDeleteAccount = async () => {
    if (!canDeleteAccount) {
      setStatusMessage({
        type: "error",
        message:
          "Please type the confirmation phrase or your identifier correctly.",
      });
      return;
    }
    setIsDeletingAccount(true);
    setStatusMessage({ type: null, message: null });
    try {
      await fetchApi("/api/user", { method: "DELETE" });
      await signOut({ redirect: false });
      window.location.href = "/";
    } catch (error: unknown) {
      setStatusMessage({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete account",
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
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <ShieldAlert className="text-gray-400 dark:text-gray-500" size={20} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sign in required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          You need to be signed in to access danger zone settings.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
            Danger Zone
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Irreversible and destructive actions. Please proceed with caution.
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-lg border-2 border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50/50 to-white dark:from-red-900/5 dark:to-gray-900/50 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Delete account
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 mb-4">
                  <div className="flex gap-2">
                    <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-red-700 dark:text-red-400">
                      <p className="font-medium mb-1">This will immediately:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-1">
                        <li>Delete all your projects and data</li>
                        <li>Cancel any active subscriptions</li>
                        <li>Remove your account from all teams</li>
                        <li>Permanently erase your profile</li>
                      </ul>
                    </div>
                  </div>
                </div>
                {!showDeleteConfirm && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={`${styling.buttonBaseClasses} text-gray-900 inline-flex items-center gap-2`}
                    disabled={isDeletingAccount}
                  >
                    <Trash2 size={16} />
                    Delete my account
                  </button>
                )}
              </div>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="border-t-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Confirm deletion
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    To confirm, type{" "}
                    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs">
                      delete my account
                    </code>{" "}
                    or your username{" "}
                    <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-xs">
                      {username}
                    </code>{" "}
                    below:
                  </p>
                  <input
                    id="delete-confirm-input"
                    name="delete-confirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={handleInputChange(setDeleteConfirmText)}
                    className={`${styling.inputClasses} border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500`}
                    placeholder={username || "delete my account"}
                    disabled={isDeletingAccount}
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-red-200 dark:border-red-900/50">
                  <button
                    onClick={cancelDeleteAccount}
                    className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses}`}
                    disabled={isDeletingAccount}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className={`${styling.buttonBaseClasses} bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
                    disabled={!canDeleteAccount}
                  >
                    {isDeletingAccount ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete account permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} className="text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Need help?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                If you&#39;re experiencing issues or have concerns about your account, our support team is here to help before you take irreversible action.
              </p>
              <a
                href="mailto:support@flowivate.com"
                className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses} text-sm inline-block`}
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}