'use client';

import { useState } from 'react';
import { IconX, IconSettings, IconMoon, IconSun, IconShield, IconDownload, IconTrash } from '@tabler/icons-react';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg">
              <IconSettings size={22} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconX size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Theme Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <IconMoon size={20} className="text-indigo-500" />
                ) : (
                  <IconSun size={20} className="text-amber-500" />
                )}
                <span className="text-gray-800 dark:text-gray-200 font-medium">
                  Dark Mode
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Notifications
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="text-gray-800 dark:text-gray-200">
                  In-App Notifications
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={() => setNotifications(!notifications)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <span className="text-gray-800 dark:text-gray-200">
                  Email Notifications
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={() => setEmailNotifications(!emailNotifications)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <IconShield size={20} className="text-green-500" />
                  <span className="text-gray-800 dark:text-gray-200">
                    Two-Factor Authentication
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={twoFactor}
                    onChange={() => setTwoFactor(!twoFactor)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
              <button className="w-full text-left p-3 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center">
                <span className="font-medium">Change Password</span>
              </button>
            </div>
          </div>

          {/* Data Settings */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Data Management
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3">
                <IconDownload size={20} className="text-blue-500" />
                <span className="text-gray-800 dark:text-gray-200">Export Your Data</span>
              </button>
              <button className="w-full text-left p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center gap-3">
                <IconTrash size={20} className="text-red-500" />
                <span className="text-gray-800 dark:text-gray-200">Delete Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}