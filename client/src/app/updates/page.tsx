"use client";
import Navbar from "@/components/landing-page/Navbar";
import React from "react";

type UpdateType = "new" | "improved" | "fixed";

interface Update {
  date: string;
  title: string;
  description: string;
  type: UpdateType;
}

const updates: Update[] = [
  {
    date: "2025-07-08",
    title: "Implemented an UPDATES page",
    description:
      "Added a page to track improvements/features.",
    type: "new",
  },
];

const typeStyles: Record<
  UpdateType,
  { label: string; colors: { bg: string; text: string } }
> = {
  new: {
    label: "New",
    colors: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
    },
  },
  improved: {
    label: "Improved",
    colors: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
    },
  },
  fixed: {
    label: "Fixed",
    colors: {
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function UpdatesPage() {
  return (
    <div className="min-h-screen bg-secondary-black">
      <div className="p-12">
          <Navbar />
      </div>
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900/20 via-black to-gray-900/20 pointer-events-none" />

      <main className="relative max-w-4xl mx-auto px-6 py-24">

        {/* Updates Timeline */}
        <div className="space-y-6">
          {updates.map((update, idx) => {
            const typeStyle = typeStyles[update.type];

            return (
              <div
                key={idx}
                className="border-b border-gray-800/50 pb-6 last:border-b-0"
              >
                {/* Date and type */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500 font-medium">
                    {formatDate(update.date)}
                  </span>

                  <div
                    className={`px-2 py-1 rounded-md text-xs font-medium ${typeStyle.colors.bg} ${typeStyle.colors.text} border border-current/10`}
                  >
                    {typeStyle.label}
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-white font-semibold mb-2">
                  {update.title}
                </h3>

                {/* Description */}
                <p className="text-gray-400 text-sm leading-relaxed">
                  {update.description}
                </p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
