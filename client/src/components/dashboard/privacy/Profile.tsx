"use client";

import React from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { IconX } from "@tabler/icons-react";
import { motion } from "framer-motion";

interface ProfileProps {
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const username = session?.user?.username || "Guest";
  const email = session?.user?.email || "No email provided";
  const userImage = session?.user?.image;
  const joinedDate = "2024-06-01"; // Placeholder
  const userInitial = username.charAt(0).toUpperCase();
  const badge = "OG User";

  const stats = {
    streak: 5,
    tasksToday: 8,
    focusTime: "3h 25m"
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl flex rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-xl overflow-hidden"
      >
        {/* Animated Background */}
        <motion.div
          className="absolute -inset-20 bg-gradient-to-r from-[#a1c4fd] via-[#c2e9fb] to-[#fbc2eb] opacity-15 rounded-full blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, -80, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Left: Avatar */}
        <div className="flex flex-col justify-center items-center p-6 min-w-[200px] border-r border-neutral-200 relative z-10">
          <div className="w-24 h-24 rounded-full border-[6px] border-blue-400/30 overflow-hidden flex items-center justify-center text-3xl font-semibold text-neutral-700 bg-neutral-100">
            {isLoading ? (
              <div className="w-full h-full animate-pulse bg-neutral-200" />
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

          <span className="mt-3 text-xs text-neutral-500">Joined {new Date(joinedDate).toLocaleDateString()}</span>
          <span className="mt-2 px-3 py-1 text-xs rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 font-medium">
            {badge}
          </span>
        </div>

        {/* Right: Info + Data */}
        <div className="flex-1 p-6 relative z-10 flex flex-col justify-between">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-neutral-500 hover:text-black"
            aria-label="Close"
          >
            <IconX size={18} />
          </button>

          {/* Top: Identity */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">{username}</h2>
            <p className="text-sm text-neutral-500 mt-1">{email}</p>
          </div>

          {/* Middle: Minimal Stats */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-sm text-neutral-700">
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500">Streak</span>
              <span className="font-medium">{stats.streak} days</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500">Tasks Today</span>
              <span className="font-medium">{stats.tasksToday}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-neutral-500">Focus Time</span>
              <span className="font-medium">{stats.focusTime}</span>
            </div>
          </div>

          {/* Bottom: CTA */}
          <div className="mt-8">
            <div className="text-sm text-neutral-500 mb-2">Love Flowivate? Share it with your team.</div>
            <button
              onClick={() => {
                navigator.clipboard.writeText("Check out Flowivate – the productivity OS I'm using: https://flowivate.com");
                alert("Copied share link to clipboard.");
              }}
              className="text-sm font-medium text-black border border-neutral-300 rounded-lg px-4 py-2 hover:bg-neutral-100 transition"
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