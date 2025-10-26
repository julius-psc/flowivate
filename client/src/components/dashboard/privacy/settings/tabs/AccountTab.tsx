"use client";

import React, { useEffect, useMemo, useState } from "react";
import { User, Loader2, Mail, ImagePlus, Check, X, Pencil } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";

export default function AccountTab(): React.JSX.Element {
  const {
    session,
    sessionStatus,
    updateSession,
    setStatusMessage,
    styling,
    markDirtyForTab,
    clearDirtyForTab,
  } = useSettings();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);

  const initial = useMemo(() => {
    const u =
      session?.user?.username ?? session?.user?.email?.split("@")[0] ?? "";
    const e = session?.user?.email ?? "";
    return { u, e };
  }, [session]);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setUsername(initial.u);
      setEmail(initial.e);
    }
  }, [sessionStatus, initial]);

  const usernameDirty = username !== initial.u && username.length > 0;
  const emailDirty = email !== initial.e && email.length > 0;

  useEffect(() => {
    if (usernameDirty || emailDirty) markDirtyForTab("account");
    else clearDirtyForTab("account");
  }, [usernameDirty, emailDirty, markDirtyForTab, clearDirtyForTab]);

  const onSaveUsername = async () => {
    if (!usernameDirty || savingUsername) return;
    setSavingUsername(true);
    setStatusMessage({ type: null, message: null });
    try {
      const updated = await fetchApi<{ username: string }>("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      await updateSession({
        user: { ...session?.user, username: updated.username },
      });
      setStatusMessage({ type: "success", message: "Username updated" });
      setEditingUsername(false);
    } catch (e: unknown) {
      setStatusMessage({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to update username",
      });
      setUsername(initial.u);
    } finally {
      setSavingUsername(false);
    }
  };

  const onSaveEmail = async () => {
    if (!emailDirty || savingEmail) return;
    setSavingEmail(true);
    setStatusMessage({ type: null, message: null });
    try {
      const updated = await fetchApi<{ email: string }>("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await updateSession({ user: { ...session?.user, email: updated.email } });
      setStatusMessage({
        type: "success",
        message: "Email update initiated. Please check your inbox to verify.",
      });
      setEditingEmail(false);
    } catch (e: unknown) {
      setStatusMessage({
        type: "error",
        message: e instanceof Error ? e.message : "Failed to update email",
      });
      setEmail(initial.e);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleCancelUsername = () => {
    setUsername(initial.u);
    setEditingUsername(false);
  };

  const handleCancelEmail = () => {
    setEmail(initial.e);
    setEditingEmail(false);
  };

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2
          className="animate-spin text-gray-400 dark:text-gray-500"
          size={32}
        />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <User className="text-gray-400 dark:text-gray-500" size={20} />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Sign in required
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-sm">
          You need to be signed in to manage your account settings.
        </p>
        <Link
          href="/api/auth/signin"
          className={`${styling.buttonBaseClasses} ${styling.buttonPrimaryClasses}`}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Profile
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your personal information and how others see you on Flowivate.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div className="relative flex-shrink-0">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center border border-gray-200 dark:border-gray-800">
              <User size={32} className="text-primary" />
            </div>
            <button
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title="Change avatar"
            >
              <ImagePlus size={14} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-32 flex-shrink-0">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Username
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Your unique identifier
              </p>
            </div>
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  id="username"
                  type="text"
                  className={styling.inputClasses}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={savingUsername || !editingUsername}
                />
                {editingUsername && usernameDirty && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      onClick={handleCancelUsername}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      disabled={savingUsername}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={onSaveUsername}
                      className="text-primary hover:text-primary/80"
                      disabled={savingUsername}
                      title="Save"
                    >
                      {savingUsername ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check size={16} />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {!editingUsername && (
                <button
                  onClick={() => setEditingUsername(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                  title="Edit username"
                >
                  <Pencil size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

          <div className="flex items-start gap-6">
            <div className="w-32 flex-shrink-0 pt-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Email
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Used for login
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    id="email"
                    type="email"
                    className={styling.inputClasses}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={savingEmail || !editingEmail}
                  />
                  {editingEmail && emailDirty && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        onClick={handleCancelEmail}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        disabled={savingEmail}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                      <button
                        onClick={onSaveEmail}
                        className="text-primary hover:text-primary/80"
                        disabled={savingEmail}
                        title="Save"
                      >
                        {savingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check size={16} />
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {!editingEmail && (
                  <button
                    onClick={() => setEditingEmail(true)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Edit email"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
              {!email.endsWith(initial.e) && initial.e && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-md px-3 py-2">
                  <Mail size={14} />
                  <span>Current verified: {initial.e}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}