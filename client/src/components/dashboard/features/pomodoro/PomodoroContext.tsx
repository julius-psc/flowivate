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
import { useGlobalStore } from "@/hooks/useGlobalStore";


// Web Audio API Ping
const playPing = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880; // A5
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

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
  dailySessions: number;
  isLoading: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  resetRound: () => void;
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
  const [session, setSession] = useState<{ user: { id: string } } | null>(null);
  useEffect(() => {
    if (enabled) {
      setSession({ user: { id: "mock-user-id" } });
    }
  }, [enabled]);

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
  const [dailySessions, setDailySessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const endTimeRef = useRef<number | null>(null);

  // Load daily sessions from localStorage on mount
  useEffect(() => {
    if (!enabled) return;
    const stored = localStorage.getItem("pomodoroDailySessions");
    const storedDate = localStorage.getItem("pomodoroDailyDate");
    const today = new Date().toDateString();

    if (stored && storedDate === today) {
      setDailySessions(Number(stored) || 0);
    } else {
      // Reset if it's a new day
      localStorage.setItem("pomodoroDailySessions", "0");
      localStorage.setItem("pomodoroDailyDate", today);
      setDailySessions(0);
    }
  }, [enabled]);

  const triggerLumoEvent = useGlobalStore((state) => state.triggerLumoEvent);
  const appCommand = useGlobalStore((state) => state.appCommand);
  const clearAppCommand = useGlobalStore((state) => state.clearAppCommand);

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

  const start = () => {
    let newTimeLeft = timeLeft;
    if (newTimeLeft <= 0) {
      newTimeLeft = getTotal();
      setTimeLeft(newTimeLeft);
    }
    endTimeRef.current = Date.now() + newTimeLeft * 1000;
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

  useEffect(() => {
    if (!appCommand) return;

    switch (appCommand) {
      case "START_BREAK":
        if (mode !== "shortBreak" && mode !== "longBreak") {
          switchMode("shortBreak");
          const newTimeLeft = settings.shortBreakTime;
          setTimeLeft(newTimeLeft);
          endTimeRef.current = Date.now() + newTimeLeft * 1000;
          setIsActive(true);
        } else if (!isActive) {
          start();
        }
        break;
      case "START_TIMER":
        if (mode !== "focus") {
          switchMode("focus");
          const newTimeLeft = settings.focusTime;
          setTimeLeft(newTimeLeft);
          endTimeRef.current = Date.now() + newTimeLeft * 1000;
          setIsActive(true);
        } else if (!isActive) {
          start();
        }
        break;
    }
  }, [
    appCommand,
    mode,
    isActive,
    settings.shortBreakTime,
    settings.focusTime,
  ]);

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
          `Error loading Pomodoro: ${err instanceof Error ? err.message : "unknown"
          }`
        );
        setTimeLeft(settings.focusTime);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [enabled, session?.user?.id]); // Removed settings.focusTime dependency to avoid reset loop

  useEffect(() => {
    if (!enabled) return;
    if (isActive && endTimeRef.current) {
      localStorage.setItem("pomodoroEndTime", endTimeRef.current.toString());
    } else {
      localStorage.removeItem("pomodoroEndTime");
    }
  }, [enabled, isActive]);

  useEffect(() => {
    if (!enabled) return;

    if (appCommand) {
      clearAppCommand();
      return;
    }

    endTimeRef.current = null;
    setTimeLeft(getTotal());
    setIsActive(false);
  }, [enabled, mode, settings, getTotal, appCommand, clearAppCommand]);

  useEffect(() => {
    if (!enabled || !isActive) {
      return;
    }

    if (!endTimeRef.current) {
      setIsActive(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const rem = Math.ceil((endTimeRef.current! - now) / 1000);

      if (rem <= 0) {
        // Timer Finished
        setTimeLeft(0);
        setIsActive(false);
        endTimeRef.current = null;
        clearInterval(interval);

        playPing();

        if (mode === "focus") {
          const nextCount = sessions + 1;
          setSessions(nextCount);

          // Increment daily sessions
          const newDaily = dailySessions + 1;
          setDailySessions(newDaily);
          localStorage.setItem("pomodoroDailySessions", newDaily.toString());
          localStorage.setItem("pomodoroDailyDate", new Date().toDateString());

          triggerLumoEvent("POMO_FINISHED");

          const isLongBreakDue = nextCount >= settings.longBreakAfter;
          const nextMode = isLongBreakDue ? "longBreak" : "shortBreak";

          toast.success("Focus session complete!");

          if (session?.user?.id) {
            fetch("/api/features/pomodoro", {
              method: "PUT",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dailySessions: newDaily }),
            }).catch(console.error);
          }

          // Auto-switch mode after a delay
          setTimeout(() => {
            setMode(nextMode);
            toast.info(
              isLongBreakDue
                ? "Time for a long break!"
                : "Time for a short break!"
            );
            if (isLongBreakDue) {
              setSessions(0); // Reset round count
            }
          }, 1500);

        } else {
          // Break finished
          toast.info("Break is over! Time to focus.");
          setTimeout(() => {
            setMode("focus");
          }, 1500);
        }

      } else {
        setTimeLeft(rem);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [enabled, isActive, mode, sessions, dailySessions, settings.longBreakAfter, session?.user?.id, triggerLumoEvent]);

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
        dailySessions,
        isLoading,
        start,
        pause,
        reset,
        resetRound,
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