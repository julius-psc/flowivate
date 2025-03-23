import React, { useState } from "react";
import Image from "next/image";
import {
  IconChevronsRight,
  IconChevronsLeft,
  IconLayoutDashboard,
  IconStack2,
  IconMoodSmile,
  IconNotes,
  IconChevronDown,
  IconLogout2,
  IconSettings,
} from "@tabler/icons-react";
import logo from "../../../assets/brand/logo-v1.0.svg";

const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeLink, setActiveLink] = useState("Home");
  const [status, setStatus] = useState("Active");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const statusOptions = [
    { name: "Active", color: "bg-emerald-500", bgColor: "bg-emerald-500/10" },
    { name: "Focusing", color: "bg-blue-500", bgColor: "bg-blue-500/10" },
    { name: "Idle", color: "bg-amber-500", bgColor: "bg-amber-500/10" },
    { name: "DND", color: "bg-rose-500", bgColor: "bg-rose-500/10" },
  ];

  const currentStatus = statusOptions.find((opt) => opt.name === status);

  return (
    <div
      className={`bg-white dark:bg-gray-800 p-5 mb-2 mx-2 rounded-xl transition-all duration-300 ease-in-out flex flex-col items-center ${
        isExpanded ? "w-[320px]" : "w-[80px]"
      }`}
    >
      <div
        className={`mb-6 flex-shrink-0 w-full ${
          isExpanded ? "flex justify-end" : "flex justify-center"
        }`}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
        >
          {isExpanded ? (
            <IconChevronsLeft className="w-5 h-5 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100 transition-colors duration-200" />
          ) : (
            <IconChevronsRight className="w-5 h-5 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100 transition-colors duration-200" />
          )}
        </button>
      </div>

      <div className="mb-8 flex-shrink-0">
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
          {[
            { name: "Home", icon: IconLayoutDashboard },
            { name: "Tasks", icon: IconStack2 },
            { name: "Personal", icon: IconMoodSmile },
            { name: "Journal", icon: IconNotes },
          ].map((item) => (
            <li
              key={item.name}
              className={`flex items-center p-2 rounded-lg cursor-pointer transition-all duration-200 w-full ${
                activeLink === item.name
                  ? "bg-gray-100 dark:bg-gray-800"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => setActiveLink(item.name)}
            >
              <item.icon
                className={`w-6 h-6 flex-shrink-0 ${
                  activeLink === item.name
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-600 dark:text-gray-300"
                } transition-colors duration-200`}
              />
              {isExpanded && (
                <span
                  className={`ml-3 font-medium whitespace-nowrap ${
                    activeLink === item.name
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-600 dark:text-gray-300"
                  } transition-opacity duration-200`}
                >
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex-shrink-0 w-full">
        {isExpanded ? (
          <div className="relative group">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${currentStatus?.color}`}
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {status}
                </span>
              </div>
              <IconChevronDown
                className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`absolute bottom-full left-0 w-full mb-1 transition-all duration-200 ease-in-out transform ${
                isDropdownOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-2 pointer-events personally-none"
              }`}
            >
              <div className="bg-white dark:bg-gray-900 shadow-sm rounded-lg border border-gray-100 dark:border-gray-700 py-1">
                {statusOptions.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => {
                      setStatus(option.name);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150 cursor-pointer ${
                      status === option.name
                        ? "bg-gray-50 dark:bg-gray-800"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${option.color}`}
                    />
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="p-2 bg-white dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-700">
              <div
                className={`w-3 h-3 rounded-full ${currentStatus?.color}`}
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 pb-2 w-full">
        {isExpanded ? (
          <div className="flex justify-between items-center px-1">
            <button className="cursor-pointer">
              <IconLogout2 className="w-4 h-4 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100 transition-colors duration-200" />
            </button>
            <button className="cursor-pointer">
              <IconSettings className="w-4 h-4 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100 transition-colors duration-200" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button className="pr-1 cursor-pointer">
              <IconLogout2 className="w-4 h-4 text-gray-600 dark:text-gray-300 opacity-60 hover:opacity-100 transition-colors duration-200" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;