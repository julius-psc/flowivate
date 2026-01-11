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
  Camera,
  Check,
  X,
  Pencil,
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
    authProvider: "google" | "github" | "credentials" | null;
  }>({ joinedDate: null, passwordLastUpdatedAt: null, authProvider: null });
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
            authProvider: "google" | "github" | "credentials" | null;
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
          className="animate-spin text-zinc-400 dark:text-zinc-600"
          size={24}
        />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <User className="text-zinc-500" size={20} />
        </div>
        <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Sign in required
        </h3>
        <p className="text-[13px] text-zinc-500 mb-6 max-w-sm">
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
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
          Account
        </h2>
        <p className="text-[13px] text-zinc-500 mt-1">
          Manage your personal information and account security.
        </p>
      </div>

      <div className="space-y-8">
        {/* Avatar Section */}
        <div className="flex items-center gap-5">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept="image/png, image/jpeg"
            onChange={handleAvatarChange}
          />
          <div className="relative group">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt="Avatar"
                width={72}
                height={72}
                className="h-[72px] w-[72px] rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-800"
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center ring-1 ring-zinc-200 dark:ring-zinc-800">
                <User size={28} className="text-zinc-400 dark:text-zinc-600" />
              </div>
            )}

            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all duration-200 cursor-pointer"
              title="Change avatar"
            >
              {uploadingAvatar ? (
                <Loader2 size={20} className="animate-spin text-white opacity-0 group-hover:opacity-100" />
              ) : (
                <Camera size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>
          <div>
            <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
              Profile photo
            </p>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Click to upload a new photo. Max 5MB.
            </p>
          </div>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Username Field */}
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <div>
            <label
              htmlFor="username"
              className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100"
            >
              Username
            </label>
            <p className="text-[12px] text-zinc-500 mt-0.5">Your unique identifier</p>
          </div>
          <div className="flex items-center gap-2">
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
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    onClick={handleCancelUsername}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    disabled={savingUsername}
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={onSaveUsername}
                    className="p-1 rounded text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                    disabled={savingUsername}
                    title="Save"
                  >
                    {savingUsername ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check size={14} />
                    )}
                  </button>
                </div>
              )}
            </div>
            {!editingUsername && (
              <button
                onClick={() => setEditingUsername(true)}
                className="p-2 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Edit username"
              >
                <Pencil size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Email Field */}
        <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
          <div>
            <label
              htmlFor="email"
              className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100"
            >
              Email
            </label>
            <p className="text-[12px] text-zinc-500 mt-0.5">Used for login</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
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
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      onClick={handleCancelEmail}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      disabled={savingEmail}
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={onSaveEmail}
                      className="p-1 rounded text-primary hover:text-primary/80 hover:bg-primary/10 transition-colors"
                      disabled={savingEmail}
                      title="Save"
                    >
                      {savingEmail ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                    </button>
                  </div>
                )}
              </div>
              {!editingEmail && (
                <button
                  onClick={() => setEditingEmail(true)}
                  className="p-2 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Edit email"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>

            {!email.endsWith(initial.e) && initial.e && (
              <div className="flex items-center gap-2 text-[12px] text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-md px-3 py-2 border border-zinc-200 dark:border-zinc-800">
                <Mail size={12} />
                <span>Current verified: {initial.e}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

        {/* Authentication Section - Show provider for OAuth users, password form for credentials users */}
        {accountDetails.authProvider && ["google", "github"].includes(accountDetails.authProvider) ? (
          /* OAuth Provider Section */
          <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
            <div>
              <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                Sign-in method
              </label>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                Linked account
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3.5 h-9 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                {accountDetails.authProvider === "google" ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-zinc-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                  {accountDetails.authProvider}
                </span>
              </div>
              <span className="text-[12px] text-zinc-500">
                Signed in with {accountDetails.authProvider === "google" ? "Google" : "GitHub"}
              </span>
            </div>
          </div>
        ) : (
          /* Password Section for credentials users */
          <div className="grid grid-cols-[140px_1fr] gap-4 items-center">
            <div>
              <label className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                {accountDetails.passwordLastUpdatedAt
                  ? `Changed ${formatDistanceToNow(new Date(accountDetails.passwordLastUpdatedAt), { addSuffix: true })}`
                  : "Not set"}
              </p>
            </div>
            <div>
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses}`}
                >
                  Change password
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="current-password-input"
                      className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5"
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
                      className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5"
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
                      placeholder="Minimum 8 characters"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirm-password-input"
                      className="block text-[12px] font-medium text-zinc-600 dark:text-zinc-400 mb-1.5"
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
                          ? "!border-red-400 dark:!border-red-600"
                          : "",
                      ].join(" ")}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                    />
                    {(passwordError ||
                      (newPassword &&
                        confirmPassword &&
                        newPassword !== confirmPassword)) && (
                        <p className="text-[12px] text-red-600 dark:text-red-400 mt-1.5">
                          {passwordError || "Passwords do not match"}
                        </p>
                      )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleUpdatePassword}
                      disabled={!canUpdatePassword}
                      className={`${styling.buttonBaseClasses} ${styling.buttonPrimaryClasses} inline-flex items-center gap-2`}
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update password"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onCancelPassword}
                      disabled={isUpdatingPassword}
                      className={`${styling.buttonBaseClasses} ${styling.buttonSecondaryClasses}`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}