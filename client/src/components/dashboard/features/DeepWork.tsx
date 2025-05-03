"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Moon,
  X,
  List,
  Edit3,
  Clock4,
  Check,
  ChevronRight,
  Loader2,
  Volume2,
  VolumeX,
  Timer,
  ArrowRight,
} from "lucide-react";
import * as tasksApi from "../../../lib/tasksApi"; // Adjust path as needed
import type { Task, TaskList } from "@/types/taskTypes"; // Adjust path as needed
import {
  useAmbientSound,
  AmbientSoundName,
  ambientSoundNames,
} from "@/hooks/useAmbientSound"; // Adjust path as needed
import { toast } from "sonner";

type SetupStep = "idle" | "task" | "duration" | "music" | "active";

interface SelectedTask {
  id: string | "custom";
  name: string;
  source: "list" | "custom";
}

const DURATION_OPTIONS = [25, 50, 75, 90]; // in minutes

const DeepWork: React.FC = () => {
  const { data: session, status } = useSession();
  const queryKey = ["tasks", session?.user?.id];

  // Component State
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [, setIsFullscreen] = useState(false); // Track fullscreen state
  const [selectedTask, setSelectedTask] = useState<SelectedTask | null>(null);
  const [customTaskName, setCustomTaskName] = useState("");
  const [focusDuration, setFocusDuration] = useState<number>(
    DURATION_OPTIONS[0]
  );
  const [endTime, setEndTime] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(
    null
  );

  // Refs
  const componentRef = useRef<HTMLDivElement>(null);
  const customTaskInputRef = useRef<HTMLInputElement>(null);

  // Hooks
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
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Filter incomplete tasks
  const incompleteTasks: Task[] = React.useMemo(() => {
    if (status !== "authenticated" || isLoadingTasks || isErrorTasks) return [];
    return taskLists
      .flatMap((list) => list?.tasks || [])
      .filter((task) => task && !task.completed);
  }, [taskLists, isLoadingTasks, isErrorTasks, status]);

  // Effect for task loading errors
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
        // No need to explicitly set isFullscreen(false), listener handles it
      });
      // Note: State update (setIsFullscreen) is handled by the event listener
    }
  }, []); // componentRef is stable

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document
        .exitFullscreen()
        .catch((err) =>
          console.error("Error attempting to exit full-screen mode:", err)
        );
      // Note: State update (setIsFullscreen) is handled by the event listener
    }
  }, []);

  // Effect to listen for fullscreen changes (user Esc key, API calls)
  useEffect(() => {
    const handleFullscreenChange = () => {
      // Check if *this* component's ref is the one in fullscreen
      setIsFullscreen(document.fullscreenElement === componentRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // Cleanup listener on unmount
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // --- Callbacks ---

  const stopTimer = useCallback(() => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    setRemainingTime(null);
    setEndTime(null);
  }, [timerIntervalId]);

  // resetState now includes exiting fullscreen
  const resetState = useCallback(() => {
    stopTimer();
    ambientSoundHook.stopSound();
    exitFullscreen(); // Ensure fullscreen is exited on reset
    setSelectedTask(null);
    setCustomTaskName("");
    setFocusDuration(DURATION_OPTIONS[0]);
    setSetupStep("idle");
    // isFullscreen state is managed by the event listener
  }, [stopTimer, ambientSoundHook, exitFullscreen]); // Added exitFullscreen dependency

  // handleSessionEnd now includes exiting fullscreen
  const handleSessionEnd = useCallback(() => {
    const completedTask = selectedTask;
    // Important: Call resetState *first* to handle cleanup including fullscreen exit
    resetState();
    // Now show toast after state is reset
    toast.success("Focus session complete!");

    if (completedTask?.source === "list" && completedTask.id !== "custom") {
      console.log(
        `TODO: Mark task ${completedTask.id} (${completedTask.name}) as complete.`
      );
    }
  }, [resetState, selectedTask]); // resetState dependency implicitly includes exitFullscreen

  const startTimer = useCallback(() => {
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }

    const durationInSeconds = focusDuration * 60;
    setRemainingTime(durationInSeconds);

    const now = new Date();
    const end = new Date(now.getTime() + durationInSeconds * 1000);
    setEndTime(formatTime(end));

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev !== null && prev > 1) {
          return prev - 1;
        } else {
          if (interval) clearInterval(interval); // Clear the interval *before* calling handleSessionEnd
          setTimerIntervalId(null); // Update state *before* potentially unmounting/changing state
          handleSessionEnd(); // Call session end logic AFTER clearing interval
          return 0; // Ensure remaining time is 0
        }
      });
    }, 1000);
    setTimerIntervalId(interval);
  }, [focusDuration, timerIntervalId, handleSessionEnd]); // Correct dependencies

  // handleStopFocus now includes exiting fullscreen
  const handleStopFocus = useCallback(() => {
    // Important: Call resetState *first* to handle cleanup including fullscreen exit
    resetState();
    // Now show toast
    toast.info("Focus session ended.");
  }, [resetState]); // resetState dependency implicitly includes exitFullscreen

  // --- State Transitions and Actions ---
  const handleStartSetup = () => {
    setSetupStep("task");
  };

  const handleSelectTaskListTask = (task: Task) => {
    setSelectedTask({ id: task.id, name: task.name, source: "list" });
    setCustomTaskName("");
    setSetupStep("duration");
  };

  const handleSelectCustomTask = () => {
    const trimmedName = customTaskName.trim();
    if (!trimmedName) {
      toast.error("Please enter a name for your focus task.");
      customTaskInputRef.current?.focus();
      return;
    }
    setSelectedTask({ id: "custom", name: trimmedName, source: "custom" });
    setSetupStep("duration");
  };

  const handleSetDuration = (duration: number) => {
    setFocusDuration(duration > 0 ? duration : DURATION_OPTIONS[0]);
  };

  const handleConfirmDuration = () => {
    if (focusDuration <= 0) {
      toast.error("Please set a focus duration.");
      return;
    }
    setSetupStep("music");
  };

  const handleSelectMusic = (soundName: AmbientSoundName) => {
    ambientSoundHook.selectSound(soundName);
  };

  // Modified handleStartFocusSession: Request fullscreen, then start
  const handleStartFocusSession = useCallback(() => {
    if (!selectedTask || focusDuration <= 0) {
      toast.error("Configuration incomplete. Cannot start focus session.");
      resetState(); // Reset fully if config is bad
      return;
    }

    // 1. Request Fullscreen
    enterFullscreen(); // Fire and forget, the listener will update state

    // 2. Start Timer (don't wait for fullscreen confirmation)
    startTimer();

    // 3. Play Sound
    if (
      ambientSoundHook.currentSound &&
      ambientSoundHook.currentSound !== "None"
    ) {
      ambientSoundHook.playSound();
    }

    // 4. Set state to active
    setSetupStep("active");
    toast.success(`Focus session started for ${selectedTask.name}`);
  }, [
    selectedTask,
    focusDuration,
    enterFullscreen, // Add dependency
    startTimer,
    ambientSoundHook,
    resetState, // Add dependency for the error case
  ]);

  // Effect for cleanup on unmount (timer and potential fullscreen exit)
  useEffect(() => {
    // Store the ref's current value for the cleanup function
    const currentRef = componentRef.current;
    return () => {
      // Cleanup timer
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
        console.log("DeepWork component unmounted, clearing timer interval.");
      }
      // Cleanup fullscreen if this component was the fullscreen element when unmounted
      // Use the stored ref value in case the ref gets cleared before cleanup
      if (document.fullscreenElement === currentRef) {
        document
          .exitFullscreen()
          .catch((err) =>
            console.error("Error exiting fullscreen on unmount:", err)
          );
      }
    };
  }, [timerIntervalId]); // Only depends on timerIntervalId now, as componentRef is stable

  // --- Render Logic ---

  const renderIdle = () => (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
        FOCUS
      </h1>
      <div className="flex flex-col h-full items-center justify-center text-center p-4">
        <div className="w-16 h-16 rounded-full bg-primary-blue/10 dark:bg-primary-blue/20 flex items-center justify-center mb-6">
          <Timer size={28} className="text-primary-blue" />
        </div>
        <h2 className="text-lg font-medium text-primary-black dark:text-primary-white mb-3">
          Deep Work Session
        </h2>
        <p className="text-sm text-secondary-black dark:text-secondary-white opacity-60 mb-8 max-w-xs">
          Create a distraction-free environment for focused work.
        </p>
        <button
          onClick={handleStartSetup}
          className="px-6 py-2.5 bg-primary-blue text-secondary-white rounded-lg hover:bg-primary-blue-hover transition-all focus:outline-none focus:ring-2 focus:ring-primary-blue-ring flex items-center justify-center"
        >
          <span className="font-medium mr-2">Begin</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );

  const renderTaskSelection = () => (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-sm font-medium text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider mb-6">
        Select Focus Task
      </h2>
      <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2 -mr-2">
        {/* Task List */}
        {status === "authenticated" && (
          <>
            <h3 className="text-xs uppercase tracking-wider font-medium text-secondary-black dark:text-secondary-white opacity-60 mb-3 sticky top-0 py-1 z-10 bg-white/80 dark:bg-zinc-900/80">
              Your Tasks
            </h3>
            {isLoadingTasks && (
              <div className="flex justify-center items-center py-4 text-secondary-black dark:text-secondary-white opacity-60">
                <Loader2 className="animate-spin mr-2" size={16} /> Loading...
              </div>
            )}
            {isErrorTasks && errorTasks && (
              <div className="text-third-red text-sm p-2 rounded border border-third-red/30 bg-third-red/5">
                Could not load tasks: {errorTasks.message}
              </div>
            )}
            {!isLoadingTasks &&
              !isErrorTasks &&
              incompleteTasks.length === 0 && (
                <p className="text-secondary-black dark:text-secondary-white opacity-60 text-sm text-left px-1 py-2">
                  No incomplete tasks found.
                </p>
              )}
            {!isLoadingTasks &&
              !isErrorTasks &&
              incompleteTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelectTaskListTask(task)}
                  className="w-full text-left p-3 rounded-lg border border-bdr-light dark:border-bdr-dark hover:border-primary-blue hover:bg-primary-blue/5 dark:hover:bg-primary-blue/10 transition-all flex items-center group"
                >
                  <div className="w-6 h-6 rounded-full bg-primary-blue/10 dark:bg-primary-blue/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <List size={14} className="text-primary-blue" />
                  </div>
                  <span className="flex-grow truncate text-secondary-black dark:text-secondary-white">
                    {task.name}
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-accent-grey opacity-60 group-hover:text-primary-blue group-hover:opacity-100 transition-all"
                  />
                </button>
              ))}
          </>
        )}
        {status === "unauthenticated" && (
          <p className="text-secondary-black dark:text-secondary-white opacity-60 text-sm text-left p-3 rounded-lg border border-bdr-light dark:border-bdr-dark bg-secondary-white/50 dark:bg-secondary-black/50">
            Sign in to select from your saved tasks.
          </p>
        )}
        {/* Custom Task */}
        <h3 className="text-xs uppercase tracking-wider font-medium text-secondary-black dark:text-secondary-white opacity-60 mt-6 mb-3 sticky top-0 py-1 z-10 bg-white/80 dark:bg-zinc-900/80">
          Custom Focus
        </h3>
        <div className="flex gap-2">
          <input
            ref={customTaskInputRef}
            type="text"
            value={customTaskName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCustomTaskName(e.target.value)
            }
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
              e.key === "Enter" &&
              customTaskName.trim() &&
              handleSelectCustomTask()
            }
            placeholder="E.g., Write project proposal"
            className="flex-grow p-3 border border-bdr-light dark:border-bdr-dark rounded-lg bg-transparent focus:outline-none focus:ring-1 focus:ring-primary-blue focus:border-primary-blue placeholder-accent-grey text-primary-black dark:text-primary-white"
          />
          <button
            onClick={handleSelectCustomTask}
            disabled={!customTaskName.trim()}
            className="p-3 bg-primary-blue text-secondary-white rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            aria-label="Confirm custom task"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      {/* Cancel button */}
      <button
        onClick={handleStopFocus}
        className="mt-auto pt-4 text-xs uppercase tracking-wider font-medium text-secondary-black dark:text-secondary-white opacity-40 hover:text-third-red hover:opacity-100 transition-colors self-center"
      >
        Cancel
      </button>
    </div>
  );

  const renderDurationSelection = () => (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-sm font-medium text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider mb-6">
        Set Duration
      </h2>
      <div className="mt-2 mb-8 p-3 rounded-lg border border-bdr-light dark:border-bdr-dark bg-primary-blue/5 dark:bg-primary-blue/10">
        <p className="text-sm text-secondary-black dark:text-secondary-white flex items-center">
          <Edit3 size={14} className="text-primary-blue mr-2" />
          <span className="font-medium break-words">
            {selectedTask?.name || "..."}
          </span>
        </p>
      </div>
      <div className="flex-grow flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary-blue/10 dark:bg-primary-blue/20 flex items-center justify-center mb-8">
          <Clock4 size={28} className="text-primary-blue" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 w-full max-w-md">
          {DURATION_OPTIONS.map((duration) => (
            <button
              key={duration}
              onClick={() => handleSetDuration(duration)}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-1 ${
                focusDuration === duration
                  ? "bg-primary-blue text-secondary-white shadow-md shadow-primary-blue/20"
                  : "bg-secondary-white/50 dark:bg-secondary-black/50 text-secondary-black dark:text-secondary-white border border-bdr-light dark:border-bdr-dark hover:border-primary-blue"
              }`}
            >
              {duration} min
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleConfirmDuration}
          disabled={focusDuration <= 0}
          className="w-full max-w-xs py-2.5 px-6 bg-primary-blue text-secondary-white rounded-lg font-medium hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <span className="mr-2">Next</span>
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => setSetupStep("task")}
          className="text-xs uppercase tracking-wider font-medium text-secondary-black dark:text-secondary-white opacity-40 hover:opacity-100 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );

  const renderMusicSelection = () => (
    <div className="flex flex-col h-full p-6">
      <h2 className="text-sm font-medium text-secondary-black dark:text-secondary-white opacity-40 uppercase tracking-wider mb-6">
        Ambient Sound
      </h2>
      <p className="text-xs text-secondary-black dark:text-secondary-white opacity-60 mb-6">
        Choose a sound for your session (optional)
      </p>
      <div className="flex-grow overflow-y-auto space-y-2 mb-4 pr-2 -mr-2">
        {ambientSoundNames.map((name) => (
          <button
            key={name}
            onClick={() => handleSelectMusic(name as AmbientSoundName)}
            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group focus:outline-none focus:ring-1 focus:ring-primary-blue ${
              ambientSoundHook.currentSound === name
                ? "bg-primary-blue/10 dark:bg-primary-blue/20 border-primary-blue"
                : "border-bdr-light dark:border-bdr-dark text-secondary-black dark:text-secondary-white hover:border-primary-blue hover:bg-primary-blue/5 dark:hover:bg-primary-blue/10"
            }`}
          >
            <div className="flex items-center text-secondary-black dark:text-secondary-white gap-3">
              <span className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary-white/70 dark:bg-secondary-black/70 text-lg">
                {ambientSoundHook.availableSounds[name as AmbientSoundName]
                  ?.emoji || "🎵"}
              </span>
              <span className="text-sm">{name}</span>
            </div>
            {ambientSoundHook.currentSound === name && (
              <Check size={16} className="text-primary-blue" />
            )}
          </button>
        ))}
      </div>
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={handleStartFocusSession}
          className="w-full max-w-xs py-2.5 px-6 bg-primary-blue text-secondary-white rounded-lg font-medium hover:bg-primary-blue-hover transition-colors flex items-center justify-center"
        >
          <span className="mr-2">Start Focus</span>
          <Check size={16} />
        </button>
        <button
          onClick={() => setSetupStep("duration")}
          className="text-xs uppercase tracking-wider font-medium text-secondary-black dark:text-secondary-white opacity-40 hover:opacity-100 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );

  // Redesigned active state with a more minimalist approach
  const renderActive = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0f1215] to-[#1a1e24] text-secondary-white relative">
      {/* Controls Container - Top Right */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        {/* Music Control Button */}
        {ambientSoundHook.currentSound &&
          ambientSoundHook.currentSound !== "None" && (
            <button
              onClick={
                ambientSoundHook.isPlaying
                  ? ambientSoundHook.pauseSound
                  : ambientSoundHook.playSound
              }
              className="p-2 rounded-full bg-white/10 text-secondary-white hover:bg-white/20 transition-all focus:outline-none"
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
          )}

        {/* Stop Session Button */}
        <button
          onClick={handleStopFocus}
          className="p-2 rounded-full bg-third-red/20 text-third-red hover:bg-third-red/30 transition-all focus:outline-none"
          aria-label="End focus session"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Content Area - Centered */}
      <div className="flex flex-col items-center justify-center w-full flex-grow p-6">
        {/* Timer Display - Completely redesigned */}
        <div className="mb-12 relative">
          <div className="relative">
            {/* Background Glow Effect */}
            <div className="absolute inset-0 rounded-full bg-primary-blue/20 blur-xl"></div>

            {/* Main Timer Container */}
            <div className="relative flex flex-col items-center justify-center">
              {/* Task Label */}
              <p className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-xs font-medium uppercase tracking-widest text-white/60 mb-1">
                Focus Task
              </p>

              {/* Task Name */}
              <h2 className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-lg font-medium mb-8 text-center max-w-xs break-words">
                {selectedTask?.name || "Deep Work"}
              </h2>

              {/* Timer Circle */}
              <div className="w-64 h-64 flex items-center justify-center">
                <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="2"
                  />

                  {/* Progress Circle */}
                  {remainingTime !== null && focusDuration > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgba(59, 130, 246, 0.8)"
                      strokeWidth="2"
                      strokeDasharray="283"
                      strokeDashoffset={
                        283 - 283 * (remainingTime / (focusDuration * 60))
                      }
                      strokeLinecap="round"
                    />
                  )}
                </svg>

                {/* Time Display */}
                <div className="absolute flex flex-col items-center">
                  {remainingTime !== null ? (
                    <span className="text-6xl font-light text-white tracking-wider tabular-nums">
                      {formatRemainingTime(remainingTime)}
                    </span>
                  ) : (
                    <Loader2
                      className="animate-spin text-primary-blue"
                      size={48}
                    />
                  )}

                  {endTime && (
                    <p className="text-xs text-white/60 mt-2 flex items-center">
                      <Clock4 size={10} className="mr-1" /> Until {endTime}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Playing sound indicator */}
        {ambientSoundHook.currentSound &&
          ambientSoundHook.currentSound !== "None" && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-white/70 mt-4">
              <span className="text-lg">
                {
                  ambientSoundHook.availableSounds[
                    ambientSoundHook.currentSound
                  ]?.emoji
                }
              </span>
              <span className="text-xs font-medium">
                {ambientSoundHook.currentSound}
              </span>
              {ambientSoundHook.isPlaying ? (
                <Volume2 size={12} className="text-third-green ml-1" />
              ) : (
                <VolumeX size={12} className="text-third-red ml-1" />
              )}
            </div>
          )}
      </div>

      {/* End Focus Button - Bottom */}
      <button
        onClick={handleStopFocus}
        className="mx-auto mb-8 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center space-x-2 transition-all"
      >
        <Moon size={16} />
        <span className="text-xs font-medium uppercase tracking-wider">
          End Focus
        </span>
      </button>
    </div>
  );

  // Main component render
  return (
    <div
      ref={componentRef}
      className={`relative p-0 ${
        setupStep === "active"
          ? "bg-transparent"
          : "bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md"
      } rounded-xl border ${
        setupStep === "active"
          ? "border-transparent"
          : "border-slate-200/50 dark:border-zinc-800/50"
      } flex flex-col h-full w-full overflow-hidden transition-all duration-300`}
    >
      {setupStep === "idle" && renderIdle()}
      {setupStep === "task" && renderTaskSelection()}
      {setupStep === "duration" && renderDurationSelection()}
      {setupStep === "music" && renderMusicSelection()}
      {setupStep === "active" && renderActive()}
    </div>
  );
};

export default DeepWork;