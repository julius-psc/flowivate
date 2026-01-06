"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  Clock,
  X,
  Target,
  Volume2,
  VolumeX,
  ArrowLeft,
  Play,
  Plus,
  Focus,
  CheckCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import * as tasksApi from "../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";
import {
  useAmbientSound,
  AmbientSoundName,
  ambientSoundNames,
} from "@/hooks/useAmbientSound";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { toast } from "sonner";
import { useDashboard } from "@/context/DashboardContext";

type AmbientSoundHookWithVolume = ReturnType<typeof useAmbientSound> & {
  setVolume?: (volume: number) => void;
};

type SetupStep = "idle" | "task" | "duration" | "music" | "active";

interface SelectedTask {
  id: string | "custom";
  name: string;
  source: "list" | "custom";
}

const DURATION_OPTIONS = [25, 50, 75, 90]; // in minutes

const inputClassName =
  "flex-1 rounded-xl border-2 border-slate-300 dark:border-zinc-700 dark:bg-zinc-800/90 px-4 py-3 text-sm transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/20 dark:focus:ring-primary/10 disabled:opacity-60 disabled:cursor-not-allowed";

const DeepWork: React.FC = () => {
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const { triggerDeepWork, clearDeepWorkTrigger } = useDashboard();
  const queryKey = ["tasks", session?.user?.id];
  const componentRef = useRef<HTMLDivElement>(null);

  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [, setIsFullscreen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [customTaskName, setCustomTaskName] = useState("");
  const [showCustomTaskInput, setShowCustomTaskInput] = useState(false);
  const [focusDuration, setFocusDuration] = useState<number>(
    DURATION_OPTIONS[0]
  );
  const [customDurationInput, setCustomDurationInput] = useState<string>("");
  const [isCustomDurationSelected, setIsCustomDurationSelected] =
    useState(false);
  const [endTime, setEndTime] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [volume, setVolume] = useState<number>(0.5);

  const ambientSoundHook = useAmbientSound() as AmbientSoundHookWithVolume;
  const customTaskInputRef = useRef<HTMLInputElement>(null);
  const customDurationInputRef = useRef<HTMLInputElement>(null);

  const isSpecialTheme =
    theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const {
    data: taskLists = [],
    isLoading: isLoadingTasks,
    isError: isErrorTasks,
    error: errorTasks,
  } = useQuery<TaskList[], Error>({
    queryKey: queryKey,
    queryFn: tasksApi.getTaskLists,
    enabled: status === "authenticated" && setupStep === "task",
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const incompleteTasks: Task[] = React.useMemo(() => {
    if (status !== "authenticated" || isLoadingTasks || isErrorTasks) return [];
    return taskLists
      .flatMap((list) => list?.tasks || [])
      .filter((task) => task && !task.completed);
  }, [taskLists, isLoadingTasks, isErrorTasks, status]);

  useEffect(() => {
    if (isErrorTasks && errorTasks) {
      toast.error(
        `Error loading tasks: ${errorTasks.message || "Unknown error"}`
      );
    }
  }, [isErrorTasks, errorTasks]);

  // Listen for external trigger to start Deep Work (from ProactiveAssistant)
  useEffect(() => {
    if (triggerDeepWork) {
      setSetupStep("task");
      clearDeepWorkTrigger();
    }
  }, [triggerDeepWork, clearDeepWorkTrigger]);

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatRemainingTime = (seconds: number): string => {
    if (seconds < 0) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const enterFullscreen = useCallback(() => {
    if (componentRef.current && !document.fullscreenElement) {
      componentRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err);
        toast.error(
          `Fullscreen not available: ${err.message}. Starting normally.`
        );
      });
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch((err) =>
          console.error("Error attempting to exit full-screen mode:", err)
        );
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    setRemainingTime(null);
    setEndTime(null);
  }, [timerIntervalId]);

  const resetState = useCallback(() => {
    stopTimer();
    ambientSoundHook.stopSound();
    exitFullscreen();
    setSelectedTask(null);
    setCustomTaskName("");
    setShowCustomTaskInput(false);
    setFocusDuration(DURATION_OPTIONS[0]);
    setCustomDurationInput("");
    setIsCustomDurationSelected(false);
    setSetupStep("idle");
    setVolume(0.5);
  }, [stopTimer, ambientSoundHook, exitFullscreen]);

  const handleSessionEnd = useCallback(() => {
    const completedTask = selectedTask;
    resetState();
    toast.success("Focus session complete!");
    if (completedTask?.source === "list" && completedTask.id !== "custom") {
      console.log(
        `TODO: Mark task ${completedTask.id} (${completedTask.name}) as complete.`
      );
    }
  }, [resetState, selectedTask]);

  const startTimer = useCallback(() => {
    const durationToUse =
      focusDuration > 0 ? focusDuration : DURATION_OPTIONS[0];
    if (durationToUse <= 0) {
      toast.error("Invalid duration set. Using default.");
      setFocusDuration(DURATION_OPTIONS[0]);
      setSetupStep("duration");
      return;
    }

    if (timerIntervalId) clearInterval(timerIntervalId);
    const durationInSeconds = durationToUse * 60;
    setRemainingTime(durationInSeconds);
    const now = new Date();
    const end = new Date(now.getTime() + durationInSeconds * 1000);
    setEndTime(formatTime(end));
    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev !== null && prev > 1) return prev - 1;
        if (interval) clearInterval(interval);
        setTimerIntervalId(null);
        handleSessionEnd();
        return 0;
      });
    }, 1000);
    setTimerIntervalId(interval);
  }, [focusDuration, timerIntervalId, handleSessionEnd, setSetupStep]);

  const handleStopFocus = useCallback(() => {
    resetState();
    toast.info("Focus session ended.");
  }, [resetState]);

  const handleStartSetup = () => setSetupStep("task");

  const handleSelectTaskListTask = (task: Task) => {
    setSelectedTask({ id: task.id, name: task.name, source: "list" });
    setCustomTaskName("");
    setShowCustomTaskInput(false);
    setSetupStep("duration");
  };

  const handleConfirmCustomTask = () => {
    const trimmedName = customTaskName.trim();
    if (!trimmedName) {
      toast.error("Please enter a name for your focus task.");
      customTaskInputRef.current?.focus();
      return;
    }
    setSelectedTask({ id: "custom", name: trimmedName, source: "custom" });
    setSetupStep("duration");
  };

  const handleSetDurationPreset = (duration: number) => {
    setFocusDuration(duration);
    setIsCustomDurationSelected(false);
    setCustomDurationInput("");
  };

  const handleConfirmCustomDuration = () => {
    const numericValue = parseInt(customDurationInput, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
      setFocusDuration(numericValue);
      setIsCustomDurationSelected(true);
      setSetupStep("music");
    } else if (customDurationInput === "" && !isCustomDurationSelected) {
      setFocusDuration(focusDuration > 0 ? focusDuration : DURATION_OPTIONS[0]);
      setSetupStep("music");
    } else {
      toast.error("Please enter a valid positive number for duration.");
      setIsCustomDurationSelected(true);
      customDurationInputRef.current?.focus();
    }
  };

  const handleCustomDurationChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setCustomDurationInput(value);
    const numericValue = parseInt(value, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
      setFocusDuration(numericValue);
      setIsCustomDurationSelected(true);
    } else if (value === "") {
      const currentPreset = DURATION_OPTIONS.includes(focusDuration)
        ? focusDuration
        : DURATION_OPTIONS[0];
      setFocusDuration(currentPreset);
      setIsCustomDurationSelected(false);
    } else {
      setIsCustomDurationSelected(true);
      setFocusDuration(0);
    }
  };

  const selectCustomDurationInput = () => {
    setIsCustomDurationSelected(true);
  };

  const handleConfirmDurationStep = () => {
    if (isCustomDurationSelected) {
      handleConfirmCustomDuration();
    } else if (focusDuration > 0) {
      setSetupStep("music");
    } else {
      toast.error(
        "Please set a valid focus duration (must be greater than 0)."
      );
    }
  };

  const handleSelectMusic = (soundName: AmbientSoundName) => {
    ambientSoundHook.selectSound(soundName);
  };

  const handleStartFocusSession = useCallback(() => {
    if (!selectedTask || focusDuration <= 0) {
      toast.error("Configuration incomplete. Cannot start focus session.");
      resetState();
      return;
    }
    enterFullscreen();
    startTimer();
    if (
      ambientSoundHook.currentSound &&
      ambientSoundHook.currentSound !== "None"
    ) {
      ambientSoundHook.playSound();
      ambientSoundHook.setVolume?.(volume);
    }
    setSetupStep("active");
    toast.success(`Focus session started for ${selectedTask.name}`);
  }, [
    selectedTask,
    focusDuration,
    enterFullscreen,
    startTimer,
    ambientSoundHook,
    resetState,
    volume,
  ]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (ambientSoundHook.setVolume) {
      ambientSoundHook.setVolume(newVolume);
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
      if (document.fullscreenElement) {
        exitFullscreen();
      }
    };
  }, [timerIntervalId, exitFullscreen]);

  const renderIdle = () => (
    <div className="flex flex-col items-center justify-center gap-6 py-4 w-full h-full">
      <div className="flex flex-col items-center gap-2">
        <div className="relative flex items-center justify-center w-12 h-12">
          <div className="absolute w-12 h-12 rounded-full bg-secondary-white dark:bg-secondary-black" />
          <Focus className="w-6 h-6 text-secondary-black dark:text-secondary-white z-10" />
        </div>
        <h3 className="text-lg font-medium text-secondary-black dark:text-secondary-white">
          Deep Focus
        </h3>
        <p className="text-xs text-primary-black dark:text-gray-300 opacity-70 px-2 text-center">
          A distraction-free environment for your most important work
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={handleStartSetup}
          className="w-full max-w-[220px] px-4 py-3 flex items-center justify-center bg-secondary-black text-white dark:text-gray-200 rounded-lg cursor-pointer transition-colors text-sm hover:bg-gray-800 dark:hover:bg-gray-600"
        >
          Start Focus Session
        </button>
      </div>
    </div>
  );

  const renderTaskSelection = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-secondary-black dark:text-secondary-white">
          Choose Your Task
        </h2>
        <button
          onClick={handleStopFocus}
          aria-label="Close task selection"
          className="p-1.5 text-secondary-black/60 dark:text-secondary-white/60 hover:text-secondary-black dark:hover:text-secondary-white rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-1 max-h-[calc(100%-130px)]">
        {status === "authenticated" && (
          <>
            <h3 className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider mb-1">
              Your Tasks
            </h3>
            {isLoadingTasks && (
              <div className="space-y-2 py-2">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
              </div>
            )}
            {isErrorTasks && errorTasks && (
              <div className="text-red-500 text-sm p-3 rounded-md bg-red-500/10">
                Could not load tasks: {errorTasks.message}
              </div>
            )}
            {!isLoadingTasks &&
              !isErrorTasks &&
              incompleteTasks.length === 0 && (
                <p className="text-secondary-black/60 dark:text-secondary-white/60 text-sm py-2">
                  No incomplete tasks found.
                </p>
              )}
            {!isLoadingTasks &&
              !isErrorTasks &&
              incompleteTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelectTaskListTask(task)}
                  className="w-full text-left p-3 bg-secondary-white dark:bg-secondary-black rounded-md hover:bg-secondary-black/5 dark:hover:bg-secondary-white/10 text-secondary-black dark:text-secondary-white flex items-center group transition-colors"
                  title={task.name}
                >
                  <span className="flex-grow truncate">{task.name}</span>
                </button>
              ))}
          </>
        )}
        {status === "unauthenticated" && (
          <p className="text-secondary-black/60 dark:text-secondary-white/60 text-sm p-3 rounded-md bg-secondary-black/5 dark:bg-secondary-white/5">
            Sign in to select from your saved tasks.
          </p>
        )}
      </div>
      <div className="mt-auto pt-3 pb-4 flex-shrink-0">
        <h3 className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider mb-1.5">
          Custom Task
        </h3>
        {!showCustomTaskInput ? (
          <button
            onClick={() => {
              setShowCustomTaskInput(true);
              setTimeout(() => customTaskInputRef.current?.focus(), 0);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-secondary-white dark:bg-secondary-black rounded-md hover:bg-secondary-black/5 dark:hover:bg-secondary-white/10 text-secondary-black/70 dark:text-secondary-white/70 border border-dashed border-secondary-black/20 dark:border-secondary-white/20 transition-colors"
          >
            <Plus size={16} />
            Add Custom Task
          </button>
        ) : (
          <div className="flex gap-2 w-[95%] mx-auto">
            <input
              ref={customTaskInputRef}
              type="text"
              value={customTaskName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomTaskName(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleConfirmCustomTask();
                } else if (e.key === "Escape") {
                  setShowCustomTaskInput(false);
                  setCustomTaskName("");
                }
              }}
              onBlur={() => {
                if (customTaskName.trim()) {
                } else {
                }
              }}
              placeholder="Enter custom task name"
              className={`${inputClassName} min-w-0 text-secondary-black dark:text-secondary-white`}
            />
          </div>
        )}
      </div>
    </>
  );

  const renderDurationSelection = () => (
    <>
      <div className="flex items-center mb-3">
        <button
          onClick={() => setSetupStep("task")}
          aria-label="Back to task selection"
          className="p-1.5 text-secondary-black/60 dark:text-secondary-white/60 hover:text-secondary-black dark:hover:text-secondary-white rounded-md mr-2 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-secondary-black dark:text-secondary-white">
          Set Duration
        </h2>
      </div>
      <div className="p-3 bg-secondary-black/5 dark:bg-secondary-white/5 rounded-md mb-3">
        <div className="flex items-center">
          <Target
            size={16}
            className="mr-2 text-secondary-black/60 dark:text-secondary-white/60 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-secondary-black/60 dark:text-secondary-white/60">
              Task
            </p>
            <h3
              className="text-sm font-medium text-secondary-black dark:text-secondary-white truncate"
              title={selectedTask?.name}
            >
              {selectedTask?.name || "..."}
            </h3>
          </div>
        </div>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-1 max-h-[calc(100%-150px)]">
        <h3 className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider mb-1">
          Focus Duration (minutes)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => handleSetDurationPreset(duration)}
              className={`p-3 rounded-md text-center transition-all duration-150 text-sm border ${!isCustomDurationSelected && focusDuration === duration
                ? "bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black border-transparent shadow-md ring-1 ring-black/10 dark:ring-white/10"
                : "bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white border-secondary-black/20 dark:border-secondary-white/20 hover:bg-secondary-black/5 dark:hover:bg-secondary-white/10 hover:border-secondary-black/40 dark:hover:border-secondary-white/40"
                }`}
            >
              <div className="font-semibold">{duration}</div>
              <div className="text-xs opacity-70">minutes</div>
            </button>
          ))}
        </div>
        <div className="pt-2">
          <label
            htmlFor="custom-duration"
            className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider block mb-1"
          >
            Custom Duration
          </label>
          <div className="flex gap-2 items-center">
            <input
              ref={customDurationInputRef}
              id="custom-duration"
              type="number"
              min="1"
              value={customDurationInput}
              onChange={handleCustomDurationChange}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleConfirmDurationStep();
                } else if (e.key === "Escape") {
                  const lastPreset = DURATION_OPTIONS.includes(focusDuration)
                    ? focusDuration
                    : DURATION_OPTIONS[0];
                  handleSetDurationPreset(lastPreset);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onFocus={selectCustomDurationInput}
              onBlur={() => {
                const numericValue = parseInt(customDurationInput, 10);
                if (
                  isCustomDurationSelected &&
                  (isNaN(numericValue) || numericValue <= 0) &&
                  customDurationInput !== ""
                ) {
                  toast.error(
                    "Invalid custom duration. Please enter a positive number."
                  );
                } else if (
                  isCustomDurationSelected &&
                  customDurationInput === ""
                ) {
                  handleSetDurationPreset(DURATION_OPTIONS[0]);
                }
              }}
              placeholder="e.g., 45"
              className={`${inputClassName} min-w-0 ${isCustomDurationSelected
                ? "border-primary ring-1 ring-primary/20 dark:ring-primary/10"
                : ""
                }`}
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleConfirmDurationStep}
        disabled={focusDuration <= 0}
        className="mt-auto pt-3 w-full py-3 bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0"
      >
        Next
      </button>
    </>
  );

  const renderMusicSelection = () => (
    <>
      <div className="flex items-center mb-3">
        <button
          onClick={() => setSetupStep("duration")}
          aria-label="Back to duration selection"
          className="p-1.5 text-secondary-black/60 dark:text-secondary-white/60 hover:text-secondary-black dark:hover:text-secondary-white rounded-md mr-2 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-secondary-black dark:text-secondary-white">
          Ambient Sound
        </h2>
      </div>
      <p className="text-sm text-secondary-black/60 dark:text-secondary-white/60 mb-3 flex-shrink-0">
        Select an optional ambient sound to play during your session.
      </p>
      <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[calc(100%-110px)]">
        {ambientSoundNames.map((name) => (
          <button
            key={name}
            onClick={() => handleSelectMusic(name as AmbientSoundName)}
            className={`w-full p-3 rounded-md transition-colors flex items-center justify-between text-sm text-left ${ambientSoundHook.currentSound === name
              ? "bg-secondary-black/10 dark:bg-secondary-white/10 ring-1 ring-inset ring-secondary-black/20 dark:ring-secondary-white/20"
              : "bg-secondary-white dark:bg-secondary-black hover:bg-secondary-black/5 dark:hover:bg-secondary-white/5"
              }`}
          >
            <div className="flex items-center min-w-0">
              <span className="text-lg mr-3 flex-shrink-0">
                {ambientSoundHook.availableSounds[name as AmbientSoundName]
                  ?.emoji || "🎵"}
              </span>
              <span className="text-secondary-black dark:text-secondary-white truncate">
                {name}
              </span>
            </div>
            {ambientSoundHook.currentSound === name && (
              <CheckCircle
                size={18}
                className="text-secondary-black/80 dark:text-secondary-white/80 flex-shrink-0 ml-2"
              />
            )}
          </button>
        ))}
      </div>
      <button
        onClick={handleStartFocusSession}
        className="mt-auto pt-3 w-full py-3 bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 flex-shrink-0"
      >
        <Play size={16} />
        Start Focus
      </button>
    </>
  );

  const renderActive = () => (
    <div className="flex flex-col h-full items-center justify-between p-6 bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white relative">
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        {ambientSoundHook.currentSound &&
          ambientSoundHook.currentSound !== "None" && (
            <>
              <button
                onClick={
                  ambientSoundHook.isPlaying
                    ? ambientSoundHook.pauseSound
                    : ambientSoundHook.playSound
                }
                className="p-2 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-secondary-black/80 dark:text-secondary-white/80"
                aria-label={
                  ambientSoundHook.isPlaying
                    ? "Pause ambient sound"
                    : "Play ambient sound"
                }
              >
                {ambientSoundHook.isPlaying ? (
                  <Volume2 size={18} />
                ) : (
                  <VolumeX size={18} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 accent-primary cursor-pointer"
                aria-label="Adjust ambient sound volume"
                title={`Volume: ${Math.round(volume * 100)}%`}
              />
            </>
          )}
        <button
          onClick={handleStopFocus}
          className="p-2 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-secondary-black/80 dark:text-secondary-white/80"
          aria-label="End focus session"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center text-center space-y-4 flex-grow pt-10">
        <h2 className="text-xl font-medium text-secondary-black/80 dark:text-secondary-white/80 break-words max-w-md px-4">
          {selectedTask?.name || "Deep Work"}
        </h2>
        <div className="text-7xl md:text-8xl font-semibold tracking-tight tabular-nums text-secondary-black dark:text-secondary-white">
          {remainingTime !== null ? (
            formatRemainingTime(remainingTime)
          ) : (
            <Skeleton className="h-20 w-40 inline-block rounded-lg" />
          )}
        </div>
        {endTime && (
          <div className="flex items-center justify-center gap-2 text-secondary-black/60 dark:text-secondary-white/60 text-sm">
            <Clock size={14} />
            <span>Ends at {endTime}</span>
          </div>
        )}
        {ambientSoundHook.currentSound &&
          ambientSoundHook.currentSound !== "None" && (
            <div className="flex items-center justify-center gap-2 text-secondary-black/60 dark:text-secondary-white/60 text-sm">
              <span className="text-lg">
                {
                  ambientSoundHook.availableSounds[
                    ambientSoundHook.currentSound
                  ]?.emoji
                }
              </span>
              <span>
                {ambientSoundHook.currentSound}{" "}
                {ambientSoundHook.isPlaying ? "playing" : "paused"}
              </span>
            </div>
          )}
      </div>

      <div className="flex items-center justify-center gap-4 pb-4 flex-shrink-0">
        <button
          onClick={handleStopFocus}
          className="px-6 py-2 border border-secondary-black/20 dark:border-secondary-white/20 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-secondary-black/80 dark:text-secondary-white/80"
        >
          End Session
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={componentRef}
      className={`relative rounded-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-md ${isSpecialTheme
        ? "dark bg-zinc-900/50 border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border-slate-200/50 dark:border-zinc-800/50"
        } ${setupStep === "active"
          ? "h-full !bg-secondary-white dark:!bg-secondary-black !border-transparent !backdrop-blur-none"
          : setupStep === "idle"
            ? "h-80"
            : "h-[500px]"
        }`}
      id="deep-work-container"
    >
      {setupStep === "active" ? (
        renderActive()
      ) : (
        <div className="relative p-4 flex flex-col h-full overflow-hidden">
          <h1 className="text-sm font-medium text-secondary-black dark:text-secondary-white opacity-40 mb-2 uppercase tracking-wider flex-shrink-0">
            DEEP WORK
          </h1>
          <div className="flex-grow flex flex-col overflow-hidden">
            {setupStep === "idle" && renderIdle()}
            {setupStep === "task" && renderTaskSelection()}
            {setupStep === "duration" && renderDurationSelection()}
            {setupStep === "music" && renderMusicSelection()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeepWork;