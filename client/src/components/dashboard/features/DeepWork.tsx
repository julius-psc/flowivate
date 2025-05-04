"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Clock,
  X,
  Target, // Using Target for task icon
  Loader,
  Volume2,
  VolumeX,
  ArrowLeft,
  Play,
  Plus,
  Focus,
  CheckCircle,
  // VolumeOff, // Removed as per request (only top-right volume)
} from "lucide-react";
import * as tasksApi from "../../../lib/tasksApi";
import type { Task, TaskList } from "@/types/taskTypes";
import {
  useAmbientSound,
  AmbientSoundName,
  ambientSoundNames,
} from "@/hooks/useAmbientSound";
import { toast } from "sonner";

type SetupStep = "idle" | "task" | "duration" | "music" | "active";

interface SelectedTask {
  id: string | "custom";
  name: string;
  source: "list" | "custom";
}

const DURATION_OPTIONS = [25, 50, 75, 90]; // in minutes

// --- Define the requested input className ---
const inputClassName =
  "flex-1 rounded-xl border-2 border-slate-300 dark:border-zinc-700  dark:bg-zinc-800/90 px-4 py-3 text-sm transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-primary-blue focus:ring-3 focus:ring-primary-blue/20 dark:focus:ring-primary-blue/10 disabled:opacity-60 disabled:cursor-not-allowed";

