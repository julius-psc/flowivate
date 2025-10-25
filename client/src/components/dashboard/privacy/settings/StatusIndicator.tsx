import React from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { StatusMessage, StylingClasses } from "./types";

interface StatusIndicatorProps {
  statusMessage: StatusMessage;
  clearStatusMessage: () => void;
  styling: StylingClasses;
}

export default function StatusIndicator({
  statusMessage,
  clearStatusMessage,
}: StatusIndicatorProps) {
  if (!statusMessage.type || !statusMessage.message) return null;

  const bg = {
    success:
      "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
  }[statusMessage.type];

  const text = {
    success: "text-green-700 dark:text-green-300",
    error: "text-red-700 dark:text-red-300",
    info: "text-blue-700 dark:text-blue-300",
  }[statusMessage.type];

  const icon =
    statusMessage.type === "success" ? (
      <CheckCircle2
        size={18}
        className="text-green-500 dark:text-green-400 flex-shrink-0"
      />
    ) : statusMessage.type === "error" ? (
      <AlertCircle
        size={18}
        className="text-red-500 dark:text-red-400 flex-shrink-0"
      />
    ) : (
      <Info
        size={18}
        className="text-blue-500 dark:text-blue-400 flex-shrink-0"
      />
    );

  return (
    <div
      className={`fixed bottom-5 right-5 z-[11000] px-4 py-2 rounded-md border ${bg} flex items-start space-x-2 max-w-sm shadow-md dark:shadow-lg`}
      role="status"
      aria-live="polite"
    >
      {icon}
      <span className={`text-sm font-medium ${text} flex-grow`}>
        {statusMessage.message}
      </span>
      <button
        onClick={clearStatusMessage}
        className="ml-auto p-1 -m-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-current"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}