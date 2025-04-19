"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import Settings from "../privacy/Settings";
import {
  IconLayoutDashboard,
  IconStack2,
  IconNotes,
  IconLogout2,
  IconSettings,
  IconBook,
} from "@tabler/icons-react";
import logo from "../../../assets/brand/logo-v1.5.svg";

interface NavItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const Sidebar: React.FC = () => {
  const [activeLink, setActiveLink] = useState("Home");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navItems: NavItem[] = [
    { name: "Home", icon: IconLayoutDashboard, path: "/dashboard" },
    { name: "Personal", icon: IconStack2, path: "/dashboard/personal" },
    { name: "Journal", icon: IconNotes, path: "/dashboard/journal" },
    { name: "Books", icon: IconBook, path: "/dashboard/books" },
  ];

  return (
    <>
      <div className=" border border-bdr-light dark:border-bdr-dark p-5 mb-2 mx-2 rounded-lg flex flex-col justify-between items-center">
        <div>
          <div className="mb-10 flex-shrink-0 transition-transform duration-200 hover:scale-105">
            <Image src={logo} alt="Flowivate's logo" width={44} height={44} priority />
          </div>

          <div className="flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name} className="relative group">
                  <Link href={item.path}>
                    <div
                      className={`flex items-center justify-center py-2 rounded-md cursor-pointer transition-all duration-200 group-hover:bg-primary-bluelight dark:group-hover:bg-primary-blue-ring ${
                        activeLink === item.name
                          ? "bg-primary-bluelight dark:bg-primary-blue-ring"
                          : ""
                      }`}
                      onClick={() => setActiveLink(item.name)}
                    >
                      <item.icon
                        className={`w-6 h-6 transition-colors duration-200 ${
                          activeLink === item.name
                            ? "text-primary-blue"
                            : "text-secondary-black opacity-20 dark:text-secondary-white group-hover:text-primary-blue dark:group-hover:text-primary-blue"
                        }`}
                      />
                    </div>
                  </Link>

                  <div className="absolute left-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm text-primary-blue px-2 py-1 rounded-lg whitespace-nowrap z-10">
                    {item.name}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 pt-4">

          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2"
            >
              <IconSettings className="w-4 h-4 text-secondary-black dark:text-secondary-white hover:text-primary-blue dark:hover:text-primary-blue transition-colors duration-200" />
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2"
            >
              <IconLogout2 className="w-4 h-4 text-secondary-black dark:text-secondary-white hover:text-primary-blue dark:hover:text-primary-blue transition-colors duration-200" />
            </button>
          </div>
        </div>
      </div>

      <Settings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Sidebar;