const DeepWork: React.FC = () => {
  const { data: session, status } = useSession();
  const queryKey = ["tasks", session?.user?.id];

  // --- State ---
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

  // --- Refs ---
  const componentRef = useRef<HTMLDivElement>(null);
  const customTaskInputRef = useRef<HTMLInputElement>(null);
  const customDurationInputRef = useRef<HTMLInputElement>(null);

  // --- Hooks ---
  const ambientSoundHook = useAmbientSound();

  // --- Task Fetching ---
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

  // --- Timer Logic ---
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

  // --- Fullscreen Logic ---
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

  // --- Callbacks ---
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
    ambientSoundHook.stopSound(); // Ensure sound stops on reset
    exitFullscreen();
    setSelectedTask(null);
    setCustomTaskName("");
    setShowCustomTaskInput(false);
    setFocusDuration(DURATION_OPTIONS[0]);
    setCustomDurationInput("");
    setIsCustomDurationSelected(false);
    setSetupStep("idle");
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

  // --- State Transitions and Actions ---
  const handleStartSetup = () => setSetupStep("task");

  const handleSelectTaskListTask = (task: Task) => {
    setSelectedTask({ id: task.id, name: task.name, source: "list" });
    setCustomTaskName("");
    setShowCustomTaskInput(false);
    setSetupStep("duration");
  };

  // **MODIFIED:** Action triggered by Enter key or input blur (if valid)
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

  // **MODIFIED:** Action triggered by Enter key or input blur (if valid)
  const handleConfirmCustomDuration = () => {
    const numericValue = parseInt(customDurationInput, 10);
    if (!isNaN(numericValue) && numericValue > 0) {
      setFocusDuration(numericValue);
      setIsCustomDurationSelected(true); // Ensure this is true if confirming via Enter/blur
      setSetupStep("music"); // Proceed to next step if valid
    } else if (customDurationInput === "" && !isCustomDurationSelected) {
      // Allow proceeding if input is empty but a preset was selected
      setFocusDuration(focusDuration > 0 ? focusDuration : DURATION_OPTIONS[0]); // Use current valid focus duration
      setSetupStep("music");
    } else {
      toast.error("Please enter a valid positive number for duration.");
      setIsCustomDurationSelected(true); // Keep custom selected to indicate input attempt
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
      setFocusDuration(numericValue); // Update duration state immediately for potential confirmation
      setIsCustomDurationSelected(true);
    } else if (value === "") {
      // If input is cleared, revert to the last *preset* or default, and deselect custom
      // Find the currently selected preset or default
      const currentPreset = DURATION_OPTIONS.includes(focusDuration)
        ? focusDuration
        : DURATION_OPTIONS[0];
      setFocusDuration(currentPreset);
      setIsCustomDurationSelected(false);
    } else {
      // Invalid input like text or zero/negative
      setIsCustomDurationSelected(true); // Still mark as custom input attempt
      setFocusDuration(0); // Set focus duration to an invalid state to prevent proceeding
    }
  };

  // Selects custom duration input visually when clicked
  const selectCustomDurationInput = () => {
    setIsCustomDurationSelected(true);
    // Don't change focusDuration here, only on valid input change or confirmation
  };

  // **MODIFIED:** Renamed for clarity, now moves to music step
  const handleConfirmDurationStep = () => {
    if (isCustomDurationSelected) {
      // If custom is selected, try to confirm it
      handleConfirmCustomDuration(); // This will validate and potentially move step
    } else if (focusDuration > 0) {
      // If a valid preset is selected
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

  // **REMOVED:** handleMuteSound (as per request for single top-right control)

  const handleStartFocusSession = useCallback(() => {
    if (!selectedTask || focusDuration <= 0) {
      toast.error("Configuration incomplete. Cannot start focus session.");
      resetState(); // Go back to idle if config is bad
      return;
    }
    enterFullscreen();
    startTimer();
    if (
      ambientSoundHook.currentSound &&
      ambientSoundHook.currentSound !== "None"
    ) {
      ambientSoundHook.playSound();
    }
    setSetupStep("active");
    toast.success(`Focus session started for ${selectedTask.name}`);
  }, [
    selectedTask,
    focusDuration,
    enterFullscreen,
    startTimer,
    ambientSoundHook,
    resetState, // Added resetState dependency
  ]);

  useEffect(() => {
    return () => {
      if (timerIntervalId) clearInterval(timerIntervalId);
      if (document.fullscreenElement) {
        exitFullscreen();
      }
    };
  }, [timerIntervalId, exitFullscreen]);

  // --- Render Logic ---

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
        {" "}
        {/* **MODIFIED:** Reduced mb */}
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
      {/* **MODIFIED:** Reduced space-y, added max-h-[calc(100%-...)] and overflow-y-auto */}
      <div className="flex-grow space-y-2 overflow-y-auto pr-1 max-h-[calc(100%-130px)]">
        {" "}
        {/* Adjust max-h based on surrounding elements */}
        {status === "authenticated" && (
          <>
            <h3 className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider mb-1">
              Your Tasks
            </h3>
            {isLoadingTasks && (
              <div className="flex items-center text-secondary-black/60 dark:text-secondary-white/60 py-2">
                <Loader className="animate-spin mr-2" size={16} />
                Loading tasks...
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
      </div> {/* End of scrollable task list */}
      {/* Custom Task Section - Outside the scrollable list area */}
      <div className="mt-auto pt-3 flex-shrink-0">
        {" "}
        {/* Pushes to bottom, adds padding top */}
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
          <div className="flex gap-2">
            {/* **MODIFIED:** Applied user's className, added min-w-0, Enter/Esc handlers */}
            <input
              ref={customTaskInputRef}
              type="text"
              value={customTaskName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCustomTaskName(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleConfirmCustomTask(); // Confirm on Enter
                } else if (e.key === "Escape") {
                  setShowCustomTaskInput(false); // Cancel on Escape
                  setCustomTaskName("");
                }
              }}
              onBlur={() => {
                // Optional: confirm on blur if input is valid and non-empty
                if (customTaskName.trim()) {
                  // Maybe only confirm if user *intended* to move on?
                  // For now, Enter/Esc are primary actions. Blur just loses focus.
                } else {
                  // If blurred while empty, maybe hide it?
                  // setShowCustomTaskInput(false);
                }
              }}
              placeholder="Enter custom task name"
              className={`${inputClassName} min-w-0`} // Applied requested style + min-w-0
            />
            {/* **REMOVED:** Check button removed as per Enter/Esc request */}
            {/*
            <button
              onClick={handleConfirmCustomTask} // Changed from handleSelectCustomTask
              disabled={!customTaskName.trim()}
              className="p-3 aspect-square bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center flex-shrink-0"
              aria-label="Confirm custom task"
            >
              <Check size={16} />
            </button>
             */}
          </div>
        )}
      </div>
    </>
  );

  const renderDurationSelection = () => (
    <>
      <div className="flex items-center mb-3">
        {" "}
        {/* **MODIFIED:** Reduced mb */}
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
      {/* Task display */}
      <div className="p-3 bg-secondary-black/5 dark:bg-secondary-white/5 rounded-md mb-3">
        {" "}
        {/* **MODIFIED:** Reduced p and mb */}
        <div className="flex items-center">
          <Target
            size={16}
            className="mr-2 text-secondary-black/60 dark:text-secondary-white/60 flex-shrink-0" // Reduced mr
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

      {/* **MODIFIED:** Reduced space-y, added max-h and overflow */}
      <div className="flex-grow space-y-2 overflow-y-auto pr-1 max-h-[calc(100%-150px)]">
        {" "}
        {/* Adjust max-h */}
        <h3 className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider mb-1">
          Focus Duration (minutes)
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {" "}
          {/* Reduced gap */}
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => handleSetDurationPreset(duration)}
              // **MODIFIED:** Removed scale-105 from selected state to prevent border distortion
              className={`p-3 rounded-md text-center transition-all duration-150 text-sm border ${
                !isCustomDurationSelected && focusDuration === duration
                  ? "bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black border-transparent shadow-md ring-1 ring-black/10 dark:ring-white/10" // Added subtle ring instead of scale
                  : "bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white border-secondary-black/20 dark:border-secondary-white/20 hover:bg-secondary-black/5 dark:hover:bg-secondary-white/10 hover:border-secondary-black/40 dark:hover:border-secondary-white/40"
              }`}
            >
              <div className="font-semibold">{duration}</div>
              <div className="text-xs opacity-70">minutes</div>
            </button>
          ))}
        </div>
        <div className="pt-2">
          {" "}
          {/* **MODIFIED:** Reduced pt */}
          <label
            htmlFor="custom-duration"
            className="text-xs font-medium text-secondary-black/60 dark:text-secondary-white/60 uppercase tracking-wider block mb-1" // Reduced mb
          >
            Custom Duration
          </label>
          <div className="flex gap-2 items-center">
            {/* **MODIFIED:** Applied user's className, added min-w-0, Enter/Esc handlers */}
            <input
              ref={customDurationInputRef}
              id="custom-duration"
              type="number"
              min="1"
              value={customDurationInput}
              onChange={handleCustomDurationChange}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  handleConfirmDurationStep(); // Confirm Step on Enter (will validate)
                } else if (e.key === "Escape") {
                  // Revert to last preset on Escape
                  const lastPreset = DURATION_OPTIONS.includes(focusDuration)
                    ? focusDuration
                    : DURATION_OPTIONS[0];
                  handleSetDurationPreset(lastPreset);
                  (e.target as HTMLInputElement).blur(); // Remove focus
                }
              }}
              onFocus={selectCustomDurationInput} // Select custom style on focus
              onBlur={() => {
                // Validate on blur only if custom is still selected and input is invalid
                const numericValue = parseInt(customDurationInput, 10);
                if (
                  isCustomDurationSelected &&
                  (isNaN(numericValue) || numericValue <= 0) &&
                  customDurationInput !== "" // Don't invalidate if just cleared
                ) {
                  toast.error(
                    "Invalid custom duration. Please enter a positive number."
                  );
                  // Optionally revert or keep focus
                  // customDurationInputRef.current?.focus();
                } else if (
                  isCustomDurationSelected &&
                  customDurationInput === ""
                ) {
                  // If blurred while empty and custom was selected, revert to default
                  handleSetDurationPreset(DURATION_OPTIONS[0]);
                }
              }}
              placeholder="e.g., 45"
              // **MODIFIED:** Applied requested style + min-w-0, conditional styling adjusted
              className={`${inputClassName} min-w-0 ${
                isCustomDurationSelected
                  ? "border-primary-blue ring-1 ring-primary-blue/20 dark:ring-primary-blue/10" // Use focus style when selected
                  : "" // Default style from inputClassName handles non-selected
              }`}
            />
          </div>
        </div>
      </div>{" "}
      {/* End of scrollable duration area */}
      <button
        onClick={handleConfirmDurationStep} // Use updated handler
        disabled={focusDuration <= 0} // Simple validation: must be > 0
        className="mt-auto pt-3 w-full py-3 bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex-shrink-0" // Pushes to bottom
      >
        Next
      </button>
    </>
  );

  const renderMusicSelection = () => (
    <>
      <div className="flex items-center mb-3">
        {" "}
        {/* Reduced mb */}
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
        {" "}
        {/* Reduced mb */}
        Select an optional ambient sound to play during your session.
      </p>
      {/* **MODIFIED:** Reduced space-y, added max-h and overflow */}
      <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[calc(100%-110px)]">
        {" "}
        {/* Adjust max-h */}
        {ambientSoundNames.map((name) => (
          <button
            key={name}
            onClick={() => handleSelectMusic(name as AmbientSoundName)}
            className={`w-full p-3 rounded-md transition-colors flex items-center justify-between text-sm text-left ${
              ambientSoundHook.currentSound === name
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
      </div>{" "}
      {/* End scrollable music list */}
      <button
        onClick={handleStartFocusSession}
        className="mt-auto pt-3 w-full py-3 bg-secondary-black dark:bg-secondary-white text-secondary-white dark:text-secondary-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 flex-shrink-0" // Pushed to bottom
      >
        <Play size={16} />
        Start Focus
      </button>
    </>
  );

  const renderActive = () => (
    <div className="flex flex-col h-full items-center justify-between p-6 bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white relative">
      {" "}
      {/* Slightly less padding */}
      {/* **MODIFIED:** Only Top Right Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        {/* Volume Toggle Button */}
        {ambientSoundHook.currentSound &&
          ambientSoundHook.currentSound !== "None" && (
            <button
              onClick={
                ambientSoundHook.isPlaying
                  ? ambientSoundHook.pauseSound // Pause action
                  : ambientSoundHook.playSound // Play action
              }
              className="p-2 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-secondary-black/80 dark:text-secondary-white/80"
              aria-label={
                ambientSoundHook.isPlaying
                  ? "Pause ambient sound"
                  : "Play ambient sound"
              }
            >
              {/* Icon changes based on isPlaying state */}
              {ambientSoundHook.isPlaying ? (
                <Volume2 size={18} /> // Icon when playing
              ) : (
                <VolumeX size={18} /> // Icon when paused or stopped
              )}
            </button>
          )}
        {/* Close Button */}
        <button
          onClick={handleStopFocus}
          className="p-2 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-colors text-secondary-black/80 dark:text-secondary-white/80"
          aria-label="End focus session"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Content Area (Centered) */}
      <div className="flex flex-col items-center justify-center text-center space-y-4 flex-grow pt-10">
        {" "}
        {/* Added flex-grow and some padding-top */}
        <h2 className="text-xl font-medium text-secondary-black/80 dark:text-secondary-white/80 break-words max-w-md px-4">
          {selectedTask?.name || "Deep Work"}
        </h2>
        <div className="text-7xl md:text-8xl font-semibold tracking-tight tabular-nums text-secondary-black dark:text-secondary-white">
          {remainingTime !== null ? (
            formatRemainingTime(remainingTime)
          ) : (
            <Loader className="animate-spin inline-block" size={60} />
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

      {/* Bottom Buttons Area */}
      <div className="flex items-center justify-center gap-4 pb-4 flex-shrink-0">
        {" "}
        {/* Centered the button */}
        {/* **REMOVED:** Mute button from the bottom/middle area */}
        <button
          onClick={handleStopFocus}
          className="px-6 py-2 border border-secondary-black/20 dark:border-secondary-white/20 rounded-md text-sm hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-secondary-black/80 dark:text-secondary-white/80"
        >
          End Session
        </button>
      </div>
    </div>
  );

  // --- Main Return ---
  return (
    <div
      ref={componentRef}
      // **MODIFIED:** Adjusted height for setup steps for better spacing
      className={`relative rounded-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-slate-200/50 dark:border-zinc-800/50 ${
        setupStep === "active"
          ? "h-full !bg-secondary-white dark:!bg-secondary-black !border-transparent" // Active styles override
          : setupStep === "idle"
          ? "h-80"
          : "h-[500px]" // Reduced height for setup steps
      }`}
      id="deep-work-container"
    >
      {setupStep === "active" ? (
        renderActive()
      ) : (
        // Container for setup steps (non-active)
        <div className="relative p-4 flex flex-col h-full overflow-hidden">
          {/* Widget Heading */}
          <h1 className="text-sm font-medium text-secondary-black dark:text-secondary-white opacity-40 mb-2 uppercase tracking-wider flex-shrink-0">
            DEEP WORK
          </h1>
          {/* Inner container for steps */}
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