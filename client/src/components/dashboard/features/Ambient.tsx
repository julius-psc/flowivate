"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconVinyl,
  IconMusic,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";
import { toast } from "sonner"; // Import Sonner toast

const soundData = {
  Airplane: { src: "/assets/audio/ambient-airplane.mp3", emoji: "✈️" },
  "Brown Noise": { src: "/assets/audio/ambient-brown.mp3", emoji: "🟫" },
  City: { src: "/assets/audio/ambient-city.mp3", emoji: "🏙️" },
  "Deep Water": { src: "/assets/audio/ambient-deepwater.mp3", emoji: "💧" },
  Fireplace: { src: "/assets/audio/ambient-fireplace.mp3", emoji: "🔥" },
  Forest: { src: "/assets/audio/ambient-forest.mp3", emoji: "🌲" },
  Library: { src: "/assets/audio/ambient-library.mp3", emoji: "📚" },
  "Ocean Waves": { src: "/assets/audio/ambient-ocean.mp3", emoji: "🌊" },
  Rain: { src: "/assets/audio/ambient-rain.mp3", emoji: "🌧️" },
  Summer: { src: "/assets/audio/ambient-summer.mp3", emoji: "☀️" },
  Thunderstorm: { src: "/assets/audio/ambient-thunderstorm.mp3", emoji: "⛈️" },
};

const ambientSoundNames = Object.keys(soundData);

