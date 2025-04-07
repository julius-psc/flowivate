import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  IconCoffee,
  IconTarget,
  IconAdjustmentsAlt,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";

type PomodoroMode = "focus" | "shortBreak" | "longBreak";

interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakAfter: number;
}

const ProgressCircle = React.memo(
  ({ progress, color, applyTransition }: { progress: number; color: string; applyTransition: boolean }) => (
    <circle
      cx="50"
      cy="50"
      r="45"
      className={`fill-none stroke-[6] ${
        applyTransition ? "transition-[stroke-dashoffset] duration-1000 ease-linear" : ""
      }`}
      stroke={color}
      strokeDasharray="283"
      strokeDashoffset={283 - (283 * progress) / 100}
      transform="rotate(-90 50 50)"
    />
  )
);
ProgressCircle.displayName = "ProgressCircle";

const Pomodoro: React.FC = () => {
  const [settings, setSettings] = useState<PomodoroSettings>({
    focusTime: 25 * 60,
    shortBreakTime: 5 * 60,
    longBreakTime: 15 * 60,
    longBreakAfter: 4,
  });

  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focusTime);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const { data: session } = useSession();

  const getTotalTime = useCallback(() => {
    switch (mode) {
      case "focus":
        return settings.focusTime;
      case "shortBreak":
        return settings.shortBreakTime;
      case "longBreak":
        return settings.longBreakTime;
      default:
        return settings.focusTime;
    }
  }, [mode, settings]);

  // Fetch settings and sessions on mount
  useEffect(() => {
    const fetchPomodoroData = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch("/api/features/pomodoro", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            setSettings(data.settings);
            setSessions(data.focusSessions);
          } else {
            console.error("Failed to fetch pomodoro data");
          }
        } catch (error) {
          console.error("Error fetching pomodoro data:", error);
        }
      }
    };

    fetchPomodoroData();
  }, [session?.user?.email]);

  // Update timeLeft when mode or settings change
  useEffect(() => {
    setTimeLeft(getTotalTime());
  }, [mode, settings, getTotalTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (mode === "focus") {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        setMode(newSessions % settings.longBreakAfter === 0 ? "longBreak" : "shortBreak");

        // Increment focus session count on the server
        if (session?.user?.email) {
          fetch("/api/features/pomodoro", {
            method: "PUT",
            credentials: "include",
          }).catch((error) => console.error("Error incrementing focus session:", error));
        }
      } else {
        setMode("focus");
      }
      setIsActive(false);
    }
    return () => interval && clearInterval(interval);
  }, [isActive, timeLeft, mode, sessions, settings, session?.user?.email]);

  const toggleTimer = () => setIsActive(!isActive);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getTotalTime());
  };
  const switchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(settings[newMode === "focus" ? "focusTime" : newMode === "shortBreak" ? "shortBreakTime" : "longBreakTime"]);
  };

  const progress = (timeLeft / getTotalTime()) * 100;
  const currentPomo = sessions % settings.longBreakAfter;

  const modeColors = {
    focus: {
      main: "bg-primary-blue",
      light: "bg-primary-blue",
      hover: "hover:bg-primary-blue",
      text: "text-primary-black dark:text-gray-200",
      ring: "focus:ring-primary-blue",
      progress: "#3A6EC8",
    },
    shortBreak: {
      main: "bg-primary-red",
      light: "bg-primary-red",
      hover: "hover:bg-primary-red",
      text: "text-primary-red",
      ring: "focus:ring-primary-red",
      progress: "#ED6D68",
    },
    longBreak: {
      main: "bg-primary-green",
      light: "bg-primary-green",
      hover: "hover:bg-primary-green",
      text: "text-primary-green",
      ring: "focus:ring-primary-green",
      progress: "#48AC5C",
    },
  };

  const currentColor = modeColors[mode];

  const handleSettingsSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const newSettings = {
      focusTime: Math.min(60, Math.max(1, parseInt(form.focusTime.value))) * 60,
      shortBreakTime: Math.min(30, Math.max(1, parseInt(form.shortBreakTime.value))) * 60,
      longBreakTime: Math.min(60, Math.max(5, parseInt(form.longBreakTime.value))) * 60,
      longBreakAfter: Math.min(10, Math.max(1, parseInt(form.longBreakAfter.value))),
    };
    setSettings(newSettings);
    setTimeLeft(newSettings[mode === "focus" ? "focusTime" : mode === "shortBreak" ? "shortBreakTime" : "longBreakTime"]);
    setShowSettings(false);

    if (session?.user?.email) {
      try {
        const response = await fetch("/api/features/pomodoro", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ settings: newSettings }),
          credentials: "include",
        });
        if (!response.ok) {
          console.error("Failed to save pomodoro settings on the server");
        }
      } catch (error) {
        console.error("Error saving pomodoro settings:", error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      {/* Mode Selector */}
      <div className="flex w-full rounded-lg bg-gray-100 dark:bg-gray-700 p-1 mb-6">
        <button
          onClick={() => switchMode("focus")}
          className={`flex-1 py-2 rounded-md cursor-pointer text-sm font-medium transition-all ${
            mode === "focus"
              ? `${currentColor.main} text-white`
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Focus
        </button>
        <button
          onClick={() => switchMode("shortBreak")}
          className={`flex-1 py-2 rounded-md cursor-pointer text-sm font-medium transition-all ${
            mode === "shortBreak"
              ? `${modeColors.shortBreak.main} text-white`
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Short Break
        </button>
        <button
          onClick={() => switchMode("longBreak")}
          className={`flex-1 py-2 rounded-md cursor-pointer text-sm font-medium transition-all ${
            mode === "longBreak"
              ? `${modeColors.longBreak.main} text-white`
              : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Long Break
        </button>
      </div>

      {/* Main Content */}
      {!showSettings ? (
        <>
          {/* Timer */}
          <div key={`timer-${mode}`} className="relative w-64 h-64 mb-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="fill-none stroke-gray-100 dark:stroke-gray-700 stroke-[6]"
              />
              <ProgressCircle progress={progress} color={currentColor.progress} applyTransition={isActive} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-gray-800 dark:text-gray-200">
                {formatTime(timeLeft)}
              </span>
              <div className="flex mt-2 items-center">
                {mode === "focus" ? (
                  <IconTarget className="w-4 h-4 mr-1 text-primary-blue" />
                ) : mode === "shortBreak" ? (
                  <IconCoffee className="w-4 h-4 mr-1 text-primary-red" />
                ) : (
                  <IconCoffee className="w-4 h-4 mr-1 text-primary-green" />
                )}
                <span className={`text-sm font-medium ${currentColor.text}`}>
                  {mode === "focus" ? "Focus" : mode === "shortBreak" ? "Short Break" : "Long Break"}
                </span>
              </div>
            </div>
          </div>

          {/* Session Indicators */}
          <div className="flex gap-2 mb-6">
            {[...Array(settings.longBreakAfter)].map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  i < currentPomo || (sessions > 0 && i === 0 && currentPomo === 0)
                    ? currentColor.main
                    : "bg-gray-200 dark:bg-gray-600"
                } ${i === currentPomo && mode === "focus" && isActive ? "animate-pulse" : ""}`}
              />
            ))}
          </div>
        </>
      ) : (
        /* Modern Settings Form */
        <form id="settingsForm" onSubmit={handleSettingsSave} className="w-full space-y-6 mb-6">
          {[
            { name: "focusTime", label: "Focus Time (min)", value: settings.focusTime / 60, min: 1, max: 60 },
            { name: "shortBreakTime", label: "Short Break (min)", value: settings.shortBreakTime / 60, min: 1, max: 30 },
            { name: "longBreakTime", label: "Long Break (min)", value: settings.longBreakTime / 60, min: 5, max: 60 },
            { name: "longBreakAfter", label: "Long Break After", value: settings.longBreakAfter, min: 1, max: 10 },
          ].map((field) => (
            <div key={field.name} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {field.label}
              </label>
              <input
                type="number"
                name={field.name}
                defaultValue={field.value}
                min={field.min}
                max={field.max}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-blue focus:border-transparent transition-all duration-200"
              />
            </div>
          ))}
        </form>
      )}

      {/* Controls */}
      <div className="flex gap-4 items-center">
        {!showSettings && (
          <>
            <button
              onClick={toggleTimer}
              className={`p-4 text-white cursor-pointer ${currentColor.main} ${currentColor.hover} rounded-full transition-colors ${currentColor.ring} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
            >
              {isActive ? <IconPlayerPause className="w-6 h-6" /> : <IconPlayerPlay className="w-6 h-6" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Reset
            </button>
          </>
        )}
        {showSettings && (
          <>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settingsForm"
              className="px-4 py-2 text-white bg-primary-blue hover:bg-primary-blue-dark dark:bg-primary-blue-dark dark:hover:bg-primary-blue rounded-lg transition-colors"
            >
              Save
            </button>
          </>
        )}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <IconAdjustmentsAlt className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pomodoro;