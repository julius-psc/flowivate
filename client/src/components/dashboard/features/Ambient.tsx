"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { IconChevronDown } from "@tabler/icons-react";
import {
  useAmbientSound,
  ambientSoundNames,
  AmbientSoundName,
} from "@/hooks/useAmbientSound";
import { specialSceneThemeNames } from "@/lib/themeConfig";
import { Skeleton } from "@/components/ui/Skeleton";
import { motion, AnimatePresence } from "motion/react";

const Ambient: React.FC = () => {
  const {
    isPlaying,
    currentSound,
    availableSounds,
    selectSound,
    playSound,
    pauseSound,
    volume,
    setVolume,
  } = useAmbientSound();

  const [isMounted, setIsMounted] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { theme } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const isSpecialTheme =
    isMounted &&
    !!theme &&
    specialSceneThemeNames.includes(
      theme as (typeof specialSceneThemeNames)[number]
    );

  const soundsForDisplay = ambientSoundNames.filter((name) => name !== "None");

  const handleSoundSelect = (soundName: AmbientSoundName) => {
    selectSound(soundName);
    setIsDropdownOpen(false);
  };

  const handleVinylClick = () => {
    if (currentSound && currentSound !== "None") {
      if (isPlaying) {
        pauseSound();
      } else {
        playSound();
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  // Get current sound info
  const currentSoundInfo = currentSound && currentSound !== "None"
    ? availableSounds[currentSound as AmbientSoundName]
    : null;

  // Dynamic styling
  const containerBg = isSpecialTheme
    ? "dark bg-zinc-900/50 border border-zinc-800/50"
    : "bg-white/80 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50";

  const headerText = isSpecialTheme
    ? "text-white/70"
    : "text-secondary-black dark:text-secondary-white";

  const subtleText = isSpecialTheme
    ? "text-white/40"
    : "text-gray-400 dark:text-gray-500";

  // Vinyl colors - lighter for light mode
  const vinylOuter = isSpecialTheme
    ? "bg-zinc-800"
    : "bg-white dark:bg-zinc-800 border border-gray-200/50 dark:border-transparent";

  const vinylInner = isSpecialTheme
    ? "bg-zinc-900"
    : "bg-gray-50 dark:bg-zinc-900";

  const vinylGroove = isSpecialTheme
    ? "border-zinc-700/30"
    : "border-gray-200/60 dark:border-zinc-700/30";

  const vinylCenter = isSpecialTheme
    ? "bg-zinc-700"
    : "bg-gray-100 dark:bg-zinc-700";

  const vinylSpindle = isSpecialTheme
    ? "bg-zinc-950"
    : "bg-gray-300 dark:bg-zinc-950";

  const dropdownBg = isSpecialTheme
    ? "bg-zinc-800/95 border-zinc-700/50"
    : "bg-white/95 dark:bg-zinc-800/95 border-gray-200 dark:border-zinc-700/50";

  const dropdownItemHover = isSpecialTheme
    ? "hover:bg-white/10"
    : "hover:bg-gray-100 dark:hover:bg-zinc-700/50";

  const volumeTrackBg = isSpecialTheme
    ? "bg-zinc-700/50"
    : "bg-gray-200/80 dark:bg-zinc-700/50";

  // Loading skeleton
  if (!isMounted) {
    return (
      <div className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full ${containerBg}`}>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="w-28 h-28 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 backdrop-blur-md rounded-xl flex flex-col h-full relative ${containerBg}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h1 className={`text-sm tracking-wider font-medium opacity-60 ${headerText}`}>
          AMBIENT
        </h1>
        {currentSound && currentSound !== "None" && (
          <button
            onClick={() => selectSound("None" as AmbientSoundName)}
            className={`text-xs font-medium transition-colors ${subtleText} hover:opacity-100`}
          >
            Stop
          </button>
        )}
      </div>

      {/* Main content with conditional volume slider */}
      <div className="flex-1 flex items-stretch gap-3">
        {/* Minimal Volume Slider - only when playing */}
        <AnimatePresence>
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 12 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center py-6"
            >
              <div className="relative h-full w-1.5 flex flex-col items-center justify-center">
                {/* Volume track */}
                <div className={`absolute inset-0 w-full rounded-full ${volumeTrackBg}`} />

                {/* Filled portion */}
                <div
                  className="absolute bottom-0 w-full rounded-full bg-primary-blue transition-all"
                  style={{ height: `${(volume ?? 0.5) * 100}%` }}
                />

                {/* Invisible range input */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume ?? 0.5}
                  onChange={handleVolumeChange}
                  className="absolute h-full w-4 opacity-0 cursor-pointer"
                  style={{
                    writingMode: "vertical-lr",
                    direction: "rtl",
                  }}
                  title={`Volume: ${Math.round((volume ?? 0.5) * 100)}%`}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vinyl and controls */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative">
            {/* Colorful ambient glow behind vinyl - only when playing */}
            <AnimatePresence>
              {isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute -inset-3 pointer-events-none"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl bg-pink-400/40"
                    animate={{ opacity: [0.4, 0.1, 0.1, 0.4] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl bg-blue-400/40"
                    animate={{ opacity: [0.1, 0.4, 0.1, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl bg-purple-400/40"
                    animate={{ opacity: [0.1, 0.1, 0.4, 0.1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full blur-xl bg-cyan-400/40"
                    animate={{ opacity: [0.1, 0.1, 0.1, 0.4] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Vinyl Record */}
            <motion.div
              onClick={handleVinylClick}
              className={`relative w-28 h-28 rounded-full cursor-pointer shadow-lg ${vinylOuter}`}
              animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
              transition={isPlaying ? { duration: 8, repeat: Infinity, ease: "linear" } : { duration: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              title={currentSoundInfo ? (isPlaying ? "Click to pause" : "Click to play") : "Select a sound first"}
            >
              {/* Inner vinyl layer */}
              <div className={`absolute inset-1 rounded-full ${vinylInner}`} />

              {/* Vinyl grooves */}
              <div className={`absolute inset-2 rounded-full border ${vinylGroove}`} />
              <div className={`absolute inset-4 rounded-full border ${vinylGroove}`} />
              <div className={`absolute inset-6 rounded-full border ${vinylGroove}`} />
              <div className={`absolute inset-8 rounded-full border ${vinylGroove}`} />

              {/* Center label */}
              <div className={`absolute inset-0 m-auto w-10 h-10 rounded-full flex items-center justify-center ${vinylCenter}`}>
                {currentSoundInfo && (
                  <span className="text-xl">{currentSoundInfo.emoji}</span>
                )}
              </div>

              {/* Spindle hole - hidden when playing */}
              {!isPlaying && (
                <div className={`absolute inset-0 m-auto w-1.5 h-1.5 rounded-full ${vinylSpindle}`} />
              )}
            </motion.div>

            {/* Tonearm - vertical by default, longer and positioned away from disk */}
            <motion.div
              className={`absolute -right-2 top-1/2 -translate-y-1/2 w-0.5 h-9 rounded-full origin-bottom ${isSpecialTheme ? "bg-zinc-500" : "bg-gray-400 dark:bg-zinc-500"
                }`}
              animate={isPlaying ? { rotate: -45 } : { rotate: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Sound selector */}
          <div className="mt-3 relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 group"
            >
              {/* Green dot when playing */}
              {isPlaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-0.5" />
              )}
              <span className={`text-xs ${subtleText}`}>
                {currentSoundInfo ? "Playing" : "Select a"}
              </span>
              <span className={`text-xs font-medium underline underline-offset-2 transition-colors ${isSpecialTheme
                ? "text-white/70 decoration-white/30 group-hover:text-white group-hover:decoration-white/50"
                : "text-gray-600 dark:text-gray-300 decoration-gray-300 dark:decoration-gray-500 group-hover:text-gray-900 dark:group-hover:text-white group-hover:decoration-gray-400 dark:group-hover:decoration-gray-400"
                }`}>
                {currentSoundInfo ? currentSound : "sound"}
              </span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <IconChevronDown size={12} className={`${subtleText} group-hover:opacity-100`} />
              </motion.div>
            </button>

            {/* Compact dropdown popup - appears above */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-32 max-h-40 overflow-y-auto rounded-lg border shadow-xl backdrop-blur-xl z-50 ${dropdownBg}`}
                >
                  <div className="py-1">
                    {soundsForDisplay.map((soundName) => {
                      const soundInfo = availableSounds[soundName as AmbientSoundName];
                      const isActive = currentSound === soundName;

                      return (
                        <button
                          key={soundName}
                          onClick={() => handleSoundSelect(soundName as AmbientSoundName)}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors ${dropdownItemHover} ${isActive ? "bg-primary-blue/10" : ""
                            }`}
                        >
                          <span className="text-sm">{soundInfo.emoji}</span>
                          <span className={`text-[11px] truncate ${isActive
                            ? "text-primary-blue font-medium"
                            : isSpecialTheme
                              ? "text-white/70"
                              : "text-gray-600 dark:text-gray-300"
                            }`}>
                            {soundName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Preload audio files */}
      <div style={{ display: "none" }} aria-hidden="true">
        {Object.values(availableSounds)
          .filter((s) => s.src)
          .map((sound) => (
            <link key={sound.src} rel="preload" href={sound.src} as="audio" />
          ))}
      </div>
    </div>
  );
};

export default Ambient;