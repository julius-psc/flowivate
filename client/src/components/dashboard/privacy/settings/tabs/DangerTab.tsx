"use client";

import React, { ChangeEvent } from "react";
import { AlertTriangle, Trash2, Loader2, AlertCircle, ArrowRight} from "lucide-react";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";
import Link from "next/link";

const DangerTab = (): React.JSX.Element => {
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
  } = useSettings();
  const [isDeletingAccount, setIsDeletingAccount] = React.useState<boolean>(false);

  const username = session?.user?.username ?? "";
  const email = session?.user?.email ?? "";
  const canDeleteAccount =
    showDeleteConfirm &&
    (deleteConfirmText === username || deleteConfirmText === email) &&
    deleteConfirmText.length > 0 &&
    !isDeletingAccount;

  const handleDeleteAccount = async () => {
    if (!canDeleteAccount) {
      setStatusMessage({
        type: "error",
        message: "Please type your username or email correctly to confirm.",
      });
      return;
    }

    setIsDeletingAccount(true);
    setStatusMessage({ type: null, message: null });

    try {
      await fetchApi("/api/user", {
        method: "DELETE",
      });

      await signOut({ redirect: false });
      window.location.href = "/";
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete account";
      setStatusMessage({ type: "error", message });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  const renderContent = () => (
    <div className="space-y-6">
      <div
        className={
          styling.sectionHeaderClasses + " !border-red-300 dark:!border-red-700"
        }
      >
        <h2
          className={
            styling.sectionTitleClasses +
            " !text-red-600 dark:!text-red-400 flex items-center"
          }
        >
          <AlertTriangle size={18} className="mr-2" /> Danger Zone
        </h2>
        <p
          className={
            styling.sectionDescriptionClasses + " !text-red-500 dark:!text-red-400"
          }
        >
          Critical actions that cannot be undone.
        </p>
      </div>
      <div className="space-y-4 p-3 border border-red-300 dark:border-red-700 bg-red-50/30 dark:bg-red-900/20 rounded-md">
        <h3 className="text-md font-semibold text-red-700 dark:text-red-300">
          Delete Account
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          Permanently delete your account (
          <strong className="">{username || email}</strong>) and all associated
          data. This cannot be undone.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={styling.buttonDangerOutlineClasses}
            disabled={isDeletingAccount}
          >
            <Trash2 size={14} className="mr-1.5" /> Delete My Account...
          </button>
        ) : (
          <div className="space-y-3 pt-3 border-t border-red-200 dark:border-red-800">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Confirm by typing your username (
              <strong className="select-all">{username}</strong>) or email (
              <strong className="select-all">{email}</strong>):
            </p>
            <input
              id="delete-confirm-input"
              name="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={handleInputChange(setDeleteConfirmText)}
              className={`${styling.inputClasses} border-red-300 dark:border-red-600 focus:ring-red-500`}
              placeholder="Type username or email"
              disabled={isDeletingAccount}
              aria-label="Confirm account deletion input"
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText("");
                  setStatusMessage({ type: null, message: null });
                }}
                className={styling.buttonSecondaryClasses}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={styling.buttonDangerClasses}
                disabled={!canDeleteAccount}
              >
                {isDeletingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirm Deletion"
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

export default DangerTab;