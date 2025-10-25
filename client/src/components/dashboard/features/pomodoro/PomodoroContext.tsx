"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "sonner";

export type PomodoroMode = "focus" | "shortBreak" | "longBreak";

export interface PomodoroSettings {
  focusTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  longBreakAfter: number;
}

interface PomodoroContextType {
  settings: PomodoroSettings;
  mode: PomodoroMode;
  timeLeft: number;
  isActive: boolean;
  sessions: number;
  isLoading: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  resetRound: () => void; // Added for the new reset logic
  switchMode: (m: PomodoroMode) => void;
  formatTime: (sec?: number) => string;
  progress: number;
  saveSettings: (s: PomodoroSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(
  undefined
);
export const usePomodoroContext = (): PomodoroContextType => {
  const ctx = useContext(PomodoroContext);
  if (!ctx)
    throw new Error("usePomodoroContext must be inside PomodoroProvider");
  return ctx;
};

export function PomodoroProvider({
  children,
  enabled,
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  // Mock session for preview
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  useEffect(() => {
    if (enabled) {
      setSession({ user: { id: "mock-user-id" } });
    }
  }, [enabled]);
  // const { data: session } = useSession(); // Real implementation

  const FOCUS_DEFAULT = 25 * 60;
  const SHORT_BREAK_DEFAULT = 5 * 60;
  const LONG_BREAK_DEFAULT = 15 * 60;
  const LONG_AFTER_DEFAULT = 4;

  const [settings, setSettings] = useState<PomodoroSettings>({
    focusTime: FOCUS_DEFAULT,
    shortBreakTime: SHORT_BREAK_DEFAULT,
    longBreakTime: LONG_BREAK_DEFAULT,
    longBreakAfter: LONG_AFTER_DEFAULT,
  });
  const [mode, setMode] = useState<PomodoroMode>("focus");
  const [timeLeft, setTimeLeft] = useState(settings.focusTime);
  const [isActive, setIsActive] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const endTimeRef = useRef<number | null>(null);

  const getTotal = useCallback((): number => {
    switch (mode) {
      case "shortBreak":
        return settings.shortBreakTime;
      case "longBreak":
        return settings.longBreakTime;
      default:
        return settings.focusTime;
    }
  }, [mode, settings]);

  // 1) Load server settings + attempt resume
  useEffect(() => {
    if (!enabled) return;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (session?.user?.id) {
          const res = await fetch("/api/features/pomodoro", {
            credentials: "include",
          });
          if (res.ok) {
            const data = await res.json();
            const s: PomodoroSettings = {
              focusTime: Math.max(
                60,
                Math.min(3600 * 2, Number(data.settings?.focusTime) || 0)
              ),
              shortBreakTime: Math.max(
                60,
                Math.min(1800, Number(data.settings?.shortBreakTime) || 0)
              ),
              longBreakTime: Math.max(
                300,
                Math.min(3600, Number(data.settings?.longBreakTime) || 0)
              ),
              longBreakAfter: Math.max(
                1,
                Math.min(10, Number(data.settings?.longBreakAfter) || 0)
              ),
            };
            setSettings(s);
            setSessions(Number(data.focusSessions) || 0);

            const saved = localStorage.getItem("pomodoroEndTime");
            if (saved) {
              const end = Number(saved);
              const rem = Math.round((end - Date.now()) / 1000);
              if (rem > 0) {
                endTimeRef.current = end;
                setTimeLeft(rem);
                setIsActive(true);
                setIsLoading(false);
                return;
              }
              localStorage.removeItem("pomodoroEndTime");
            }
            setTimeLeft(s.focusTime);
          } else {
            toast.error("Failed to load Pomodoro settings, using defaults.");
            setTimeLeft(settings.focusTime);
          }
        } else {
          setTimeLeft(settings.focusTime);
        }
      } catch (err) {
        toast.error(
          `Error loading Pomodoro: ${
            err instanceof Error ? err.message : "unknown"
          }`
        );
        setTimeLeft(settings.focusTime);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [enabled, session?.user?.id, settings.focusTime]);

  // 2) Persist endTime when active
  useEffect(() => {
    if (!enabled) return;
    if (isActive && endTimeRef.current) {
      localStorage.setItem("pomodoroEndTime", endTimeRef.current.toString());
    } else {
      localStorage.removeItem("pomodoroEndTime");
    }
  }, [enabled, isActive]);

  // 3) Reset on mode/settings change
  useEffect(() => {
    if (!enabled) return;
    endTimeRef.current = null;
    setTimeLeft(getTotal());
    setIsActive(false);
  }, [enabled, mode, settings, getTotal]);

  // 4) *** REPLACED TIMER LOGIC ***
  // Tick every 250ms when active, using timestamp diff to stay accurate
  useEffect(() => {
    if (!enabled || !isActive) {
      return;
    }

    if (!endTimeRef.current) {
      console.warn("Timer started without endTimeRef.");
      setIsActive(false);
      return;
    }

    // Initial tick to update immediately
    const rem = Math.floor((endTimeRef.current! - Date.now()) / 1000);
    setTimeLeft(Math.max(0, rem));

    const interval = setInterval(() => {
      const rem = Math.floor((endTimeRef.current! - Date.now()) / 1000);

      if (rem < 0) {
        // Time's up. Let hook 5 handle it.
        // We just set to 0 and clear.
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(rem);
      }
    }, 250); // Check 4 times a second for responsiveness

    return () => clearInterval(interval);
  }, [enabled, isActive]);

  // 5) When timeLeft hits zero → swap mode, increment sessions
  useEffect(() => {
    if (!enabled || timeLeft > 0) return;
    setIsActive(false);
    endTimeRef.current = null;

    if (mode === "focus") {
      const nextCount = sessions + 1;
      setSessions(nextCount);
      const nextMode =
        nextCount % settings.longBreakAfter === 0 ? "longBreak" : "shortBreak";
      setTimeout(() => {
        setMode(nextMode);
        toast.info(
          nextMode === "longBreak"
            ? "Time for a long break!"
            : "Time for a short break!"
        );
      }, 50);
      if (session?.user?.id) {
        fetch("/api/features/pomodoro", {
          method: "PUT",
          credentials: "include",
        }).catch(() => toast.error("Failed to sync focus session to server."));
      }
    } else {
      setTimeout(() => {
        setMode("focus");
        toast.info("Back to focus!");
      }, 50);
    }
  }, [
    enabled,
    timeLeft,
    sessions,
    mode,
    settings.longBreakAfter,
    session?.user?.id,
  ]);

  // Controls
  const start = () => {
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsActive(true);
  };
  const pause = () => setIsActive(false);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(getTotal());
    endTimeRef.current = null;
  };

  const resetRound = () => {
    setSessions(0);
    if (mode !== "focus") {
      switchMode("focus");
    } else {
      reset();
    }
  };

  const switchMode = (m: PomodoroMode) => {
    if (m !== mode) {
      setIsActive(false);
      setMode(m);
      endTimeRef.current = null;
    }
  };
  const formatTime = (sec = timeLeft) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const progress = (timeLeft / getTotal()) * 100;

  const saveSettings = (s: PomodoroSettings) => {
    setSettings(s);
    setIsActive(false);
    endTimeRef.current = null;
    if (session?.user?.id) {
      fetch("/api/features/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: s }),
        credentials: "include",
      })
        .then((r) => {
          if (!r.ok) throw new Error();
          toast.success("Settings saved!");
        })
        .catch(() => toast.error("Failed to save settings."));
    }
  };

  return (
    <PomodoroContext.Provider
      value={{
        settings,
        mode,
        timeLeft,
        isActive,
        sessions,
        isLoading,
        start,
        pause,
        reset,
        resetRound, // Added
        switchMode,
        formatTime,
        progress,
        saveSettings,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}