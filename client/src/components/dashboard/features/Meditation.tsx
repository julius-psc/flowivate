"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { IconWind, IconChevronLeft } from "@tabler/icons-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { specialSceneThemeNames } from "@/lib/themeConfig";

const BreathMessage = React.memo(({ phase }: { phase: string }) => {
  const phaseMessages: { [key: string]: string } = {
    inhale: "Breathe in...",
    "hold-inhale": "Hold...",
    exhale: "Breathe out...",
    "hold-exhale": "Hold...",
  };
  return (
    <p className="text-sm mt-5 font-medium text-primary-black dark:text-white">
      {phaseMessages[phase] || "Breathing..."}
    </p>
  );
});
BreathMessage.displayName = "BreathMessage";

const Meditation = () => {
  const [isMeditating, setIsMeditating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<string>("inhale");
  const [breathProgress, setBreathProgress] = useState(0);
  const [shouldScale, setShouldScale] = useState(true);

  const { theme } = useTheme();
  const isSpecialTheme =
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const currentCycleTimeRef = useRef(0);
  const currentPhaseRef = useRef<string>("inhale");

  const meditationTimes = useMemo(
    () => [
      {
        label: "Quick Reset - 1min",
        seconds: 60,
        pattern: [
          { phase: "inhale", duration: 4 },
          { phase: "exhale", duration: 4 },
        ],
      },
      {
        label: "Short Break - 3min",
        seconds: 180,
        pattern: [
          { phase: "inhale", duration: 4 },
          { phase: "hold-inhale", duration: 4 },
          { phase: "exhale", duration: 4 },
          { phase: "hold-exhale", duration: 4 },
        ],
      },
      {
        label: "Deep Calm - 10min",
        seconds: 600,
        pattern: [
          { phase: "inhale", duration: 4 },
          { phase: "exhale", duration: 6 },
        ],
      },
    ],
    []
  );

  const breathPattern = useMemo(() => {
    if (!selectedTime) return meditationTimes[0].pattern;
    return (
      meditationTimes.find((t) => t.seconds === selectedTime)?.pattern ||
      meditationTimes[0].pattern
    );
  }, [selectedTime, meditationTimes]);

  const startMeditation = useCallback(
    (time: { label: string; seconds: number }) => {
      setSelectedTime(time.seconds);
      setTimeLeft(time.seconds);
      setIsMeditating(true);
      setBreathPhase("inhale");
      setBreathProgress(0);
      setShouldScale(true);
      currentCycleTimeRef.current = 0;
      currentPhaseRef.current = "inhale";
      toast.success(`Starting ${time.label} meditation.`);
    },
    []
  );

  const exitSession = useCallback(() => {
    setIsMeditating(false);
    setSelectedTime(null);
    setTimeLeft(0);
    setBreathProgress(0);
    toast.info("Meditation session ended.");
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    let breathTimer: NodeJS.Timeout | undefined;

    if (isMeditating && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      breathTimer = setInterval(() => {
        const currentPhaseCfg = breathPattern.find(
          (p) => p.phase === currentPhaseRef.current
        );
        if (!currentPhaseCfg) return;
        currentCycleTimeRef.current++;
        const progress =
          currentPhaseCfg.duration > 0
            ? Math.min(
              currentCycleTimeRef.current / currentPhaseCfg.duration,
              1
            )
            : 1;

        if (currentPhaseRef.current === "inhale") {
          setBreathProgress(progress);
          setShouldScale(true);
        } else if (currentPhaseRef.current === "hold-inhale") {
          setBreathProgress(1);
          setShouldScale(true);
        } else if (currentPhaseRef.current === "exhale") {
          setBreathProgress(1 - progress);
          setShouldScale(true);
        } else if (currentPhaseRef.current === "hold-exhale") {
          setBreathProgress(0);
          setShouldScale(false); // Changed to false for consistency? Or was it intended? Let's keep it false as original.
        }

        if (currentCycleTimeRef.current >= currentPhaseCfg.duration) {
          const currentIndex = breathPattern.findIndex(
            (p) => p.phase === currentPhaseRef.current
          );
          const nextIndex = (currentIndex + 1) % breathPattern.length;
          currentPhaseRef.current = breathPattern[nextIndex].phase;
          currentCycleTimeRef.current = 0;
          setBreathPhase(currentPhaseRef.current);
        }
      }, 1000);
    } else if (timeLeft === 0 && isMeditating) {
      exitSession();
    }

    return () => {
      if (timer) clearInterval(timer);
      if (breathTimer) clearInterval(breathTimer);
    };
  }, [isMeditating, timeLeft, breathPattern, exitSession]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div
      className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${isSpecialTheme
        ? "dark bg-zinc-900/50 border border-zinc-800/50"
        : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50"
        }`}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          BREATHING
        </h1>
      </div>
      {!isMeditating ? (
        <div className="flex flex-col items-center gap-6 py-8 w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className="absolute w-12 h-12 rounded-full bg-secondary-white dark:bg-secondary-black" />
              <IconWind className="w-6 h-6 text-secondary-black dark:text-secondary-white z-10" />
            </div>
            <h3 className="text-lg font-medium text-primary-black dark:text-secondary-white">
              Mindful Breathing
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-600 px-2">
              Choose a duration to begin your meditation
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            {meditationTimes.map((time) => (
              <button
                key={time.label}
                onClick={() => startMeditation(time)}
                className="w-full max-w-[220px] px-4 py-3 flex items-center justify-between bg-secondary-black text-white dark:text-gray-200 rounded-lg cursor-pointer transition-colors text-sm hover:opacity-85"
              >
                <span>{time.label}</span>
                <span className="text-xs opacity-70">
                  {time.pattern
                    .map((p) => p.phase.split("-")[0].charAt(0).toUpperCase())
                    .join(" · ")}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex w-full h-full flex-col items-center justify-between">
          <button
            onClick={exitSession}
            className="self-start p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Exit meditation session"
          >
            <IconChevronLeft className="w-5 h-5 text-primary-black dark:text-white" />
          </button>

          <div className="flex-1 flex items-center justify-center my-8">
            <div className="relative flex items-center justify-center w-44 h-44">
              <motion.div
                className="absolute w-full h-full rounded-full bg-blue-100 dark:bg-blue-900/50" // Added w-full h-full
                initial={{ scale: 0.5 }}
                animate={{
                  scale: shouldScale
                    ? breathPhase === "exhale" || breathPhase === "hold-exhale"
                      ? 0.5 + breathProgress * 0.8
                      : 0.5 + breathProgress * 0.9
                    : breathPhase === "hold-exhale"
                      ? 0.5
                      : 1.4, // Fallback scale when not scaling, might need adjustment
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
              // Removed style prop with width/height
              />

              <motion.div
                className="relative z-10 bg-secondary-white dark:bg-secondary-black rounded-full p-3"
                initial={{ scale: 0.85 }}
                animate={{
                  scale: shouldScale
                    ? 0.85 + breathProgress * 0.2
                    : breathPhase === "hold-exhale"
                      ? 0.85
                      : 1.05, // Fallback scale
                }}
                transition={{ duration: 1, ease: "easeInOut" }}
              >
                <IconWind className="w-6 h-6 text-blue-500 dark:text-blue-300" />
              </motion.div>
            </div>
          </div>

          <div className="text-center pb-4 space-y-2">
            <BreathMessage phase={breathPhase} />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatTime(timeLeft)}
            </p>
            <p className="text-xs text-primary-black dark:text-gray-300 opacity-50 px-2">
              Focus on the rhythm of your breath
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meditation;