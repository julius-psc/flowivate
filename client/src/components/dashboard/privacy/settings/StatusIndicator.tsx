import React from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { StatusMessage, StylingClasses } from "./types";

interface StatusIndicatorProps {
  statusMessage: StatusMessage;
  clearStatusMessage: () => void;
  styling: StylingClasses;
}

const StatusIndicator = ({
  statusMessage,
  clearStatusMessage,
}: StatusIndicatorProps): React.JSX.Element | null => {
  if (!statusMessage.type || !statusMessage.message) return null;

  const bgColors = {
    success:
      "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800",
    error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800",
    info: "bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/50",
  };
  const textColors = {
    success: "text-green-700 dark:text-green-300",
    error: "text-red-700 dark:text-red-300",
    info: "text-primary dark:text-primary/70",
  };
  const icons = {
    success: (
      <CheckCircle2
        size={18}
        className="text-green-500 dark:text-green-400 flex-shrink-0"
      />
    ),
    error: (
      <AlertCircle
        size={18}
        className="text-red-500 dark:text-red-400 flex-shrink-0"
      />
    ),
    info: (
      <AlertCircle
        size={18}
        className="text-primary dark:text-primary/70 flex-shrink-0"
      />
    ),
  };

  return (
    <div
      className={`fixed bottom-4 right-4 z-[11000] px-4 py-2 rounded-md border ${
        bgColors[statusMessage.type]
      } flex items-start space-x-2 max-w-sm shadow-md dark:shadow-lg`}
      role="alert"
      aria-live="assertive"
    >
      {icons[statusMessage.type]}
      <span
        className={`text-sm font-medium ${textColors[statusMessage.type]} flex-grow`}
      >
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
};

export default StatusIndicator;