import React, { useState, useEffect, useCallback } from "react";
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

const Pomodoro: React.FC = () => {
  const [settings, setSettings] = useState<PomodoroSettings>({
    focusTime: 10,
    shortBreakTime: 3,
    longBreakTime: 4,
    longBreakAfter: 4,
  });

  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focusTime);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

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

  useEffect(() => {
    setTimeLeft(getTotalTime());
    setIsActive(false);
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
        setMode(
          newSessions % settings.longBreakAfter === 0
            ? "longBreak"
            : "shortBreak"
        );
      } else {
        setMode("focus");
      }
      setIsActive(false);
    }
    return () => interval && clearInterval(interval);
  }, [isActive, timeLeft, mode, sessions, settings]);

  const toggleTimer = () => setIsActive(!isActive);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getTotalTime());
  };
  const switchMode = (newMode: PomodoroMode) => {
    setMode(newMode);
    setIsActive(false);
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

  const handleSettingsSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    setSettings({
      focusTime: parseInt(form.focusTime.value) * 60,
      shortBreakTime: parseInt(form.shortBreakTime.value) * 60,
      longBreakTime: parseInt(form.longBreakTime.value) * 60,
      longBreakAfter: parseInt(form.longBreakAfter.value),
    });
    setShowSettings(false);
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
          <div className="relative w-64 h-64 mb-6">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="fill-none stroke-gray-100 dark:stroke-gray-700 stroke-[6]"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="fill-none stroke-[6] transition-all duration-400 ease-linear"
                stroke={currentColor.progress}
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progress) / 100}
                transform="rotate(-90 50 50)"
              />
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
                  {mode === "focus"
                    ? "Focus"
                    : mode === "shortBreak"
                    ? "Short Break"
                    : "Long Break"}
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
                  i < currentPomo ||
                  (sessions > 0 && i === 0 && currentPomo === 0)
                    ? currentColor.main
                    : "bg-gray-200 dark:bg-gray-600"
                } ${
                  i === currentPomo && mode === "focus" && isActive
                    ? "animate-pulse"
                    : ""
                }`}
              />
            ))}
          </div>
        </>
      ) : (
        /* Settings Form */
        <form onSubmit={handleSettingsSave} className="w-full space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Focus Time (minutes)
            </label>
            <input
              type="number"
              name="focusTime"
              defaultValue={settings.focusTime / 60}
              min="1"
              max="60"
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Short Break (minutes)
            </label>
            <input
              type="number"
              name="shortBreakTime"
              defaultValue={settings.shortBreakTime / 60}
              min="1"
              max="30"
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Long Break (minutes)
            </label>
            <input
              type="number"
              name="longBreakTime"
              defaultValue={settings.longBreakTime / 60}
              min="5"
              max="60"
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Long Break After (sessions)
            </label>
            <input
              type="number"
              name="longBreakAfter"
              defaultValue={settings.longBreakAfter}
              min="1"
              max="10"
              className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-gray-200"
            />
          </div>
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
              {isActive ? (
                <IconPlayerPause className="w-6 h-6" />
              ) : (
                <IconPlayerPlay className="w-6 h-6" />
              )}
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
              className="p-2 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="settingsForm"
              className=" P-2 text-white cursor-pointer bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-md transition-colors"
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