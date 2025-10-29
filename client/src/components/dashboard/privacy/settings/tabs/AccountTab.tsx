"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  ChangeEvent,
  useRef,
} from "react";
import Image from "next/image";
import {
  User,
  Loader2,
  Mail,
  ImagePlus,
  Check,
  X,
  Pencil,
  KeyRound,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

export default function AccountTab(): React.JSX.Element {
  const {
    session,
    sessionStatus,
    updateSession,
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

  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] =
    React.useState<boolean>(false);
  const [showPasswordForm, setShowPasswordForm] =
    React.useState<boolean>(false);

  const [accountDetails, setAccountDetails] = useState<{
    joinedDate: Date | null;
    passwordLastUpdatedAt: Date | null;
  }>({ joinedDate: null, passwordLastUpdatedAt: null });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const fetchAccountDetails = async () => {
        try {
          const details = await fetchApi<{
            joinedDate: Date;
            passwordLastUpdatedAt: Date | null;
          }>("/api/user", { method: "GET" });
          setAccountDetails(details);
        } catch (error) {
          console.error("Failed to load account details:", error);
          toast.error("Failed to load account details.");
        }
      };
      fetchAccountDetails();
    }
  }, [sessionStatus, initial]);

  const usernameDirty = username !== initial.u && username.length > 0;
  const emailDirty = email !== initial.e && email.length > 0;
  const passwordDirty =
    currentPassword.length > 0 ||
    newPassword.length > 0 ||
    confirmPassword.length > 0;

  useEffect(() => {
    if (usernameDirty || emailDirty || passwordDirty) markDirtyForTab("account");
    else clearDirtyForTab("account");
  }, [
    usernameDirty,
    emailDirty,
    passwordDirty,
    markDirtyForTab,
    clearDirtyForTab,
  ]);

  const onSaveUsername = async () => {
    if (!usernameDirty || savingUsername) return;
    setSavingUsername(true);
    try {
      const updated = await fetchApi<{
        success: boolean;
        message: string;
        user: { username: string };
      }>("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      await updateSession({
        user: { ...session?.user, username: updated.user.username },
      });
      setUsername(updated.user.username);
      toast.success("Username updated");
      setEditingUsername(false);
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update username"
      );
      setUsername(initial.u);
    } finally {
      setSavingUsername(false);
    }
  };

  const onSaveEmail = async () => {
    if (!emailDirty || savingEmail) return;
    setSavingEmail(true);
    try {
      await fetchApi<{ message: string }>("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      toast.success("Email update initiated. Please check your inbox to verify.");
      setEditingEmail(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update email");
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

  const onCancelPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setShowPasswordForm(false);
  };

  const canUpdatePassword =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isUpdatingPassword;

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword) return;
    setPasswordError(null);

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
      onCancelPassword();
      setAccountDetails((prev) => ({
        ...prev,
        passwordLastUpdatedAt: new Date(),
      }));
      toast.success("Password updated successfully");
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

  const handleAvatarClick = () => {
    if (uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { newImageUrl } = await fetchApi<{ newImageUrl: string }>(
        "/api/user/avatar-upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const cacheBustedUrl = `${newImageUrl}?v=${new Date().getTime()}`;

      await updateSession({
        user: { ...session?.user, image: cacheBustedUrl },
      });
      toast.success("Avatar updated!");
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload avatar."
      );
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
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
          Account
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-800">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/png, image/jpeg"
            onChange={handleAvatarChange}
          />
          <div className="relative shrink-0">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={80}
                height={80}
                className="h-20 w-20 rounded-full object-cover border border-gray-200 dark:border-gray-800 cursor-pointer"
                onClick={handleAvatarClick}
              />
            ) : (
              <div
                className="h-20 w-20 rounded-full bg-linear-to-br from-primary/20 to-primary/5 dark:from-primary/30 dark:to-primary/10 flex items-center justify-center border border-gray-200 dark:border-gray-800 cursor-pointer"
                onClick={handleAvatarClick}
              >
                <User size={32} className="text-primary" />
              </div>
            )}

            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Change avatar"
            >
              {uploadingAvatar ? (
                <Loader2
                  size={14}
                  className="animate-spin text-gray-600 dark:text-gray-400"
                />
              ) : (
                <ImagePlus
                  size={14}
                  className="text-gray-600 dark:text-gray-400"
                />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-32 shrink-0">
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
            <div className="w-32 shrink-0 pt-2">
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

          <div className="h-px bg-gray-200 dark:bg-gray-800"></div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
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
                        {accountDetails.passwordLastUpdatedAt ? (
                          <span>
                            Last changed{" "}
                            {formatDistanceToNow(
                              new Date(accountDetails.passwordLastUpdatedAt),
                              { addSuffix: true }
                            )}
                          </span>
                        ) : session?.user?.email ? (
                          <span>Password has not been set</span>
                        ) : (
                          <span>Loading...</span>
                        )}
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
                    onClick={onCancelPassword}
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
        </div>
      </div>
    </div>
  );
}