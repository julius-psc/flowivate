"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IconPencil } from "@tabler/icons-react";
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
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("free");
  const [joinedDate, setJoinedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, subRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/user/subscription"),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.joinedDate) {
            setJoinedDate(new Date(userData.joinedDate));
          }
        }

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionStatus(subData.subscriptionStatus || "free");
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const username = session.user?.username || "User";
  const userInitial = username.charAt(0).toUpperCase();

  // Modern styling: Clean borders, no shadows, precise spacing
  const containerClasses =
    "profile-popup-container absolute right-0 mt-4 w-[320px] z-50";

  const contentClasses = `
    relative rounded-xl border overflow-hidden transition-all duration-200
    ${isMounted
      ? isSpecialTheme
        ? "bg-zinc-900/90 border-zinc-800 backdrop-blur-xl"
        : "bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800"
      : "opacity-0"
    }
  `;

  // Dynamic formatting for "Member since"
  const formattedJoinDate = joinedDate
    ? new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(joinedDate)
    : "Recently joined";

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <div className="p-5">
          {/* Header / Edit Button */}
          <button
            onClick={onEditProfile}
            className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title="Edit profile"
          >
            <IconPencil size={16} />
          </button>

          {/* User Info Section */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-semibold text-2xl overflow-hidden bg-gray-100 dark:bg-zinc-800 ring-1 ring-gray-100 dark:ring-zinc-800">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.username || "User Avatar"}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="flex items-center justify-center w-full h-full bg-primary-blue text-white">
                    {userInitial}
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              <div className="absolute -bottom-1 -right-1 p-0.5 bg-white dark:bg-zinc-950 rounded-full">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${currentStatus.color} border-2 border-white dark:border-zinc-950`}
                  title={`Status: ${currentStatus.name}`}
                />
              </div>
            </div>

            {/* Text Info */}
            <div className="flex-1 min-w-0 pt-0.5 pr-8">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                  {username}
                </h3>
                {/* Dynamic Badge - Black & White High Contrast */}
                <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wide rounded border ${(subscriptionStatus === "active" || subscriptionStatus === "pro")
                  ? "bg-primary-blue border-primary-blue text-white"
                  : "border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                  }`}>
                  {subscriptionStatus === "active" ? "ELITE" : subscriptionStatus}
                </span>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-2">
                {session.user.email}
              </p>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Member since {loading ? "..." : formattedJoinDate}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800/50">
            <button
              onClick={onShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-800 transition-all"
            >
              Share Flowivate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
