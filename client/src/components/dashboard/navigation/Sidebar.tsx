"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Settings from "../privacy/Settings";
import {
  IconChevronsRight,
  IconChevronsLeft,
  IconLayoutDashboard,
  IconStack2,
  IconNotes,
  IconChevronDown,
  IconLogout2,
  IconSettings,
  IconUser,
  IconFocus,
  IconClock,
  IconBellOff,
  IconBook
} from "@tabler/icons-react";
import logo from "../../../assets/brand/logo-v1.4.png";

// Define types for status options
interface StatusOption {
  name: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Define types for nav items
interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [status, setStatus] = useState<string | null>(null); // Start with null for loading state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const statusOptions: StatusOption[] = [
    { name: "Active", color: "bg-emerald-500", bgColor: "bg-emerald-500/10", icon: IconUser },
    { name: "Focusing", color: "bg-blue-500", bgColor: "bg-blue-500/10", icon: IconFocus },
    { name: "Idle", color: "bg-amber-500", bgColor: "bg-amber-500/10", icon: IconClock },
    { name: "DND", color: "bg-rose-500", bgColor: "bg-rose-500/10", icon: IconBellOff },
  ];

  const navItems: NavItem[] = [
    { name: "Home", icon: IconLayoutDashboard, path: "/dashboard" },
    { name: "Personal", icon: IconStack2, path: "/dashboard/personal" },
    { name: "Journal", icon: IconNotes, path: "/dashboard/journal" },
    { name: "Books", icon: IconBook, path: "/dashboard/books" },
  ];

  // Fetch initial status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/features/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }

        const data = await response.json();
        setStatus(data.status);
      } catch (error) {
        console.error("Error fetching status:", error);
        setStatus("Active"); // Fallback to default status
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  // Update status with explicit typing
  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch("/api/features/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setStatus(newStatus);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Loading state UI
  if (isLoading || status === null) {
    return (
      <div className="w-[80px] dark:bg-bg-dark border border-gray-200 dark:border-gray-800/50 p-5 rounded-lg flex flex-col items-center">
        <div className="mb-8 flex-shrink-0 transition-transform duration-200 hover:scale-105">
          <Image
            className="w-12 h-auto"
            src={logo}
            alt="Flowivate's logo"
            width={48}
            height={48}
            priority
          />
        </div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  // Full UI once loaded
  const currentStatus = statusOptions.find((opt) => opt.name === status) || statusOptions[0];
  const StatusIcon = currentStatus.icon;

  return (
    <>
      <div
        className={`border border-gray-200/50 z-100 dark:border-gray-800/50 p-5 mb-2 mx-2 rounded-lg transition-all duration-300 ease-in-out flex flex-col items-center ${
          isExpanded ? "min-w-[320px]" : "w-[80px]"
        }`}
      >
        <div
          className={`mb-6 flex-shrink-0 w-full ${
            isExpanded ? "flex justify-end" : "flex justify-center"
          }`}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-full hover:bg-secondary-white dark:hover:bg-primary-black transition-all duration-200 cursor-pointer active:scale-95"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <IconChevronsLeft className="w-5 h-5 text-primary-black dark:text-primary-white dark:opacity-20 opacity-80 hover:opacity-100 transition-colors duration-200" />
            ) : (
              <IconChevronsRight className="w-5 h-5 text-primary-black dark:text-primary-white dark:opacity-20 opacity-80 hover:opacity-100 transition-colors duration-200" />
            )}
          </button>
        </div>

        <div className="mb-8 flex-shrink-0 transition-transform duration-200 hover:scale-105">
          <Image
            className="w-12 h-auto"
            src={logo}
            alt="Flowivate's logo"
            width={48}
            height={48}
            priority
          />
        </div>

        <div className="flex-grow overflow-y-auto w-full">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.path}>
                  <div
                    className={`flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 w-full group ${
                      activeLink === item.name
                        ? "bg-blue-500/10"
                        : "hover:bg-blue-500/10"
                    }`}
                    onClick={() => setActiveLink(item.name)}
                  >
                    <item.icon
                      className={`w-6 h-6 flex-shrink-0 ${
                        activeLink === item.name
                          ? "text-primary-blue"
                          : "text-primary-black opacity-20 dark:text-primary-white group-hover:text-blue-500 dark:group-hover:text-blue-400"
                      } transition-colors duration-200`}
                    />
                    {isExpanded && (
                      <span
                        className={`ml-3 font-medium whitespace-nowrap ${
                          activeLink === item.name
                            ? "text-primary-blue"
                            : "text-primary-black dark:text-primary-white opacity-20 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                        } transition-opacity duration-200`}
                      >
                        {item.name}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex-shrink-0 w-full">
          {isExpanded ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                disabled={isLoading}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className={`w-8 h-8 rounded-full ${currentStatus.bgColor} flex items-center justify-center`}
                    >
                      <StatusIcon
                        className={`w-4 h-4 ${currentStatus.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      />
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${currentStatus.color} ring-2 ring-white dark:ring-gray-900`}
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium text-gray-400">
                      Status
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {status}
                    </span>
                  </div>
                </div>
                <IconChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <div
                className={`absolute bottom-full left-0 w-full mb-1 transition-all duration-200 ease-in-out transform z-10 ${
                  isDropdownOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2 pointer-events-none"
                }`}
              >
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 py-1 overflow-hidden">
                  {statusOptions.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => updateStatus(option.name)}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer ${
                        status === option.name ? option.bgColor : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full ${option.bgColor} flex items-center justify-center`}
                      >
                        <option.icon
                          className={`w-3.5 h-3.5 ${option.color.replace(
                            "bg-",
                            "text-"
                          )}`}
                        />
                      </div>
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="rounded-full border border-gray-100 dark:border-gray-700 cursor-pointer transition-all duration-200 relative"
                onClick={() => setIsExpanded(true)}
                title={status}
              >
                <div
                  className={`w-6 h-6 rounded-full ${currentStatus.bgColor} flex items-center justify-center`}
                >
                  <StatusIcon
                    className={`w-3 h-3 ${currentStatus.color.replace(
                      "bg-",
                      "text-"
                    )}`}
                  />
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${currentStatus.color} ring-1 ring-white dark:ring-gray-900`}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-8 pb-2 w-full">
          {isExpanded ? (
            <div className="flex justify-between items-center px-1">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-primary-white dark:hover:bg-primary-black cursor-pointer transition-all duration-200 active:scale-95"
              >
                <IconSettings className="w-4 h-4 text-primary-black dark:text-primary-white opacity-70 hover:opacity-100 transition-colors duration-200" />
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-full hover:bg-primary-white dark:hover:bg-primary-black cursor-pointer transition-all duration-200 active:scale-95"
              >
                <IconLogout2 className="w-4 h-4 text-primary-black dark:text-primary-white opacity-70 hover:opacity-100 transition-colors duration-200" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-primary-white dark:hover:bg-primary-black cursor-pointer transition-all duration-200 active:scale-95"
              >
                <IconSettings className="w-4 h-4 text-primary-black dark:text-primary-white opacity-70 hover:opacity-100 transition-colors duration-200" />
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2 rounded-full hover:bg-primary-white dark:hover:bg-primary-black cursor-pointer transition-all duration-200 active:scale-95"
              >
                <IconLogout2 className="w-4 h-4 text-primary-black dark:text-primary-white opacity-70 hover:opacity-100 transition-colors duration-200" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Sidebar;