const Ambient: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectorContainerRef = useRef<HTMLDivElement>(null);
  const vinylButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.onerror = () => {
      console.error(`Error loading audio source: ${audioRef.current?.src}`);
      toast.error("Failed to load audio. Please try another sound."); // Use toast
      setIsPlaying(false); // Still reset state
      setCurrentSound(null); // Still reset state
    };
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && currentSound) {
      const soundInfo = soundData[currentSound as keyof typeof soundData];
      const expectedSrc = soundInfo?.src;

      if (expectedSrc && !audioRef.current.src.endsWith(expectedSrc)) {
        audioRef.current.src = expectedSrc;
        if (!isPlaying) {
          audioRef.current.currentTime = 0;
        }
      }

      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error("Audio playback failed:", error);
          toast.error("Audio playback failed. Please try again."); // Use toast
          setIsPlaying(false); // Still update state
        });
      } else {
        audioRef.current.pause();
      }
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSound]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSelectorOpen &&
        selectorContainerRef.current &&
        !selectorContainerRef.current.contains(event.target as Node)
      ) {
        setIsSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelectorOpen]);

  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        setShowNotes(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowNotes(false);
    }
  }, [isPlaying]);

  const togglePlayPause = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!currentSound) return;
    setIsPlaying((prevIsPlaying) => !prevIsPlaying);
  };

  const toggleSelector = () => {
    setIsSelectorOpen((prevIsSelectorOpen) => !prevIsSelectorOpen);
  };

  const handleSoundSelect = (soundName: string) => {
    const soundInfo = soundData[soundName as keyof typeof soundData];
    if (!soundInfo || !audioRef.current) return;

    if (soundName !== currentSound) {
      setCurrentSound(soundName);
      setIsPlaying(true);
      // Optional: toast.success(`Playing ${soundName}`);
    } else {
      togglePlayPause();
    }
    setIsSelectorOpen(false);
  };

  const innerRadius = 70;
  const outerRadius = 130;
  const totalItems = ambientSoundNames.length;
  const angleStep = (2 * Math.PI) / totalItems;
  const buttonSize = 48;
  const placementRadius = (innerRadius + outerRadius) / 2;

  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          AMBIENT
        </h1>
        <span
          className="text-xs text-gray-500 dark:text-gray-400 truncate"
          aria-live="polite"
        >
          {currentSound || "Select Sound"}
        </span>
      </div>

      <div className="relative flex flex-grow flex-col items-center justify-center min-h-0 pt-16 pb-16">
        <div
          ref={selectorContainerRef}
          className="relative flex flex-col items-center justify-center"
        >
          <div className="relative flex items-center justify-center">
            {isSelectorOpen && (
              <div
                className="absolute z-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  width: `${outerRadius * 2}px`,
                  height: `${outerRadius * 2}px`,
                }}
                aria-label="Ambient sound options"
                role="menu"
              >
                {ambientSoundNames.map((soundName, index) => {
                  const angle = index * angleStep - Math.PI / 2;
                  const x = placementRadius * Math.cos(angle);
                  const y = placementRadius * Math.sin(angle);
                  const soundInfo =
                    soundData[soundName as keyof typeof soundData];

                  return (
                    <button
                      key={soundName}
                      onClick={() => handleSoundSelect(soundName)}
                      title={soundName}
                      className={`absolute flex items-center justify-center transition-all duration-150 ease-in-out pointer-events-auto
                                 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm
                                 text-secondary-black dark:text-secondary-white
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                                 ${
                                   currentSound === soundName
                                     ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg"
                                     : "ring-1 ring-gray-300 dark:ring-zinc-700 shadow-md"
                                 }
                                `}
                      style={{
                        width: `${buttonSize}px`,
                        height: `${buttonSize}px`,
                        borderRadius: "50%",
                        top: "50%",
                        left: "50%",
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      }}
                      aria-label={`Select ${soundName} sound`}
                      aria-checked={currentSound === soundName}
                      role="menuitemradio"
                    >
                      <div className="text-center">
                        <div className="text-lg" aria-hidden="true">
                          {soundInfo.emoji}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div
              ref={vinylButtonRef}
              className={`relative z-20 cursor-pointer group ${
                isPlaying ? "animate-spin-slow" : ""
              }`}
              onClick={toggleSelector}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && toggleSelector()
              }
              aria-label={
                isSelectorOpen
                  ? "Close sound selector"
                  : "Open ambient sound selector"
              }
              aria-haspopup="true"
              aria-expanded={isSelectorOpen}
              role="button"
              tabIndex={0}
            >
              <div
                className="absolute inset-0 rounded-full border border-gray-200/80 dark:border-gray-600/50 -m-3 pointer-events-none group-hover:border-gray-300/80 dark:group-hover:border-gray-500/60 transition-colors"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 rounded-full border border-gray-200/70 dark:border-gray-600/40 -m-6 pointer-events-none group-hover:border-gray-300/70 dark:group-hover:border-gray-500/50 transition-colors delay-75"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 rounded-full border border-gray-200/60 dark:border-gray-600/30 -m-9 pointer-events-none group-hover:border-gray-300/60 dark:group-hover:border-gray-500/40 transition-colors delay-150"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 rounded-full border border-gray-200/50 dark:border-gray-600/20 -m-12 pointer-events-none group-hover:border-gray-300/50 dark:group-hover:border-gray-500/30 transition-colors delay-200"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 rounded-full border border-gray-200/40 dark:border-gray-600/10 -m-15 pointer-events-none group-hover:border-gray-300/40 dark:group-hover:border-gray-500/20 transition-colors delay-300"
                aria-hidden="true"
              />
              <div
                className={`relative bg-white dark:bg-zinc-700 p-2.5 rounded-full border-2 border-gray-300 dark:border-zinc-600 shadow-md group-hover:shadow-lg transition-all ${
                  isSelectorOpen
                    ? "ring-2 ring-blue-500 dark:ring-blue-400"
                    : ""
                }`}
              >
                <IconVinyl
                  size={32}
                  className="text-primary-black dark:text-gray-200"
                />
              </div>
            </div>

            {showNotes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note1"
                  style={{ position: "absolute", top: "10%", left: "45%" }}
                  aria-hidden="true"
                >
                  <IconMusic size={16} />
                </div>
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note2"
                  style={{ position: "absolute", top: "10%", left: "50%" }}
                  aria-hidden="true"
                >
                  <IconMusic size={14} />
                </div>
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note3"
                  style={{ position: "absolute", top: "10%", left: "55%" }}
                  aria-hidden="true"
                >
                  <IconMusic size={15} />
                </div>
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note4"
                  style={{ position: "absolute", top: "10%", left: "48%" }}
                  aria-hidden="true"
                >
                  <IconMusic size={13} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={togglePlayPause}
            className={`mt-4 p-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-full transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:bg-gray-200 dark:hover:bg-zinc-600 disabled:hover:bg-gray-100 dark:disabled:hover:bg-zinc-700`}
            disabled={!currentSound}
            aria-label={
              isPlaying ? "Pause ambient sound" : "Play ambient sound"
            }
            aria-pressed={isPlaying}
          >
            {isPlaying ? (
              <IconPlayerPause size={20} />
            ) : (
              <IconPlayerPlay size={20} />
            )}
          </button>
        </div>
      </div>

      <div style={{ display: "none" }} aria-hidden="true">
        {Object.values(soundData).map((sound) => (
          <link key={sound.src} rel="preload" href={sound.src} as="audio" />
        ))}
      </div>
    </div>
  );
};

export default Ambient;