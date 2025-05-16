"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { User, Pencil, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { fetchApi } from "../api";
import { useSettings } from "../useSettings";
import Link from "next/link";

const AccountTab = (): React.JSX.Element => {
  const { session, sessionStatus, updateSession, setStatusMessage, styling } =
    useSettings();
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [initialUsername, setInitialUsername] = useState<string>("");
  const [initialEmail, setInitialEmail] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  const safeInitialUsername = initialUsername ?? "";
  const safeInitialEmail = initialEmail ?? "";
  const safeUsername = username ?? "";
  const safeEmail = email ?? "";

  const hasProfileChanges =
    safeUsername !== safeInitialUsername || safeEmail !== safeInitialEmail;
  const canSaveChanges =
    (isEditingUsername || isEditingEmail) &&
    hasProfileChanges &&
    !isSavingProfile;

  useEffect(() => {
    if (
      sessionStatus === "authenticated" &&
      session?.user &&
      !initialUsername &&
      !initialEmail
    ) {
      const userEmail = session.user.email ?? "";
      const userUsername =
        session.user.username ??
        session.user.email?.split("@")[0] ??
        `user_${Date.now().toString().slice(-4)}`;

      setEmail(userEmail);
      setUsername(userUsername);
      setInitialEmail(userEmail);
      setInitialUsername(userUsername);
    }
  }, [session, sessionStatus, initialUsername, initialEmail]);

  const handleSaveProfile = async () => {
    if (!canSaveChanges) return;
    setIsSavingProfile(true);
    setStatusMessage({ type: null, message: null });

    try {
      const updatedUser = await fetchApi<{ username?: string; email?: string }>(
        "/api/user",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username !== initialUsername ? username : undefined,
            email: email !== initialEmail ? email : undefined,
          }),
        }
      );

      const newUsername = updatedUser?.username || username;
      const newEmail = updatedUser?.email || email;
      setUsername(newUsername);
      setEmail(newEmail);
      setInitialUsername(newUsername);
      setInitialEmail(newEmail);
      setIsEditingUsername(false);
      setIsEditingEmail(false);

      await updateSession({
        user: {
          ...session?.user,
          username: newUsername,
          email: newEmail,
        },
      });

      await fetch("/api/auth/session", { method: "GET" });

      setStatusMessage({
        type: "success",
        message: "Profile updated successfully",
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      setStatusMessage({ type: "error", message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const cancelEditProfile = () => {
    setUsername(initialUsername);
    setEmail(initialEmail);
    setIsEditingUsername(false);
    setIsEditingEmail(false);
    setStatusMessage({ type: null, message: null });
  };

  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
    };

  const renderContent = () => (
    <div className="space-y-6">
      <div className={styling.sectionHeaderClasses}>
        <h2 className={styling.sectionTitleClasses}>Account Settings</h2>
        <p className={styling.sectionDescriptionClasses}>
          Manage your personal information.
        </p>
      </div>
      <div className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="username-input"
              className={styling.labelClasses + " mb-0 flex items-center"}
            >
              <User
                size={16}
                className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
              Username
            </label>
            {!isEditingUsername && (
              <button
                onClick={() => setIsEditingUsername(true)}
                className="text-sm text-primary hover:text-primary/80 dark:text-primary/70 dark:hover:text-primary/50 flex items-center focus:outline-none focus:underline"
              >
                Change <Pencil size={12} className="ml-1" />
              </button>
            )}
          </div>
          {isEditingUsername ? (
            <input
              id="username-input"
              name="username"
              type="text"
              value={username}
              onChange={handleInputChange(setUsername)}
              className={styling.inputClasses}
              placeholder="Enter your username"
              disabled={isSavingProfile}
            />
          ) : (
            <span className="flex-grow p-2 text-gray-800 dark:text-gray-200 text-sm min-h-[38px] inline-flex items-center border border-transparent">
              {username || (
                <span className="text-gray-400 dark:text-gray-500 italic">
                  Not set
                </span>
              )}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label
              htmlFor="email-input"
              className={styling.labelClasses + " mb-0 flex items-center"}
            >
              <User
                size={16}
                className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
              Email
            </label>
            {!isEditingEmail && (
              <button
                onClick={() => setIsEditingEmail(true)}
                className="text-sm text-primary hover:text-primary/80 dark:text-primary/70 dark:hover:text-primary/50 flex items-center focus:outline-none focus:underline"
              >
                Change <Pencil size={12} className="ml-1" />
              </button>
            )}
          </div>
          {isEditingEmail ? (
            <input
              id="email-input"
              name="email"
              type="email"
              value={email}
              onChange={handleInputChange(setEmail)}
              className={styling.inputClasses}
              placeholder="Enter your email"
              disabled={isSavingProfile}
            />
          ) : (
            <span className="flex-grow p-2 text-gray-800 dark:text-gray-200 text-sm min-h-[38px] inline-flex items-center border border-transparent">
              {email}
            </span>
          )}
        </div>
        {(isEditingUsername || isEditingEmail) && (
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              onClick={cancelEditProfile}
              disabled={isSavingProfile}
              className={styling.buttonSecondaryClasses}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={!canSaveChanges}
              className={styling.buttonPrimaryClasses}
            >
              {isSavingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </button>
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

export default AccountTab;