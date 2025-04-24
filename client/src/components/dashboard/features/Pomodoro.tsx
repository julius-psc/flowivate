import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  IconCup,
  IconBrain,
  IconSettings,
  IconPlayerPlayFilled,
  IconPlayerPauseFilled,
  IconRefresh,
  IconPlant,
  IconX,
  IconPlus,
  IconMinus,
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
  const settingsFormRef = useRef<HTMLFormElement>(null);

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
      if (session?.user?.id) {
        try {
          const response = await fetch("/api/features/pomodoro", {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            const fetchedSettings = {
              focusTime: Math.max(60, Math.min(3600, Number(data.settings?.focusTime) || settings.focusTime)),
              shortBreakTime: Math.max(60, Math.min(1800, Number(data.settings?.shortBreakTime) || settings.shortBreakTime)),
              longBreakTime: Math.max(300, Math.min(3600, Number(data.settings?.longBreakTime) || settings.longBreakTime)),
              longBreakAfter: Math.max(1, Math.min(10, Number(data.settings?.longBreakAfter) || settings.longBreakAfter)),
            };
            setSettings(fetchedSettings);
            setSessions(Number(data.focusSessions) || 0);
            setTimeLeft(fetchedSettings.focusTime);
          } else {
            console.error("Failed to fetch pomodoro data, using defaults.");
            setTimeLeft(settings.focusTime);
          }
        } catch (error) {
          console.error("Error fetching pomodoro data:", error);
          setTimeLeft(settings.focusTime);
        }
      } else {
        setTimeLeft(settings.focusTime);
      }
    };
    fetchPomodoroData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Update timeLeft when mode or settings change
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(getTotalTime());
    }
  }, [mode, settings, getTotalTime, isActive]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (mode === "focus") {
        const newSessions = sessions + 1;
        setSessions(newSessions);
        // Use a small timeout to prevent UI glitch when changing modes
        setTimeout(() => {
          const nextMode = newSessions % settings.longBreakAfter === 0 ? "longBreak" : "shortBreak";
          setMode(nextMode);
        }, 50);

        if (session?.user?.id) {
          fetch("/api/features/pomodoro", {
            method: "PUT",
            credentials: "include",
          }).catch((error) => console.error("Error incrementing focus session:", error));
        }
      } else {
        setTimeout(() => {
          setMode("focus");
        }, 50);
      }
    }
    return () => interval && clearInterval(interval);
  }, [isActive, timeLeft, mode, sessions, settings, session?.user?.id, getTotalTime]);

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
    if (newMode !== mode) {
      setIsActive(false);
      setMode(newMode);
    }
  };

  const progress = timeLeft > 0 ? (timeLeft / getTotalTime()) * 100 : 0;

  // Define colors using theme variable names
  const modeColors = {
    focus: {
      main: "bg-primary-blue",
      hover: "hover:bg-primary-blue/90",
      text: "text-primary-blue",
      ring: "focus:ring-primary-blue/30",
      progress: "#0075C4", // --color-primary-blue hex value
      iconColor: "text-primary-blue",
      lightBg: "bg-primary-blue/10",
    },
    shortBreak: {
      main: "bg-third-red",
      hover: "hover:bg-third-red/90",
      text: "text-third-red",
      ring: "focus:ring-third-red/30",
      progress: "#FF3D00", // --color-third-red hex value
      iconColor: "text-third-red",
      lightBg: "bg-third-red/10",
    },
    longBreak: {
      main: "bg-third-green",
      hover: "hover:bg-third-green/90",
      text: "text-third-green",
      ring: "focus:ring-third-green/30",
      progress: "#4ED454", // --color-third-green hex value
      iconColor: "text-third-green",
      lightBg: "bg-third-green/10",
    },
  };

  const currentColor = modeColors[mode];

  // Mode icons
  const modeIcons = {
    focus: <IconBrain size={16} />,
    shortBreak: <IconCup size={16} />,
    longBreak: <IconPlant size={16} />,
  };

  // Settings handlers
  const handleSettingChange = (setting: keyof PomodoroSettings, value: number) => {
    const limits = {
      focusTime: { min: 1, max: 60, multiplier: 60 },
      shortBreakTime: { min: 1, max: 30, multiplier: 60 },
      longBreakTime: { min: 5, max: 60, multiplier: 60 },
      longBreakAfter: { min: 1, max: 10, multiplier: 1 },
    };
    
    const { min, max, multiplier } = limits[setting];
    const newValue = Math.max(min, Math.min(max, value)) * multiplier;
    
    return newValue;
  };

  // Settings Save Handler
  const handleSettingsSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newSettings: PomodoroSettings = {
      focusTime: handleSettingChange('focusTime', Number(formData.get('focusTime'))),
      shortBreakTime: handleSettingChange('shortBreakTime', Number(formData.get('shortBreakTime'))),
      longBreakTime: handleSettingChange('longBreakTime', Number(formData.get('longBreakTime'))),
      longBreakAfter: handleSettingChange('longBreakAfter', Number(formData.get('longBreakAfter'))),
    };

    if (JSON.stringify(newSettings) !== JSON.stringify(settings)) {
      setSettings(newSettings);
      setIsActive(false);
    }
    setShowSettings(false);

    if (session?.user?.id) {
      try {
        const response = await fetch("/api/features/pomodoro", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
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

  // Handle clicks outside settings form
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSettings && settingsFormRef.current && !settingsFormRef.current.contains(event.target as Node)) {
        const settingsButton = document.getElementById('pomodoro-settings-toggle');
        if (!settingsButton || !settingsButton.contains(event.target as Node)) {
          setShowSettings(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettings]);

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">FOCUS TIMER</h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-col space-y-6 flex-1">
        {!showSettings ? (
          <>
            {/* Mode Selector - Top */}
            <div className="grid grid-cols-3 gap-2">
              {["focus", "shortBreak", "longBreak"].map((timerMode) => (
                <button
                  key={timerMode}
                  onClick={() => switchMode(timerMode as PomodoroMode)}
                  className={`
                    py-2 text-xs font-medium transition-colors rounded-lg
                    ${mode === timerMode 
                      ? `${modeColors[timerMode as PomodoroMode].lightBg} ${modeColors[timerMode as PomodoroMode].text}`
                      : "text-accent-grey-hover dark:text-secondary-white/70 hover:bg-accent-lightgrey/10 dark:hover:bg-accent-grey/10"
                    }
                  `}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-1.5">
                      {modeIcons[timerMode as PomodoroMode]}
                    </span>
                    {timerMode === "focus" ? "Focus" : timerMode === "shortBreak" ? "Short Break" : "Long Break"}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Timer Display */}
            <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
              {/* Modern Timer Display */}
              <div className="flex flex-col items-center w-full">
                <div className="text-4xl font-bold text-secondary-black dark:text-secondary-white tabular-nums mb-2">
                  {formatTime(timeLeft)}
                </div>
                
                {/* Linear Progress Bar - More rounded */}
                <div className="w-full h-2 bg-accent-lightgrey/20 dark:bg-accent-grey/20 rounded-full">
                  <div 
                    className={`h-full ${currentColor.main} rounded-full transition-all duration-300 ease-linear`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                
                {/* Session Counter - Circular */}
                <div className="mt-3 flex items-center">
                  <span className="text-xs text-secondary-black/60 dark:text-secondary-white/60 mr-2">
                    Session {(sessions % settings.longBreakAfter) + 1}/{settings.longBreakAfter}
                  </span>
                  <div className="flex space-x-1.5">
                    {[...Array(Math.min(settings.longBreakAfter, 8))].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2.5 h-2.5 rounded-full ${
                          i < sessions % settings.longBreakAfter || (sessions > 0 && sessions % settings.longBreakAfter === 0 && i < settings.longBreakAfter)
                            ? currentColor.main
                            : "bg-accent-lightgrey/30 dark:bg-accent-grey/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center w-full space-x-4">
                <button
                  onClick={resetTimer}
                  aria-label="Reset Timer"
                  className="p-2 text-accent-grey-hover dark:text-accent-grey hover:text-secondary-black dark:hover:text-secondary-white bg-accent-lightgrey/10 dark:bg-accent-grey/10 hover:bg-accent-lightgrey/20 dark:hover:bg-accent-grey/20 transition-colors rounded-full focus:outline-none"
                >
                  <IconRefresh size={18} />
                </button>
                
                <button
                  onClick={toggleTimer}
                  aria-label={isActive ? "Pause Timer" : "Start Timer"}
                  className={`px-6 py-2 text-secondary-white ${currentColor.main} ${currentColor.hover} rounded-full transition-colors focus:outline-none focus:ring-1 ${currentColor.ring}`}
                >
                  <div className="flex items-center justify-center">
                    {isActive ? <IconPlayerPauseFilled size={18} className="mr-1.5" /> : <IconPlayerPlayFilled size={18} className="mr-1.5" />}
                    <span className="text-sm font-medium">{isActive ? "Pause" : "Start"}</span>
                  </div>
                </button>
                
                <button
                  id="pomodoro-settings-toggle"
                  onClick={() => setShowSettings(!showSettings)}
                  aria-label="Open Settings"
                  className="p-2 text-accent-grey-hover dark:text-accent-grey hover:text-secondary-black dark:hover:text-secondary-white bg-accent-lightgrey/10 dark:bg-accent-grey/10 hover:bg-accent-lightgrey/20 dark:hover:bg-accent-grey/20 transition-colors rounded-full focus:outline-none"
                >
                  <IconSettings size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <form
            ref={settingsFormRef}
            id="pomodoroSettingsForm"
            onSubmit={handleSettingsSave}
            className="w-full h-full flex flex-col animate-fade"
          >
            <div className="flex justify-between items-center border-b border-accent-lightgrey/20 dark:border-accent-grey/20 pb-3 mb-4">
              <h3 className="text-base font-medium text-secondary-black dark:text-secondary-white">Timer Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-accent-grey-hover dark:text-accent-grey hover:text-secondary-black dark:hover:text-secondary-white rounded-full p-1 hover:bg-accent-lightgrey/10 dark:hover:bg-accent-grey/10"
              >
                <IconX size={16} />
              </button>
            </div>
            
            <div className="space-y-5 flex-1">
              {[
                { name: "focusTime", label: "Focus Duration (minutes)", value: settings.focusTime / 60, min: 1, max: 120 },
                { name: "shortBreakTime", label: "Short Break (minutes)", value: settings.shortBreakTime / 60, min: 1, max: 30 },
                { name: "longBreakTime", label: "Long Break (minutes)", value: settings.longBreakTime / 60, min: 5, max: 60 },
                { name: "longBreakAfter", label: "Sessions Before Long Break", value: settings.longBreakAfter, min: 1, max: 10 },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label htmlFor={field.name} className="text-xs font-medium text-secondary-black dark:text-secondary-white mb-2">
                    {field.label}
                  </label>
                  <div className="flex items-center justify-between bg-accent-lightgrey/10 dark:bg-accent-grey/10 rounded-lg p-3">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(field.name) as HTMLInputElement;
                        if (input) {
                          const newValue = Math.max(field.min, parseInt(input.value) - 1);
                          input.value = newValue.toString();
                        }
                      }}
                      className="p-1 rounded-full bg-accent-lightgrey/20 dark:bg-accent-grey/20 text-secondary-black dark:text-secondary-white hover:bg-accent-lightgrey/30 dark:hover:bg-accent-grey/30"
                    >
                      <IconMinus size={16} />
                    </button>
                    
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      defaultValue={field.value}
                      min={field.min}
                      max={field.max}
                      className="w-16 text-center bg-transparent text-secondary-black dark:text-secondary-white font-medium text-lg focus:outline-none"
                    />
                    
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById(field.name) as HTMLInputElement;
                        if (input) {
                          const newValue = Math.min(field.max, parseInt(input.value) + 1);
                          input.value = newValue.toString();
                        }
                      }}
                      className="p-1 rounded-full bg-accent-lightgrey/20 dark:bg-accent-grey/20 text-secondary-black dark:text-secondary-white hover:bg-accent-lightgrey/30 dark:hover:bg-accent-grey/30"
                    >
                      <IconPlus size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-accent-grey-hover dark:text-accent-grey mt-1 px-1">
                    <span>Min: {field.min}</span>
                    <span>Max: {field.max}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-accent-lightgrey/20 dark:border-accent-grey/20 mt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs font-medium text-accent-grey-hover dark:text-accent-grey bg-accent-lightgrey/10 dark:bg-accent-grey/10 rounded-lg hover:bg-accent-lightgrey/20 dark:hover:bg-accent-grey/20 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-secondary-white bg-primary-blue hover:bg-primary-blue/90 rounded-lg transition-colors focus:outline-none"
              >
                Apply Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Pomodoro;