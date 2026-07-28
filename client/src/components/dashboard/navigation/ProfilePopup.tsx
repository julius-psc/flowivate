"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IconPencil } from "@tabler/icons-react";
import { motion } from "motion/react";
import { Session } from "next-auth";
import { isEliteStatus } from "@/lib/subscription";
import { Skeleton } from "@/components/ui/Skeleton";

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
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({
  session,
  currentStatus,
  isSpecialTheme,
  isMounted,
  onEditProfile,
}) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const subRes = await fetch("/api/user/subscription");
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionStatus(subData.subscriptionStatus || "free");
        } else {
          setSubscriptionStatus("free");
        }
      } catch {
        setSubscriptionStatus("free");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const username = session.user?.username || "User";
  const userInitial = username.charAt(0).toUpperCase();
  const isElite = subscriptionStatus !== null && isEliteStatus(subscriptionStatus);

  if (!isMounted) return null;

  const cardBorder = isSpecialTheme
    ? "border-white/[0.07]"
    : "border-gray-200 dark:border-zinc-800";

  const headerBg = isSpecialTheme
    ? "bg-white/[0.03]"
    : "bg-gray-50/80 dark:bg-zinc-900/60";

  const bodyBg = isSpecialTheme
    ? "bg-zinc-950/95"
    : "bg-white dark:bg-zinc-950";

  const divider = isSpecialTheme
    ? "border-white/[0.06]"
    : "border-gray-100 dark:border-zinc-800/80";

  const primaryText = isSpecialTheme
    ? "text-white"
    : "text-gray-900 dark:text-white";

  const mutedText = isSpecialTheme
    ? "text-white/35"
    : "text-gray-400 dark:text-zinc-500";

  const statusText = isSpecialTheme
    ? "text-white/50"
    : "text-gray-500 dark:text-zinc-400";

  const hoverRow = isSpecialTheme
    ? "hover:bg-white/[0.05] active:bg-white/[0.08]"
    : "hover:bg-gray-50 dark:hover:bg-zinc-900 active:bg-gray-100 dark:active:bg-zinc-800/60";

  const iconCol = isSpecialTheme
    ? "text-white/25"
    : "text-gray-400/60 dark:text-zinc-600";

  return (
    <div className="profile-popup-container absolute right-0 mt-3 w-[256px] z-50">
      <motion.div
        initial={{ opacity: 0, y: -8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        className={`rounded-[13px] border overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] ${bodyBg} ${cardBorder}`}
      >
        {/* ── Header ─────────────────────────── */}
        <div className={`${headerBg} px-4 pt-[14px] pb-[13px]`}>
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-[44px] h-[44px] rounded-full overflow-hidden ring-1 ring-black/[0.06] dark:ring-white/[0.08]">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={username}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-blue flex items-center justify-center text-white font-semibold">
                    {userInitial}
                  </div>
                )}
              </div>
              <div
                className={`absolute -bottom-px -right-px w-[11px] h-[11px] rounded-full border-[2px] ${
                  isSpecialTheme ? "border-zinc-950" : "border-gray-50 dark:border-zinc-900"
                } ${currentStatus.color}`}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-[1px]">
              <div className="flex items-center gap-1.5 mb-[3px]">
                <span className={`text-[13px] font-semibold truncate leading-none ${primaryText}`}>
                  {username}
                </span>
                {loading ? (
                  <Skeleton className="h-[14px] w-8 rounded" />
                ) : isElite ? (
                  <span className="shrink-0 inline-flex items-center px-[5px] py-[2px] text-[9px] font-bold uppercase tracking-[0.09em] rounded-[4px] text-primary-blue border border-primary-blue/25 bg-primary-blue/[0.08]">
                    Elite
                  </span>
                ) : (
                  <span className={`shrink-0 px-[5px] py-[2px] text-[9px] font-bold uppercase tracking-[0.09em] rounded-[4px] ${
                    isSpecialTheme
                      ? "border border-white/10 text-white/25"
                      : "border border-gray-200 dark:border-zinc-700/60 text-gray-400 dark:text-zinc-600"
                  }`}>
                    Free
                  </span>
                )}
              </div>

              <p className={`text-[11px] truncate leading-none mb-[6px] ${mutedText}`}>
                {session.user.email}
              </p>

              {/* Status row */}
              <div className="flex items-center gap-[5px]">
                <div className={`w-[6px] h-[6px] rounded-full shrink-0 ${currentStatus.color}`} />
                <span className={`text-[11px] leading-none ${statusText}`}>
                  {currentStatus.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ────────────────────────── */}
        <div className={`border-t ${divider}`} />

        {/* ── Actions ────────────────────────── */}
        <div className="p-[5px]">
          <button
            onClick={onEditProfile}
            className={`w-full flex items-center gap-[10px] px-[10px] py-[8px] rounded-[8px] text-left transition-colors duration-100 ${hoverRow}`}
          >
            <IconPencil size={13} className={iconCol} strokeWidth={2} />
            <span className={`text-[13px] font-medium ${primaryText}`}>
              Edit profile
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ProfilePopup;
