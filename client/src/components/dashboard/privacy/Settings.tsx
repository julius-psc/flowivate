"use client";

import React from 'react'; 
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Needed for session data
import ThemeToggle from '../recyclable/ThemeToggle'
import {
  X,
  User,
  Lock,
  Settings,
  AlertTriangle,
  CreditCard,
  Sun,
  Moon,
  Monitor,
  Pencil,
  Loader2,
} from "lucide-react"; // Icons from lucide-react

// Define theme type explicitly
type Theme = "light" | "dark" | "system";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Tab definitions
const tabs = [
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "security", label: "Security", icon: <Lock size={16} /> },
  { id: "preferences", label: "Preferences", icon: <Settings size={16} /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard size={16} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={16} /> },
];

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  // Removed 'update: updateSession' from destructuring as it's unused in placeholder
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState("account");
  const [theme, setTheme] = useState<Theme>("system");

  // --- Account State ---
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [initialUsername, setInitialUsername] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Security State ---
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // --- Derived State ---
  const hasProfileChanges = username !== initialUsername || email !== initialEmail;
  const canSaveChanges = (isEditingUsername || isEditingEmail) && hasProfileChanges && !isSavingProfile;
  const canUpdatePassword =
    isEditingPassword &&
    currentPassword &&
    newPassword &&
    confirmPassword &&
    newPassword.length >= 8 && // Basic validation example
    newPassword === confirmPassword &&
    !isUpdatingPassword;

    

  // --- Effects ---

  // Effect to load theme from localStorage on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    // Set theme state only on mount, let the other effect handle applying it
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme("system"); // Default if nothing saved
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to apply theme class and manage system preference listener
  useEffect(() => {
    // Function to apply the theme class based on the 'theme' state
    const applyThemeClass = (themeToApply: Theme) => {
        if (themeToApply === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            document.documentElement.classList.toggle("dark", prefersDark);
            console.log(`Applied system theme: ${prefersDark ? 'dark' : 'light'}`);
        } else {
            document.documentElement.classList.toggle("dark", themeToApply === "dark");
            console.log(`Applied theme: ${themeToApply}`);
        }
    }

    applyThemeClass(theme); // Apply the theme when the effect runs (mount or theme change)
    localStorage.setItem("theme", theme); // Save preference

    // Listener for OS theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
        // Only re-apply if the component's theme state IS 'system'
        if (theme === 'system') {
            console.log("System theme changed, reapplying...");
            applyThemeClass('system');
        }
    };

    // Add listener only if theme is 'system'
    if (theme === 'system') {
        mediaQuery.addEventListener('change', handleSystemChange);
        console.log("Added system theme change listener.");
    }

    // Cleanup function: removes listener if it was added
    return () => {
        mediaQuery.removeEventListener('change', handleSystemChange);
        console.log("Removed system theme change listener.");
    };

  }, [theme]); // Runs when 'theme' state changes

  // Effect to populate account fields from session data
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const userEmail = session.user.email ?? "";
      const userUsername = session.user.username ?? "";
      setEmail(userEmail);
      setUsername(userUsername);
      setInitialEmail(userEmail);
      setInitialUsername(userUsername);
      // Reset edit states if session changes (e.g., re-login)
      setIsEditingEmail(false);
      setIsEditingUsername(false);
    } else if (status === 'unauthenticated') {
        // Clear fields if user logs out while modal is open
        setEmail(""); setUsername(""); setInitialEmail(""); setInitialUsername("");
    }
  }, [session, status]); // Runs when session object or status changes

  // --- Theme Handling ---
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // --- Action Handlers (Placeholders) ---
  const handleSaveProfile = async () => {
      if (!canSaveChanges) return;
      setIsSavingProfile(true);
      console.log("Simulating profile save:", { username, email });
      // --- TODO: API Call to update profile ---
      // Replace with your actual fetch/axios call
      // Example:
      // try {
      //   const response = await fetch('/api/user/profile', { method: 'PUT', ... });
      //   if (!response.ok) throw new Error('Failed to update profile');
      //   const updatedUser = await response.json();
      //   setInitialUsername(updatedUser.username); // Update base values on success
      //   setInitialEmail(updatedUser.email);
      //   // If using updateSession: const updatedSession = await updateSession({ user: { ...session?.user, username: updatedUser.username, email: updatedUser.email } });
      //   setIsEditingUsername(false); // Close edit fields
      //   setIsEditingEmail(false);
      //   // Show success notification
      // } catch (error) { console.error(error); /* Show error UI */ }
      // finally { setIsSavingProfile(false); }

      // Placeholder:
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInitialUsername(username); // Assume success for demo
      setInitialEmail(email);
      setIsEditingUsername(false);
      setIsEditingEmail(false);
      setIsSavingProfile(false);
      console.log("Profile save simulation complete.");
      // Consider adding a success toast/message here
  };

  const handleUpdatePassword = async () => {
      if (!canUpdatePassword) return;
      setPasswordError(null); // Clear previous errors
      if (newPassword !== confirmPassword) { // Belt and braces check
          setPasswordError("New passwords do not match.");
          return;
      }
      setIsUpdatingPassword(true);
      console.log("Simulating password update...");
      // --- TODO: API Call to update password ---
      // Replace with your actual fetch/axios call
      // Example:
      // try {
      //   const response = await fetch('/api/user/password', { method: 'PUT', ... body: JSON.stringify({ currentPassword, newPassword }) });
      //   if (!response.ok) { const err = await response.json(); throw new Error(err.message || 'Update failed'); }
      //   setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); // Clear fields
      //   setIsEditingPassword(false); // Close edit fields
      //   // Show success notification
      // } catch (error: any) { setPasswordError(error.message); /* Show error UI */ }
      // finally { setIsUpdatingPassword(false); }

      // Placeholder:
      await new Promise(resolve => setTimeout(resolve, 1000));
       if (currentPassword === "wrong") { // Simulate incorrect current password error
           console.log("Password update simulation failed (wrong current pw).")
           setPasswordError("The current password you entered is incorrect.");
           setIsUpdatingPassword(false);
           return;
       }
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setIsEditingPassword(false);
      setIsUpdatingPassword(false);
      console.log("Password update simulation complete.");
      // Consider adding a success toast/message here
  };

  // --- Cancel Handlers ---
  const cancelEditProfile = () => {
    setUsername(initialUsername);
    setEmail(initialEmail);
    setIsEditingUsername(false);
    setIsEditingEmail(false);
  };

  const cancelEditPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setIsEditingPassword(false);
  };


  // --- Render Logic ---

  if (!isOpen) return null; // Don't render anything if not open

  // Helper to wrap content needing authentication
  const renderProtectedContent = (contentRenderer: () => React.JSX.Element) => {
     if (status === "loading") {
          return <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-gray-500 dark:text-gray-400" size={32}/></div>;
      }
      if (status === "unauthenticated") {
          return <p className="text-center text-gray-500 dark:text-gray-400 mt-10 px-4">Please log in to manage this section.</p>;
      }
      // Only render if authenticated (status === "authenticated")
      return contentRenderer();
  }

  // --- Tab Content Renderers ---

  const renderAccountContent = (): React.JSX.Element => {
    return (
      <div className="space-y-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100" id="account-settings-heading">
          Account Settings
        </h2>
        <div className="space-y-5" role="group" aria-labelledby="account-settings-heading">
          {/* Username Section */}
          <div>
            <label htmlFor="username-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username
            </label>
            <div className="flex items-center group">
              {isEditingUsername ? (
                <input
                  id="username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="flex-grow p-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Enter your username"
                />
              ) : (
                <span className="flex-grow p-2.5 text-gray-800 dark:text-gray-200 truncate min-h-[44px] inline-flex items-center">
                  {username || <span className="text-gray-400 dark:text-gray-500 italic">Not set</span>}
                </span>
              )}
              {/* Edit/Cancel Button Logic */}
              {isEditingUsername ? (
                 <button
                    onClick={() => setIsEditingUsername(false)} // Simple hide, full cancel below
                    className="ml-3 p-1.5 rounded-md text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0"
                    aria-label="Stop editing username"
                >
                    <X size={18} />
                </button>
              ) : (
                 <button
                    onClick={() => setIsEditingUsername(true)}
                    className="ml-3 p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all flex-shrink-0"
                    aria-label="Edit username"
                >
                    <Pencil size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Email Section */}
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="flex items-center group">
              {isEditingEmail ? (
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-grow p-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Enter your email"
                />
              ) : (
                <span className="flex-grow p-2.5 text-gray-800 dark:text-gray-200 truncate min-h-[44px] inline-flex items-center">
                  {email}
                </span>
              )}
              {/* Edit/Cancel Button Logic */}
               {isEditingEmail ? (
                 <button
                    onClick={() => setIsEditingEmail(false)} // Simple hide
                    className="ml-3 p-1.5 rounded-md text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all flex-shrink-0"
                    aria-label="Stop editing email"
                 >
                    <X size={18} />
                 </button>
               ) : (
                 <button
                    onClick={() => setIsEditingEmail(true)}
                    className="ml-3 p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all flex-shrink-0"
                    aria-label="Edit email"
                 >
                    <Pencil size={16} />
                 </button>
               )}
            </div>
          </div>

          {/* Save/Cancel Buttons for Profile */}
          {(isEditingUsername || isEditingEmail) && (
             <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700/50 mt-4">
                <button
                    onClick={cancelEditProfile} // Resets state
                    disabled={isSavingProfile}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSaveProfile}
                    disabled={!canSaveChanges}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] transition-colors"
                >
                   {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </button>
             </div>
          )}
        </div>
      </div>
    );
  };

  const renderSecurityContent = (): React.JSX.Element => {
    return (
      <div className="space-y-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100" id="security-settings-heading">
          Password & Security
        </h2>
        <div className="space-y-5" role="group" aria-labelledby="security-settings-heading">
          {/* Password Section */}
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            {!isEditingPassword && (
                <div className="flex items-center group">
                    <span className="flex-grow p-2.5 text-gray-800 dark:text-gray-200 tracking-widest min-h-[44px] inline-flex items-center">
                    ••••••••
                    </span>
                    <button
                        onClick={() => setIsEditingPassword(true)}
                        className="ml-3 p-1.5 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex-shrink-0"
                        aria-label="Change password"
                    >
                        <Pencil size={16} />
                    </button>
              </div>
            )}
          </div>

          {/* Password Change Form (Conditional) */}
          {isEditingPassword && (
            <div className="space-y-4 border-t border-gray-200 dark:border-gray-700/50 pt-6">
              <div>
                <label htmlFor="current-password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Current Password
                </label>
                <input
                  id="current-password-input"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Enter your current password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <input
                  id="new-password-input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full p-2.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                  placeholder="Enter new password (min. 8 characters)"
                  autoComplete="new-password"
                  minLength={8} // Basic validation
                  required
                />
              </div>
              <div>
                <label htmlFor="confirm-password-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError === "New passwords do not match." && e.target.value === newPassword) {
                          setPasswordError(null); // Clear mismatch error when they match again
                      }
                  }}
                  className={`mt-1 w-full p-2.5 bg-gray-50 dark:bg-gray-800/60 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 ${
                    (newPassword && confirmPassword && newPassword !== confirmPassword) || (passwordError && passwordError !== "New passwords do not match.")
                    ? 'border-red-500 dark:border-red-600'
                    : 'border-gray-300 dark:border-gray-700'
                  }`}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                />
                 {/* Error display */}
                 {(newPassword && confirmPassword && newPassword !== confirmPassword && !passwordError) && ( // Only show mismatch if no other error exists
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Passwords do not match.</p>
                 )}
                 {passwordError && ( // Show other backend/validation errors
                     <p className="text-xs text-red-600 dark:text-red-400 mt-1">{passwordError}</p>
                 )}
              </div>
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                 <button
                    type="button" // Prevent form submission if wrapped in form
                    onClick={cancelEditPassword} // Resets state
                    disabled={isUpdatingPassword}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button" // Prevent form submission
                    onClick={handleUpdatePassword}
                    disabled={!canUpdatePassword}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px] transition-colors"
                >
                  {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Placeholder for other security settings like 2FA */}
      </div>
    );
  };

  const renderPreferencesContent = (): React.JSX.Element => {
       return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100" id="preferences-settings-heading">
              Preferences
            </h2>
            <div className="space-y-6" role="group" aria-labelledby="preferences-settings-heading">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interface Theme
                </label>
                <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Interface Theme">
                  {/* Theme Buttons */}
                  {(['light', 'dark', 'system'] as Theme[]).map((themeOption) => (
                    <button
                        key={themeOption}
                        onClick={() => handleThemeChange(themeOption)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                        theme === themeOption
                            ? "border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" // Active state
                            : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700/60 text-gray-700 dark:text-gray-300" // Inactive state
                        }`}
                        role="radio"
                        aria-checked={theme === themeOption}
                    >
                        {themeOption === 'light' && <Sun size={16} aria-hidden="true" />}
                        {themeOption === 'dark' && <Moon size={16} aria-hidden="true" />}
                        {themeOption === 'system' && <Monitor size={16} aria-hidden="true" />}
                        <span className="text-sm capitalize">{themeOption}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Removed Theme Color section - Feature deferred */}
              {/* Placeholder for other preferences like language, notifications */}
            </div>
          </div>
        );
  };

  const renderSubscriptionContent = (): React.JSX.Element => {
     return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100" id="subscription-settings-heading">
              Subscription
            </h2>
            <div className="space-y-4" role="group" aria-labelledby="subscription-settings-heading">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your plan and billing details.
              </p>
              <div className="p-5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700/50">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Current Plan: <span className="font-semibold text-blue-600 dark:text-blue-400">Free</span> {/* TODO: Fetch dynamically */}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  You are currently on the free plan.
                </p>
                <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                  View Upgrade Options
                </button>
              </div>
              {/* Placeholder for Billing History, Payment Methods etc. */}
            </div>
          </div>
        );
  };

    const renderDangerZoneContent = (): React.JSX.Element => {
       return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-500" id="danger-zone-heading">
              Danger Zone
            </h2>
            <div className="space-y-4 p-5 border border-red-300 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/10 rounded-lg" role="group" aria-labelledby="danger-zone-heading">
              <h3 className="text-lg font-medium text-red-700 dark:text-red-400">Delete Account</h3>
              <p className="text-sm text-red-600 dark:text-red-300">
                Permanently delete your account ({session?.user?.email ? <strong>{session.user.email}</strong> : 'your account'}) and all associated data. This action is irreversible and cannot be undone.
              </p>
              <button
                // TODO: Implement confirmation modal before actual deletion API call
                onClick={() => alert("Account deletion confirmation needed!")} // Simple alert placeholder
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950 disabled:opacity-50"
                disabled={status !== 'authenticated'} // Should be disabled if not logged in
              >
                Delete My Account
              </button>
              <ThemeToggle/>
            </div>
          </div>
        );
    }


  // --- Main Content Router ---
  const renderTabContent = () => {
    switch (activeTab) {
      case "account":       return renderProtectedContent(renderAccountContent);
      case "security":      return renderProtectedContent(renderSecurityContent);
      case "preferences":   return renderPreferencesContent(); // No auth needed usually
      case "subscription":  return renderProtectedContent(renderSubscriptionContent);
      case "danger":        return renderProtectedContent(renderDangerZoneContent);
      default:              return null; // Should not happen
    }
  };

  // --- Component Return ---
  return (
    // Modal backdrop
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-gray-900/30 dark:bg-black/50 backdrop-blur-sm p-4" aria-labelledby="settings-modal-title" role="dialog" aria-modal="true">
      {/* Modal container */}
      <div className="bg-white/95 dark:bg-gray-950/90 backdrop-blur-xl w-full max-w-4xl h-[calc(100vh-4rem)] max-h-[700px] rounded-xl border border-gray-200/70 dark:border-gray-800/70 overflow-hidden flex flex-col sm:flex-row shadow-xl dark:shadow-2xl dark:shadow-black/30">

        {/* Sidebar Tabs */}
        <div className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200/60 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/60 p-4 sm:p-5 overflow-y-auto" role="tablist" aria-orientation="vertical">
          <h1 id="settings-modal-title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 px-2 hidden sm:block">
            Settings
          </h1>
          <div className="space-y-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
                    activeTab === tab.id
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`settings-panel-${tab.id}`} // Connects tab to panel
                >
                  {React.cloneElement(tab.icon, { "aria-hidden": true })} {/* Hide icon from screen readers */}
                  {tab.label}
                </button>
              ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div
            className="flex-1 p-6 sm:p-8 overflow-y-auto relative"
            id={`settings-panel-${activeTab}`} // Connects panel to tab
            role="tabpanel"
            tabIndex={0} // Make panel focusable
            aria-labelledby={`settings-tab-${activeTab}`} // Labels panel with tab
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
            aria-label="Close settings"
          >
            <X size={20} />
          </button>
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;