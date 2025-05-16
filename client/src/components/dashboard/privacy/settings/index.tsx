"use client";

import React, { useState, MouseEvent } from "react";
import { X, User, Lock, Settings, CreditCard, AlertTriangle, } from "lucide-react";
import AccountTab from "./tabs/AccountTab";
import AppearanceTab from "./tabs/AppearanceTab";
import DangerTab from "./tabs/DangerTab";
import SecurityTab from "./tabs/SecurityTab";
import SubscriptionTab from "./tabs/SubscriptionTab";

import StatusIndicator from "./StatusIndicator";
import { useSettings } from "./useSettings";
import { SettingsModalProps, Tab } from "./types";

// Tab definitions
const tabs: Tab[] = [
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "security", label: "Security", icon: <Lock size={16} /> },
  { id: "appearance", label: "Appearance", icon: <Settings size={16} /> },
  { id: "subscription", label: "Subscription", icon: <CreditCard size={16} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={16} /> },
];

const SettingsModal = ({ isOpen, onClose }: SettingsModalProps): React.JSX.Element | null => {
  const [activeTab, setActiveTab] = useState<string>("account");
  const {
    statusMessage,
    clearStatusMessage,
    cancelEditPassword,
    cancelDeleteAccount,
    styling,
  } = useSettings();

  if (!isOpen) return null;

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountTab />;
      case "security":
        return <SecurityTab />;
      case "appearance":
        return <AppearanceTab />;
      case "subscription":
        return <SubscriptionTab />;
      case "danger":
        return <DangerTab />;
      default:
        return <p>Invalid tab selected.</p>;
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/20 dark:bg-black/60 p-4"
        aria-labelledby="settings-modal-title"
        role="dialog"
        aria-modal="true"
        onClick={onClose}
      >
        <div
          onClick={(e: MouseEvent) => e.stopPropagation()}
          className="bg-secondary-white dark:bg-secondary-black w-full max-w-4xl h-[calc(100vh-4rem)] max-h-[750px] rounded-md border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col sm:flex-row"
        >
          <div
            className="w-full sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-secondary-black p-3 sm:p-4 overflow-y-auto relative"
            role="tablist"
            aria-orientation="vertical"
          >
            <h1
              id="settings-modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 px-2 hidden sm:block"
            >
              Settings
            </h1>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:hidden p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Close settings"
            >
              <X size={18} />
            </button>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (activeTab === "security") cancelEditPassword();
                    if (activeTab === "danger") cancelDeleteAccount();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-900 ${
                    activeTab === tab.id
                      ? "bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary/70"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  } ${
                    tab.id === "danger" && activeTab !== "danger"
                      ? "!text-red-600 dark:!text-red-400 hover:!bg-red-50 dark:hover:!bg-red-900/20 hover:!text-red-700 dark:hover:!text-red-300"
                      : ""
                  } ${
                    tab.id === "danger" && activeTab === "danger"
                      ? "!bg-red-50 dark:!bg-red-900/30 !text-red-700 dark:!text-red-300"
                      : ""
                  }`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`settings-panel-${activeTab}`}
                >
                  {React.cloneElement(tab.icon as React.ReactElement)}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div
            className="flex-1 p-5 sm:p-6 overflow-y-auto relative"
            id={`settings-panel-${activeTab}`}
            role="tabpanel"
            tabIndex={0}
            aria-labelledby={`settings-tab-${activeTab}`}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 hidden sm:inline-flex p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-950"
              aria-label="Close settings"
            >
              <X size={20} />
            </button>
            {renderTabContent()}
          </div>
        </div>
      </div>
      <StatusIndicator
        statusMessage={statusMessage}
        clearStatusMessage={clearStatusMessage}
        styling={styling}
      />
    </>
  );
};

export default SettingsModal;