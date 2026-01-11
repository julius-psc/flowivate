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

  const styles = {
    success: {
      bg: "bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/50",
      text: "text-green-700 dark:text-green-300",
      icon: <CheckCircle2 size={16} className="text-green-500 dark:text-green-400" />,
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/50",
      text: "text-red-700 dark:text-red-300",
      icon: <AlertCircle size={16} className="text-red-500 dark:text-red-400" />,
    },
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/50",
      text: "text-blue-700 dark:text-blue-300",
      icon: <Info size={16} className="text-blue-500 dark:text-blue-400" />,
    },
  };

  const current = styles[statusMessage.type];

  return (
    <div
      className={`fixed bottom-5 right-5 z-[11000] px-4 py-3 rounded-xl border ${current.bg} flex items-center gap-3 max-w-sm shadow-lg dark:shadow-2xl backdrop-blur-sm`}
      role="status"
      aria-live="polite"
    >
      <span className="flex-shrink-0">{current.icon}</span>
      <span className={`text-[13px] font-medium ${current.text} flex-grow`}>
        {statusMessage.message}
      </span>
      <button
        onClick={clearStatusMessage}
        className="p-1 rounded-md text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-900/5 dark:hover:bg-zinc-100/5 flex-shrink-0 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}