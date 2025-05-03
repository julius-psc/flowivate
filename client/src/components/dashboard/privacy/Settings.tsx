"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  ChangeEvent,
  MouseEvent,
} from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link"; // Import Link
import {
  X,
  User,
  Lock,
  Settings,
  AlertTriangle,
  CreditCard,
  Pencil,
  Loader2,
  CheckCircle2,
  SunMedium,
  Moon,
  Monitor,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  KeyRound,
  Trash2,
} from "lucide-react"; // ChevronRight removed

// Types
type Theme = "light" | "dark" | "system";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StatusMessage {
  type: "success" | "error" | "info" | null;
  message: string | null;
}

// Consistent Tab definitions
const tabs = [
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "security", label: "Security", icon: <Lock size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Settings size={16} /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard size={16} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={16} /> },
];

// Helper function for API calls
async function fetchApi<T>(url: string, options: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    // Check if response is JSON, handle cases where it might not be (e.g., 204 No Content)
    const contentType = response.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    if (!response.ok) {
      // Use error message from JSON if available, otherwise use status text
      const errorMessage =
        data?.error ||
        response.statusText ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
    return data; // Return data on success (might be undefined for 204)
  } catch (error) {
    // Rethrow network errors or other unexpected issues
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("An unexpected error occurred during fetch.");
    }
  }
}

