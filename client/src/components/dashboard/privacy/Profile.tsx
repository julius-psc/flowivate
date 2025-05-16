"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";

interface ProfileProps {
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { data: session, status } = useSession();
  const isLoadingSession = status === "loading";

  const username = session?.user?.username || "Guest";
  const email = session?.user?.email || "No email provided";
  const userImage = session?.user?.image;
  const userInitial = username.charAt(0).toUpperCase();

  // ← new state to hold the fetched date
  const [joinedDate, setJoinedDate] = useState<string | null>(null);
  const [loadingDate, setLoadingDate] = useState<boolean>(true);

  useEffect(() => {
    // only fetch once on mount
    const fetchJoined = async () => {
      try {
        const res = await fetch("/api/user", {
          method: "GET",
          credentials: "include",     // include auth cookies
        });
        if (!res.ok) throw new Error("Failed to load join date");
        const data = await res.json();
        setJoinedDate(data.joinedDate); // ISO string from backend
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDate(false);
      }
    };

    fetchJoined();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl flex rounded-xl bg-secondary-white dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/30 dark:border-zinc-800/30 overflow-hidden"
      >
        {/* Left Panel */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6 min-w-[200px] border-r border-slate-200/30 dark:border-zinc-800/30">
          <div className="w-24 h-24 rounded-full border border-neutral-300 dark:border-neutral-700 overflow-hidden flex items-center justify-center text-3xl font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800">
            {isLoadingSession ? (
              <div className="w-full h-full animate-pulse bg-neutral-200 dark:bg-neutral-700" />
            ) : userImage ? (
              <Image
                src={userImage}
                alt={username}
                width={96}
                height={96}
                className="object-cover"
              />
            ) : (
              userInitial
            )}
          </div>

          {/* show spinner/text until we have the date */}
          <span className="mt-3 text-xs text-neutral-500">
            {loadingDate
              ? "Loading…"
              : joinedDate
              ? `Joined ${new Date(joinedDate).toLocaleDateString()}`
              : "Joined date unavailable"}
          </span>
        </div>

        {/* Right Panel */}
        <div className="relative z-10 flex-1 p-6 flex flex-col justify-between">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-neutral-500 hover:text-black dark:hover:text-white"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>

          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
              {username}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">{email}</p>
          </div>

          <div>
            <p className="text-sm text-neutral-500 mb-2">
              Love Flowivate? Share it with your friends! 🚀
            </p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  "Check out Flowivate – the productivity OS I'm using: https://flowivate.com"
                );
                alert("Copied share link to clipboard.");
              }}
              className="text-sm font-medium text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg px-4 py-2 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Share Flowivate
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;