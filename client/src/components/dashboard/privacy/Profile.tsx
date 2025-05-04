"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image"; // Import next/image
import { IconX, IconLogout, IconSettings, IconUser } from "@tabler/icons-react";

interface ProfileProps {
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const username = session?.user?.username || (isLoading ? "Loading..." : "Guest");
  const email = session?.user?.email || (isLoading ? "..." : "No email provided");
  const userImage = session?.user?.image; // This will be null if no image
  const userInitial = username.charAt(0).toUpperCase();

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
    onClose();
  };

  const isAuthenticated = status === "authenticated";

  return (
    // Overlay container
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      {/* Profile Card */}
      <div
        className="relative w-full max-w-xs rounded-2xl border border-white/10 bg-clip-padding backdrop-filter backdrop-blur-xl bg-gradient-to-br from-zinc-800/80 via-zinc-900/90 to-black/80 shadow-2xl p-6 text-gray-100 overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          aria-label="Close profile"
        >
          <IconX size={20} />
        </button>

        {/* Profile Header */}
        <div className="flex flex-col items-center mb-6 text-center">
          {/* Avatar Container */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white text-4xl font-medium mb-4 shadow-lg border-2 border-white/20 overflow-hidden">
            {isLoading ? (
              <div className="w-full h-full bg-gray-700 animate-pulse"></div>
            ) : userImage ? (
              // Use next/image
              <Image
                src={userImage}
                alt={username} // Use username for alt text
                width={80} // w-20 = 80px
                height={80} // h-20 = 80px
                className="object-cover" // Removed w-full h-full
                priority // Prioritize loading profile avatar when modal opens
              />
            ) : (
              // Fallback Initial - ensure it's centered if no image
              <span className="flex items-center justify-center w-full h-full">
                {userInitial}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold text-white truncate w-full px-2">
            {username}
          </h2>
          <p className="text-sm text-gray-400 truncate w-full px-2">{email}</p>
        </div>

        {/* Action Buttons */}
        {isAuthenticated && (
          <>
            <div className="space-y-2 mb-4">
              <button className="w-full flex items-center space-x-3 text-left text-sm text-gray-200 hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-400">
                <IconUser className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="truncate">View Profile</span>
              </button>
              <button className="w-full flex items-center space-x-3 text-left text-sm text-gray-200 hover:bg-white/10 px-3 py-2.5 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-400">
                <IconSettings className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <span className="truncate">Account Settings</span>
              </button>
            </div>

            <div className="h-px bg-white/10 my-3"></div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 text-left text-sm text-red-400 hover:bg-red-500/20 px-3 py-2.5 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <IconLogout className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </button>
          </>
        )}

        {/* Login Button (Optional) */}
        {!isAuthenticated && !isLoading && (
          <button className="mt-4 w-full text-center py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
            Login
          </button>
        )}
      </div>

      {/* Global Styles - ensure this syntax is correct */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
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
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Profile;