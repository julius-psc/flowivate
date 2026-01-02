"use client";

import React from "react";
import Image from "next/image";
import { IconPencil, IconShare } from "@tabler/icons-react";
import { Session } from "next-auth";

interface StatusOption {
  name: string;
  color: string;
  bgColor: string;
}

interface ProfilePopupProps {
  session: Session;
  currentStatus: StatusOption;
  isSpecialTheme: boolean;
  isMounted: boolean;
  onEditProfile: () => void;
  onShare: () => void;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({
  session,
  currentStatus,
  isSpecialTheme,
  isMounted,
  onEditProfile,
  onShare,
}) => {
  const username = session.user?.username || "User";
  const userInitial = username.charAt(0).toUpperCase();

  const profileBaseClasses =
    "relative backdrop-blur-md rounded-2xl overflow-hidden transition-opacity duration-300";
  const profilePreMountClasses =
    "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 opacity-0";
  const profilePostMountClasses = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50 opacity-100"
    : "bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 opacity-100";

  return (
    <div className="profile-popup-container absolute right-0 mt-2 w-80 z-20">
      <div
        className={`${profileBaseClasses} ${
          isMounted ? profilePostMountClasses : profilePreMountClasses
        }`}
      >
        <div className="relative p-6">
          <button
            onClick={onEditProfile}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100/60 dark:hover:bg-gray-800/30 rounded-lg transition-colors"
            aria-label="Edit profile"
          >
            <IconPencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          <div className="flex items-start space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-2xl overflow-hidden">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.username || "User Avatar"}
                    width={80}
                    height={80}
                    className="object-cover"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full bg-green-500">
                    {userInitial}
                  </span>
                )}
              </div>
              <div
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full ${
                  currentStatus.bgColor
                } flex items-center justify-center border-2 ${
                  isMounted
                    ? isSpecialTheme
                      ? "border-zinc-900/50"
                      : "border-white dark:border-zinc-900"
                    : "border-white dark:border-zinc-900"
                } `}
              >
                <div
                  className={`w-2 h-2 rounded-full ${currentStatus.color}`}
                />
              </div>
            </div>

            <div className="flex-1 pt-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {username}
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-900/30 rounded-md border border-blue-200/50 dark:border-blue-800/50">
                  ELITE
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {session.user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                Member since 03/06/2007
              </p>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={onShare}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100/60 dark:bg-gray-800/30 hover:bg-gray-200/60 dark:hover:bg-gray-700/30 rounded-lg transition-colors border border-slate-200/30 dark:border-zinc-800/30"
            >
              <IconShare className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