const SettingsModal = ({
  isOpen,
  onClose,
}: SettingsModalProps): React.JSX.Element | null => {
  const { data: session, status, update: updateSession } = useSession();

  const [activeTab, setActiveTab] = useState<string>("account");
  const [theme, setTheme] = useState<Theme>("system");

  // Status messages
  const [statusMessage, setStatusMessage] = useState<StatusMessage>({
    type: null,
    message: null,
  });

  // --- Account State ---
  const [isEditingUsername, setIsEditingUsername] = useState<boolean>(false);
  const [isEditingEmail, setIsEditingEmail] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [initialUsername, setInitialUsername] = useState<string>("");
  const [initialEmail, setInitialEmail] = useState<string>("");
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // --- Security State ---
  const [isEditingPassword, setIsEditingPassword] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState<boolean>(false);

  // --- Account deletion state ---
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // --- Derived State ---
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
  const canUpdatePassword =
    isEditingPassword &&
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    !isUpdatingPassword;
  const canDeleteAccount =
    showDeleteConfirm &&
    (deleteConfirmText === safeUsername || deleteConfirmText === safeEmail) &&
    deleteConfirmText.length > 0 &&
    !isDeletingAccount;

  // --- Effects ---

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    setTheme(savedTheme ?? "system");
  }, []);

  // Apply theme class and handle system changes
  useEffect(() => {
    const applyThemeClass = (themeToApply: Theme) => {
      const root = document.documentElement;
      if (!root) return;
      if (themeToApply === "system") {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        root.classList.toggle("dark", prefersDark);
      } else {
        root.classList.toggle("dark", themeToApply === "dark");
      }
    };

    applyThemeClass(theme);
    localStorage.setItem("theme", theme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = () => {
      // Check theme state again inside handler in case it changed
      if (theme === "system") {
        applyThemeClass("system");
      }
    };

    if (typeof window !== "undefined" && mediaQuery?.addEventListener) {
      if (theme === "system") {
        mediaQuery.addEventListener("change", handleSystemChange);
      }
      return () => {
        mediaQuery.removeEventListener("change", handleSystemChange);
      };
    }
    return () => {};
  }, [theme]);

  // Populate account fields from session
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userEmail = session.user.email ?? "";
      const userUsername =
        session.user.username ??
        session.user.email?.split("@")[0] ??
        `user_${Date.now().toString().slice(-4)}`; // More robust fallback

      setEmail(userEmail);
      setUsername(userUsername);
      setInitialEmail(userEmail);
      setInitialUsername(userUsername);
      // Reset editing states if session data changes
      setIsEditingEmail(false);
      setIsEditingUsername(false);
    } else if (status === "unauthenticated") {
      // Clear fields if logged out
      setEmail("");
      setUsername("");
      setInitialEmail("");
      setInitialUsername("");
    }
  }, [session, status]);

  // --- API Handlers ---
  const handleSaveProfile = async () => {
    if (!canSaveChanges) return;
    setIsSavingProfile(true);
    setStatusMessage({ type: null, message: null });

    try {
      await fetchApi("/api/user", {
        // Replace with your actual API endpoint
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username !== initialUsername ? username : undefined,
          email: email !== initialEmail ? email : undefined,
        }),
      });

      setInitialUsername(username);
      setInitialEmail(email);
      setIsEditingUsername(false);
      setIsEditingEmail(false);
      setStatusMessage({
        type: "success",
        message: "Profile updated successfully",
      });
      await updateSession(); // Await session update
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      setStatusMessage({ type: "error", message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!canUpdatePassword) return;
    setPasswordError(null);
    setStatusMessage({ type: null, message: null });

    // Re-validate before sending
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
      await fetchApi("/api/user/password", {
        // Replace with your actual password endpoint
        method: "PATCH", // Or PUT
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
      setPasswordError(message); // Set specific password error
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
        // Replace with your actual delete endpoint
        method: "DELETE",
      });

      // Sign out the user AFTER successful deletion and BEFORE closing modal
      await signOut({ redirect: false }); // Don't redirect automatically
      onClose(); // Close the modal first
      window.location.href = "/"; // Then manually redirect
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete account";
      setStatusMessage({ type: "error", message });
      // Keep confirmation visible on error for retry? Maybe hide it.
      // setShowDeleteConfirm(false);
      // setDeleteConfirmText("");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // --- Cancel Handlers ---
  const cancelEditProfile = () => {
    setUsername(initialUsername);
    setEmail(initialEmail);
    setIsEditingUsername(false);
    setIsEditingEmail(false);
    setStatusMessage({ type: null, message: null });
  };

  const cancelEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setIsEditingPassword(false);
    setStatusMessage({ type: null, message: null });
  };

  const cancelDeleteAccount = () => {
    setShowDeleteConfirm(false);
    setDeleteConfirmText("");
    setStatusMessage({ type: null, message: null });
  };

  // --- Utils ---
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

  // --- Render Logic ---
  if (!isOpen) return null;

  // Protected content wrapper
  const renderProtectedContent = (contentRenderer: () => React.JSX.Element) => {
    if (status === "loading") {
      return (
        <div className="flex justify-center items-center h-40">
          <Loader2
            className="animate-spin text-gray-400 dark:text-gray-500"
            size={24}
          />
        </div>
      );
    }
    if (status === "unauthenticated") {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-center p-4">
          <AlertCircle
            className="mb-3 text-gray-400 dark:text-gray-500"
            size={24}
          />
          <p className="text-gray-600 dark:text-gray-400 mb-3 text-sm">
            Please log in to manage this section.
          </p>
          {/* Keep <a> for API routes like signin */}
          <Link
            href="/api/auth/signin"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center py-1 px-3 rounded-md border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-950"
          >
            Go to login <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
      );
    }
    // Ensure session exists before rendering protected content
    if (status === "authenticated" && session?.user) {
      return contentRenderer();
    }
    // Fallback if authenticated but no session (shouldn't happen often)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400">
        Session data not available.
      </p>
    );
  };

  // --- Status Message Component (Toast style) ---
  const StatusIndicator = (): React.JSX.Element | null => {
    if (!statusMessage.type || !statusMessage.message) return null;

    const bgColors = {
      success:
        "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800/50",
      error:
        "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800/50",
      info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/50",
    };
    const textColors = {
      success: "text-green-700 dark:text-green-300",
      error: "text-red-700 dark:text-red-300",
      info: "text-blue-700 dark:text-blue-300",
    };
    const icons = {
      success: (
        <CheckCircle2
          size={18}
          className="text-green-500 dark:text-green-400 flex-shrink-0"
        />
      ),
      error: (
        <AlertCircle
          size={18}
          className="text-red-500 dark:text-red-400 flex-shrink-0"
        />
      ),
      info: (
        <AlertCircle
          size={18}
          className="text-blue-500 dark:text-blue-400 flex-shrink-0"
        />
      ),
    };

    return (
      <div
        className={`fixed bottom-4 right-4 z-[11000] px-4 py-3 rounded-lg border ${
          bgColors[statusMessage.type]
        } flex items-start space-x-3 max-w-sm animate-fade-in shadow-md dark:shadow-lg`} // Added subtle shadow back for visibility
        role="alert"
        aria-live="assertive"
      >
        {icons[statusMessage.type]}
        <span
          className={`text-sm font-medium ${
            textColors[statusMessage.type]
          } flex-grow`}
        >
          {statusMessage.message}
        </span>
        <button
          onClick={clearStatusMessage}
          className="ml-auto p-1 -m-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 flex-shrink-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-current"
          aria-label="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  // --- Base Styling Classes --- (Removed shadow classes initially, added back for toast)
  const inputClasses =
    "w-full p-2 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed";
  const labelClasses =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const buttonBaseClasses =
    "text-sm font-medium rounded-md flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed";
  const buttonPrimaryClasses = `${buttonBaseClasses} px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 min-w-[80px]`;
  const buttonSecondaryClasses = `${buttonBaseClasses} px-4 py-1.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-gray-400`;
  const buttonDangerClasses = `${buttonBaseClasses} px-4 py-1.5 text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 min-w-[80px]`;
  const buttonDangerOutlineClasses = `${buttonBaseClasses} px-4 py-1.5 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 hover:bg-red-100/50 dark:hover:bg-red-900/20 focus:ring-red-500`;
  const linkButtonPrimaryClasses = `${buttonPrimaryClasses} text-xs !px-3 !py-1`; // For Link components styled as buttons
  const linkButtonSecondaryClasses = `${buttonSecondaryClasses} text-xs !px-3 !py-1 flex items-center`; // For Link components styled as buttons
  const sectionHeaderClasses =
    "border-b border-gray-200 dark:border-gray-700/80 pb-3 mb-5";
  const sectionTitleClasses =
    "text-lg font-semibold text-gray-900 dark:text-gray-100";
  const sectionDescriptionClasses =
    "text-sm text-gray-500 dark:text-gray-400 mt-1";

  // --- Event Handlers with Types ---
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
      setPasswordError(null); // Clear mismatch error immediately
    }
  };

  // --- Tab Content Renderers ---
  const renderAccountContent = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className={sectionHeaderClasses}>
        <h2 className={sectionTitleClasses}>Account Settings</h2>
        <p className={sectionDescriptionClasses}>
          Manage your personal information.
        </p>
      </div>
      <div className="space-y-5">
        {/* Username Section */}
        <div>
          <label htmlFor="username-input" className={labelClasses}>
            Username
          </label>
          <div className="flex items-center space-x-2 group">
            {isEditingUsername ? (
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={handleInputChange(setUsername)}
                className={inputClasses}
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
            {!isEditingUsername && (
              <button
                onClick={() => setIsEditingUsername(true)}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="Edit username"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Email Section */}
        <div>
          <label htmlFor="email-input" className={labelClasses}>
            Email
          </label>
          <div className="flex items-center space-x-2 group">
            {isEditingEmail ? (
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={handleInputChange(setEmail)}
                className={inputClasses}
                placeholder="Enter your email"
                disabled={isSavingProfile}
              />
            ) : (
              <span className="flex-grow p-2 text-gray-800 dark:text-gray-200 text-sm min-h-[38px] inline-flex items-center border border-transparent">
                {email}
              </span>
            )}
            {!isEditingEmail && (
              <button
                onClick={() => setIsEditingEmail(true)}
                className="p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="Edit email"
              >
                <Pencil size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Save/Cancel Buttons for Profile */}
        {(isEditingUsername || isEditingEmail) && (
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700/80 mt-4">
            <button
              onClick={cancelEditProfile}
              disabled={isSavingProfile}
              className={buttonSecondaryClasses}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={!canSaveChanges}
              className={buttonPrimaryClasses}
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

  const renderSecurityContent = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className={sectionHeaderClasses}>
        <h2 className={sectionTitleClasses}>Security</h2>
        <p className={sectionDescriptionClasses}>
          Manage your password and account security.
        </p>
      </div>
      <div className="space-y-5">
        {/* Password Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className={labelClasses + " mb-0 flex items-center"}>
              <KeyRound
                size={16}
                className="mr-2 text-gray-400 dark:text-gray-500 flex-shrink-0"
              />
              Password
            </label>
            {!isEditingPassword && (
              <button
                onClick={() => setIsEditingPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center focus:outline-none focus:underline"
              >
                {" "}
                Change <Pencil size={12} className="ml-1" />{" "}
              </button>
            )}
          </div>
          {!isEditingPassword && (
            <div className="flex items-center text-gray-800 dark:text-gray-200 text-sm pl-8">
              {" "}
              {/* Indent to align with label icon */}
              <span className="tracking-wider">••••••••</span>
            </div>
          )}
        </div>

        {/* Password Change Form (Conditional) */}
        {isEditingPassword && (
          <div className="space-y-4 bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700/50">
            <div>
              <label htmlFor="current-password-input" className={labelClasses}>
                Current Password
              </label>
              <input
                id="current-password-input"
                type="password"
                value={currentPassword}
                onChange={handleInputChange(setCurrentPassword)}
                className={inputClasses}
                placeholder="Enter your current password"
                autoComplete="current-password"
                required
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <label htmlFor="new-password-input" className={labelClasses}>
                New Password
              </label>
              <input
                id="new-password-input"
                type="password"
                value={newPassword}
                onChange={handleInputChange(setNewPassword)}
                className={inputClasses}
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isUpdatingPassword}
              />
            </div>
            <div>
              <label htmlFor="confirm-password-input" className={labelClasses}>
                Confirm New Password
              </label>
              <input
                id="confirm-password-input"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`${inputClasses} ${
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
              {/* Password Error Display */}
              {passwordError && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center">
                  {" "}
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
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={cancelEditPassword}
                disabled={isUpdatingPassword}
                className={buttonSecondaryClasses}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={!canUpdatePassword}
                className={buttonPrimaryClasses}
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

  const renderAppearanceContent = (): React.JSX.Element => {
    const themeOptions: {
      value: Theme;
      label: string;
      icon: React.ReactElement;
    }[] = [
      { value: "light", label: "Light", icon: <SunMedium size={20} /> },
      { value: "dark", label: "Dark", icon: <Moon size={20} /> },
      { value: "system", label: "System", icon: <Monitor size={20} /> },
    ];

    return (
      <div className="space-y-6">
        <div className={sectionHeaderClasses}>
          <h2 className={sectionTitleClasses}>Appearance</h2>
          <p className={sectionDescriptionClasses}>
            Customize your visual experience.
          </p>
        </div>
        <div className="space-y-5">
          <div>
            <h3 className={labelClasses + " mb-2"}>Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${
                    theme === option.value
                      ? "bg-blue-50 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 focus:ring-blue-500"
                      : "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-gray-400"
                  }`}
                  aria-pressed={theme === option.value}
                >
                  {React.cloneElement(option.icon, {})}
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              {theme === "system"
                ? "Automatically switches based on your device settings."
                : theme === "dark"
                ? "Dark mode is applied."
                : "Light mode is applied."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderSubscriptionContent = (): React.JSX.Element => (
    <div className="space-y-6">
      <div className={sectionHeaderClasses}>
        <h2 className={sectionTitleClasses}>Subscription</h2>
        <p className={sectionDescriptionClasses}>
          Manage your plan and billing details.
        </p>
      </div>
      <div className="space-y-5">
        {/* Current Plan Display */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                Current Plan
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                You are currently on the free plan.
              </p>{" "}
              {/* TODO: Make dynamic */}
            </div>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full bg-blue-100/50 dark:bg-blue-900/30">
              Free {/* TODO: Make dynamic */}
            </span>
          </div>
        </div>

        {/* Upgrade Options */}
        <div className="border border-gray-200 dark:border-gray-700/50 rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50/50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Upgrade Options
            </h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Pro Plan
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Unlock premium features & priority support.
                </p>
              </div>
              <Link href="/pricing" className={linkButtonPrimaryClasses}>
                Upgrade
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Enterprise Plan
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Custom solutions for team collaboration.
                </p>
              </div>
              <Link
                href="/contact-sales"
                className={linkButtonSecondaryClasses}
              >
                Contact Sales <ExternalLink size={12} className="ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDangerZoneContent = (): React.JSX.Element => (
    <div className="space-y-6">
      <div
        className={
          sectionHeaderClasses + " !border-red-300 dark:!border-red-700/50"
        }
      >
        <h2
          className={
            sectionTitleClasses +
            " !text-red-600 dark:!text-red-400 flex items-center"
          }
        >
          <AlertTriangle size={18} className="mr-2" /> Danger Zone
        </h2>
        <p
          className={
            sectionDescriptionClasses + " !text-red-500 dark:!text-red-300/90"
          }
        >
          Critical settings and irreversible actions.
        </p>
      </div>
      <div className="space-y-4 p-4 border border-red-300 dark:border-red-700/50 bg-red-50/30 dark:bg-red-900/10 rounded-lg">
        <h3 className="text-md font-semibold text-red-700 dark:text-red-300">
          Delete Account
        </h3>
        <p className="text-sm text-red-600 dark:text-red-400">
          Permanently delete your account (
          <strong className="font-mono">{username || email}</strong>) and all
          associated data. This action is irreversible.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className={buttonDangerOutlineClasses} // Use outline style
            disabled={isDeletingAccount}
          >
            <Trash2 size={14} className="mr-1.5" /> Delete My Account...
          </button>
        ) : (
          <div className="space-y-3 pt-3 border-t border-red-200 dark:border-red-800/50">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              To confirm, please type your username (
              <strong className="select-all font-mono">{username}</strong>) or
              email (<strong className="select-all font-mono">{email}</strong>)
              below:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={handleInputChange(setDeleteConfirmText)}
              className={`${inputClasses} !border-red-300 dark:!border-red-600 focus:!ring-red-500 font-mono`}
              placeholder="Type username or email to confirm"
              disabled={isDeletingAccount}
              aria-label="Confirm account deletion input"
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={cancelDeleteAccount}
                className={buttonSecondaryClasses}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={buttonDangerClasses}
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

  // --- Main Content Router ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return renderProtectedContent(renderAccountContent);
      case "security":
        return renderProtectedContent(renderSecurityContent);
      case "appearance":
        return renderAppearanceContent();
      case "subscription":
        return renderProtectedContent(renderSubscriptionContent);
      case "danger":
        return renderProtectedContent(renderDangerZoneContent);
      default:
        return <p>Invalid tab selected.</p>; // Fallback
    }
  };

  // --- Component Return ---
  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/20 dark:bg-black/40 backdrop-blur-sm p-4 transition-opacity duration-300 ease-out" // Added transition
        aria-labelledby="settings-modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose} // Close on backdrop click
      >
        {/* Modal container: Stop propagation */}
        <div
          onClick={(e: MouseEvent) => e.stopPropagation()}
          className="bg-white dark:bg-gray-950 w-full max-w-4xl h-[calc(100vh-4rem)] max-h-[750px] rounded-lg border border-gray-200/80 dark:border-gray-800/70 overflow-hidden flex flex-col sm:flex-row transition-transform duration-300 ease-out scale-95 animate-scale-in" // Added transition/animation
        >
          {/* Sidebar Tabs */}
          <div
            className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200/80 dark:border-gray-800/70 bg-gray-50/40 dark:bg-gray-900/40 p-3 sm:p-4 overflow-y-auto relative"
            role="tablist"
            aria-orientation="vertical"
          >
            <h1
              id="settings-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 px-2 hidden sm:block"
            >
              Settings
            </h1>
            {/* Close Button (Mobile - absolute positioned) */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:hidden p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 z-10 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-500"
              aria-label="Close settings"
            >
              {" "}
              <X size={18} />{" "}
            </button>

            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (activeTab === "security" && isEditingPassword)
                      cancelEditPassword();
                    if (activeTab === "danger" && showDeleteConfirm)
                      cancelDeleteAccount();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                    activeTab === tab.id
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-100"
                  } ${
                    tab.id === "danger" && activeTab !== "danger"
                      ? "!text-red-600/80 dark:!text-red-500/70 hover:!bg-red-50 dark:hover:!bg-red-900/20 hover:!text-red-700 dark:hover:!text-red-400"
                      : ""
                  }
                     ${
                       tab.id === "danger" && activeTab === "danger"
                         ? "!bg-red-100 dark:!bg-red-900/40 !text-red-700 dark:!text-red-300"
                         : ""
                     }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`settings-panel-${activeTab}`} // Use activeTab here for dynamic association
                >
                  {/* Type assertion for icon props if needed, but should be compatible */}
                  {React.cloneElement(tab.icon, { "aria-hidden": "true" })}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content Area */}
          <div
            className="flex-1 p-5 sm:p-8 overflow-y-auto relative"
            id={`settings-panel-${activeTab}`} // Panel ID matches active tab
            role="tabpanel"
            tabIndex={0} // Make panel focusable
            aria-labelledby={`settings-tab-${activeTab}`} // Labels panel with active tab
          >
            {/* Close Button (Desktop - absolute positioned) */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 hidden sm:inline-flex p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-950"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Render the Status Indicator outside the modal DOM structure for proper layering */}
      <StatusIndicator />

      {/* Add Tailwind animation utility if not already present in global CSS */}
      <style jsx global>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s ease-out forwards;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default SettingsModal;
