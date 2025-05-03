"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
    Moon, X, List, Edit3, Clock4, Check, ChevronRight,
    Loader2, Volume2, VolumeX, Timer,
} from "lucide-react";
import * as tasksApi from "../../../lib/tasksApi"; // Adjust path as needed
import type { Task, TaskList } from "@/types/taskTypes"; // Adjust path as needed
import { useAmbientSound, AmbientSoundName, ambientSoundNames } from "@/hooks/useAmbientSound"; // Adjust path as needed
import { toast } from "sonner";

type SetupStep = "idle" | "task" | "duration" | "music" | "active";

interface SelectedTask {
    id: string | 'custom';
    name: string;
    source: 'list' | 'custom';
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
    const [focusDuration, setFocusDuration] = useState<number>(DURATION_OPTIONS[0]);
    const [endTime, setEndTime] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState<number | null>(null);
    const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);

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
            .flatMap(list => list?.tasks || [])
            .filter(task => task && !task.completed);
    }, [taskLists, isLoadingTasks, isErrorTasks, status]);

    // Effect for task loading errors
    useEffect(() => {
        if (isErrorTasks && errorTasks) {
            toast.error(`Error loading tasks: ${errorTasks.message || 'Unknown error'}`);
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
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // --- Fullscreen Logic ---
    const enterFullscreen = useCallback(() => {
        if (componentRef.current && !document.fullscreenElement) {
            componentRef.current.requestFullscreen()
                .catch(err => {
                    console.error("Error attempting to enable full-screen mode:", err);
                    toast.error(`Fullscreen not available: ${err.message}. Starting normally.`);
                    // No need to explicitly set isFullscreen(false), listener handles it
                });
            // Note: State update (setIsFullscreen) is handled by the event listener
        }
    }, []); // componentRef is stable

    const exitFullscreen = useCallback(() => {
        if (document.fullscreenElement) {
            document.exitFullscreen()
                .catch(err => console.error("Error attempting to exit full-screen mode:", err));
            // Note: State update (setIsFullscreen) is handled by the event listener
        }
    }, []);

    // Effect to listen for fullscreen changes (user Esc key, API calls)
    useEffect(() => {
        const handleFullscreenChange = () => {
            // Check if *this* component's ref is the one in fullscreen
            setIsFullscreen(document.fullscreenElement === componentRef.current);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        // Cleanup listener on unmount
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
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

        if (completedTask?.source === 'list' && completedTask.id !== 'custom') {
            console.log(`TODO: Mark task ${completedTask.id} (${completedTask.name}) as complete.`);
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
        setSelectedTask({ id: task.id, name: task.name, source: 'list' });
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
        setSelectedTask({ id: 'custom', name: trimmedName, source: 'custom' });
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
        if (ambientSoundHook.currentSound && ambientSoundHook.currentSound !== 'None') {
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
        resetState // Add dependency for the error case
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
                document.exitFullscreen().catch(err => console.error("Error exiting fullscreen on unmount:", err));
            }
        };
    }, [timerIntervalId]); // Only depends on timerIntervalId now, as componentRef is stable


    // --- Render Logic ---

    const renderIdle = () => (
        <div className="flex flex-col h-full items-center justify-center text-center p-4">
            <Timer size={36} className="text-primary-blue mb-6" />
            <h1 className="text-xl font-medium text-primary-black dark:text-primary-white mb-2">
                Deep Work Session
            </h1>
            <p className="text-sm text-secondary-black dark:text-secondary-white opacity-60 mb-8 max-w-xs">
                Create a distraction-free environment for focused work.
            </p>
            <button
                onClick={handleStartSetup}
                className="px-8 py-3 bg-primary-blue text-secondary-white rounded-lg flex items-center justify-center space-x-2 hover:bg-primary-blue-hover transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue-ring"
            >
                <span className="font-medium">Begin</span>
                <ChevronRight size={18} />
            </button>
        </div>
    );

    const renderTaskSelection = () => (
        <div className="flex flex-col h-full p-2">
            <h2 className="text-lg font-semibold mb-5 text-center text-primary-black dark:text-primary-white">
                SELECT FOCUS TASK
            </h2>
            <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2 -mr-2">
                {/* Task List */}
                {status === 'authenticated' && (
                    <>
                        <h3 className="text-md font-medium text-left text-secondary-black dark:text-secondary-white mb-3 sticky top-0 py-1 z-10 bg-white/80 dark:bg-zinc-900/80">Your Tasks</h3>
                        {isLoadingTasks &&
                            <div className="flex justify-center items-center py-4 text-secondary-black dark:text-secondary-white opacity-60">
                                <Loader2 className="animate-spin mr-2" /> Loading...
                            </div>
                        }
                        {isErrorTasks && errorTasks &&
                            <div className="text-third-red text-sm p-2 rounded border border-third-red">
                                Could not load tasks: {errorTasks.message}
                            </div>
                        }
                        {!isLoadingTasks && !isErrorTasks && incompleteTasks.length === 0 &&
                            <p className="text-secondary-black dark:text-secondary-white opacity-60 text-sm text-left px-1 py-2">
                                No incomplete tasks found.
                            </p>
                        }
                        {!isLoadingTasks && !isErrorTasks && incompleteTasks.map(task => (
                            <button
                                key={task.id}
                                onClick={() => handleSelectTaskListTask(task)}
                                className="w-full text-left p-3 bg-secondary-white dark:bg-secondary-black rounded-lg border border-bdr-light dark:border-bdr-dark hover:border-primary-blue dark:hover:border-primary-blue transition-all flex items-center group"
                            >
                                <List size={18} className="mr-3 text-primary-blue flex-shrink-0" />
                                <span className="flex-grow truncate text-secondary-black dark:text-secondary-white">{task.name}</span>
                                <ChevronRight size={16} className="ml-2 text-accent-grey group-hover:text-primary-blue transition-transform group-hover:translate-x-1" />
                            </button>
                        ))}
                    </>
                )}
                {status === 'unauthenticated' &&
                    <p className="text-secondary-black dark:text-secondary-white opacity-60 text-sm text-left p-2 rounded border border-bdr-light dark:border-bdr-dark">
                        Sign in to select from your saved tasks.
                    </p>
                }
                {/* Custom Task */}
                <h3 className="text-md font-medium text-left text-secondary-black dark:text-secondary-white mt-6 mb-3 sticky top-0 py-1 z-10 bg-white/80 dark:bg-zinc-900/80">Custom Focus</h3>
                <div className="flex gap-2">
                    <input
                        ref={customTaskInputRef}
                        type="text"
                        value={customTaskName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomTaskName(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && customTaskName.trim() && handleSelectCustomTask()}
                        placeholder="E.g., Write project proposal"
                        className="flex-grow p-3 border border-bdr-light dark:border-bdr-dark rounded-lg bg-secondary-white dark:bg-secondary-black focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent placeholder-accent-grey text-primary-black dark:text-primary-white"
                    />
                    <button
                        onClick={handleSelectCustomTask}
                        disabled={!customTaskName.trim()}
                        className="p-3 bg-primary-blue text-secondary-white rounded-lg hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        aria-label="Confirm custom task"
                    >
                        <Edit3 size={20} />
                    </button>
                </div>
            </div>
            {/* Cancel button */}
            <button onClick={handleStopFocus} className="mt-auto pt-4 text-sm text-secondary-black dark:text-secondary-white opacity-60 hover:text-third-red hover:opacity-100 transition-colors self-center">
                Cancel
            </button>
        </div>
    );

    const renderDurationSelection = () => (
        <div className="flex flex-col h-full text-center p-4">
            <h2 className="text-lg font-semibold mb-4 text-primary-black dark:text-primary-white">
                SET DURATION
            </h2>
            <p className="mb-6 text-secondary-black dark:text-secondary-white text-sm px-4">
                Task: <span className="font-medium break-words">{selectedTask?.name || '...'}</span>
            </p>
            <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                <Clock4 size={36} className="text-primary-blue mb-4" />
                <div className="flex flex-wrap justify-center gap-3 mb-4">
                    {DURATION_OPTIONS.map(duration => (
                        <button
                            key={duration}
                            onClick={() => handleSetDuration(duration)}
                            className={`px-5 py-2.5 rounded-lg text-md font-medium border transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:ring-primary-blue ${focusDuration === duration
                                    ? 'bg-primary-blue text-secondary-white border-primary-blue'
                                    : 'bg-secondary-white dark:bg-secondary-black text-secondary-black dark:text-secondary-white border-bdr-light dark:border-bdr-dark hover:border-primary-blue'
                                }`}
                        >
                            {duration} min
                        </button>
                    ))}
                </div>
            </div>
            <button
                onClick={handleConfirmDuration}
                disabled={focusDuration <= 0}
                className="w-full max-w-xs mx-auto mt-8 py-3 px-6 bg-primary-blue text-secondary-white rounded-lg text-lg font-medium hover:bg-primary-blue-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
                Next <ChevronRight size={20} />
            </button>
            <button onClick={() => setSetupStep('task')} className="mt-4 text-sm text-secondary-black dark:text-secondary-white opacity-60 hover:opacity-100 transition-colors">
                Back
            </button>
        </div>
    );

    const renderMusicSelection = () => (
        <div className="flex flex-col h-full p-4">
            <h2 className="text-lg font-semibold mb-4 text-center text-primary-black dark:text-primary-white">
                AMBIENT SOUND
            </h2>
            <p className="text-sm text-secondary-black dark:text-secondary-white opacity-60 mb-6 text-center">Choose a sound for your session (optional)</p>
            <div className="flex-grow overflow-y-auto space-y-3 mb-4 pr-2 -mr-2">
                {ambientSoundNames.map(name => (
                    <button
                        key={name}
                        onClick={() => handleSelectMusic(name as AmbientSoundName)}
                        className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 focus:ring-primary-blue ${ambientSoundHook.currentSound === name
                                ? 'bg-primary-blue/10 dark:bg-primary-blue/20 border-primary-blue' // Highlight selected
                                : 'bg-secondary-white dark:bg-secondary-black border-bdr-light dark:border-bdr-dark text-secondary-black dark:text-secondary-white hover:border-primary-blue'
                            }`}
                    >
                        <div className="flex items-center text-secondary-black dark:text-secondary-white">
                            <span className="text-xl mr-3">{ambientSoundHook.availableSounds[name as AmbientSoundName]?.emoji || '🎵'}</span>
                            <span>{name}</span>
                        </div>
                        {ambientSoundHook.currentSound === name && (
                            <Check size={18} className="text-primary-blue" />
                        )}
                    </button>
                ))}
            </div>
            <button
                // Use the specific handler to start the session AND request fullscreen
                onClick={handleStartFocusSession}
                className="w-full max-w-xs mx-auto mt-8 py-3 px-6 bg-primary-blue text-secondary-white rounded-lg text-lg font-medium hover:bg-primary-blue-hover transition-colors flex items-center justify-center gap-2"
            >
                Start Focus <Check size={20} />
            </button>
            <button onClick={() => setSetupStep('duration')} className="mt-4 text-sm text-secondary-black dark:text-secondary-white opacity-60 hover:opacity-100 transition-colors self-center">
                Back
            </button>
        </div>
    );

    // Render active state - looks good for fullscreen already
    const renderActive = () => (
        // This container will fill the fullscreen element.
        // The dark background is appropriate for focus.
        <div className="flex flex-col h-full items-center justify-between text-center p-4 sm:p-6 md:p-8 bg-[#141618] text-secondary-white relative">
            {/* Controls Container - Top Right */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-10">
                {/* Music Control Button */}
                {ambientSoundHook.currentSound && ambientSoundHook.currentSound !== 'None' && (
                    <button
                        onClick={ambientSoundHook.isPlaying ? ambientSoundHook.pauseSound : ambientSoundHook.playSound}
                        className="p-2.5 rounded-lg border border-bdr-dark text-secondary-white hover:border-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
                        aria-label={ambientSoundHook.isPlaying ? "Pause ambient sound" : "Play ambient sound"}
                    >
                        {ambientSoundHook.isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    </button>
                )}
                 {/* Manual Fullscreen Toggle Button - Optional */}
                 {/* Consider adding if explicit control is desired */}
                 {/* <button
                    onClick={isFullscreen ? exitFullscreen : enterFullscreen}
                    className="p-2.5 rounded-lg border border-bdr-dark text-secondary-white hover:border-primary-blue transition-colors focus:outline-none focus:ring-2 focus:ring-primary-blue"
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                    {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button> */}

                {/* Stop Session Button */}
                <button
                    onClick={handleStopFocus} // Use the callback that also handles exiting fullscreen
                    className="p-2.5 rounded-lg border border-third-red text-third-red hover:bg-third-red hover:text-secondary-white transition-colors focus:outline-none focus:ring-2 focus:ring-third-red"
                    aria-label="End focus session"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Main Content Area - Centered */}
            <div className="flex flex-col items-center justify-center w-full flex-grow mt-10">
                <p className="text-md text-secondary-white opacity-60 mb-2 uppercase tracking-wider">
                    Focusing on
                </p>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium mb-10 px-4 break-words max-w-xl lg:max-w-2xl leading-tight">
                    {selectedTask?.name || "Deep Work"}
                </h2>

                {/* Timer Display */}
                <div className="mb-8 relative scale-90 sm:scale-100"> {/* Adjust scale slightly on smaller screens if needed */}
                     <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border-4 border-primary-blue flex items-center justify-center">
                        <div className="w-full h-full rounded-full border-2 border-primary-blue/30 flex flex-col items-center justify-center p-4">
                            {remainingTime !== null ? (
                                <span className="text-5xl sm:text-6xl md:text-7xl font-medium text-secondary-white tracking-wider tabular-nums">
                                    {formatRemainingTime(remainingTime)}
                                </span>
                            ) : (
                                <Loader2 className="animate-spin text-primary-blue" size={48} />
                            )}
                            {endTime && (
                                <p className="text-xs sm:text-sm text-secondary-white opacity-60 mt-2">
                                    <Timer size={10} className="inline mr-1" /> Ends at {endTime}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Playing sound indicator */}
                {ambientSoundHook.currentSound && ambientSoundHook.currentSound !== 'None' && (
                    <p className="text-xs sm:text-sm text-secondary-white opacity-60 mt-4 flex items-center gap-1.5">
                        {ambientSoundHook.isPlaying ?
                            <Volume2 size={12} className="text-third-green" /> :
                            <VolumeX size={12} className="text-third-red" />
                        }
                        {ambientSoundHook.currentSound} {ambientSoundHook.availableSounds[ambientSoundHook.currentSound]?.emoji}
                    </p>
                )}
            </div>

            {/* End Focus Button - Bottom */}
            <button
                onClick={handleStopFocus} // Use the callback that also handles exiting fullscreen
                className="mb-4 px-6 py-2.5 rounded-lg border border-bdr-dark flex items-center justify-center space-x-2 transition-colors hover:border-third-red hover:text-third-red focus:outline-none focus:ring-2 focus:ring-third-red"
            >
                <Moon size={16} />
                <span className="text-sm font-medium">End Focus</span>
            </button>
        </div>
    );


    // Main component render
    // Adjust height logic: setup steps have dynamic height, active step fills container
    // The browser handles the actual fullscreen sizing of the element `componentRef` points to.
    return (
        <div
            ref={componentRef}
            // Use h-full for active step to allow flexbox inside renderActive to work correctly.
            // For non-active steps, use the previous dynamic height logic.
            // The browser's :fullscreen selector implicitly handles sizing when fullscreen.
            // Added `bg-transparent` when active so the `renderActive` background shows through fully,
            // otherwise use the default blurred background.
            className={`relative p-0 ${setupStep === 'active' ? 'bg-transparent' : 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md'} rounded-xl border ${setupStep === 'active' ? 'border-transparent' : 'border-slate-200/50 dark:border-zinc-800/50'} flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
                setupStep === "active"
                  ? 'h-full' // Let renderActive's internal flexbox control layout
                  : setupStep === "idle"
                  ? "h-80"
                  : "h-[calc(100vh-10rem)] max-h-[700px]"
             }`}
            // Add specific styles for when the element *is* fullscreen via CSS pseudo-class if needed
            // e.g., in your global CSS:
            // .deep-work-container:fullscreen { border-radius: 0; border: none; }
            id="deep-work-container" // Optional ID for easier CSS targeting
        >
            {/* Conditional rendering based on setupStep */}
            {setupStep === "idle" && renderIdle()}
            {setupStep === "task" && renderTaskSelection()}
            {setupStep === "duration" && renderDurationSelection()}
            {setupStep === "music" && renderMusicSelection()}
            {setupStep === "active" && renderActive()}
        </div>
    );
};

export default DeepWork;