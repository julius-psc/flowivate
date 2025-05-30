"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  IconVinyl,
  IconMusic,
  IconPlayerPlay,
  IconPlayerPause,
} from "@tabler/icons-react";
// Import the hook and types
import { useAmbientSound, ambientSoundNames, AmbientSoundName } from "@/hooks/useAmbientSound";

// Feature component using the hook
const Ambient: React.FC = () => {
  // Use the hook to manage sound state and controls
  const {
    isPlaying,
    currentSound,
    availableSounds,
    selectSound,
    playSound,
    pauseSound,
  } = useAmbientSound();

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const selectorContainerRef = useRef<HTMLDivElement>(null);
  const vinylButtonRef = useRef<HTMLDivElement>(null);


  // Click outside logic remains the same
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

  // Show notes animation logic remains the same
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
    if (!currentSound || currentSound === 'None') return;
    if (isPlaying) {
      pauseSound();
    } else {
      playSound();
    }
  };

  const toggleSelector = () => {
    setIsSelectorOpen((prevIsSelectorOpen) => !prevIsSelectorOpen);
  };

  const handleSoundSelect = (soundName: AmbientSoundName) => {
    selectSound(soundName); // Use the hook's select function
    setIsSelectorOpen(false);
  };

  // Radial layout calculation remains the same
  const innerRadius = 70;
  const outerRadius = 130;
  // Exclude 'None' from radial display if desired, or handle its display
  const soundsForDisplay = ambientSoundNames.filter(name => name !== 'None');
  const totalItems = soundsForDisplay.length;
  const angleStep = (2 * Math.PI) / totalItems;
  const buttonSize = 48;
  const placementRadius = (innerRadius + outerRadius) / 2;

  // JSX structure remains largely the same, but uses hook state/functions
  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          AMBIENT
        </h1>
        <span
          className="text-xs text-gray-500 dark:text-gray-400 truncate"
          aria-live="polite"
        >
          {currentSound && currentSound !== 'None' ? currentSound : "Select Sound"}
        </span>
      </div>

      {/* Main Content */}
      <div className="relative flex flex-grow flex-col items-center justify-center min-h-0 pt-16 pb-16">
        <div
          ref={selectorContainerRef}
          className="relative flex flex-col items-center justify-center"
        >
          {/* Radial Selector */}
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
                {soundsForDisplay.map((soundName, index) => {
                   // Calculation remains the same
                   const angle = index * angleStep - Math.PI / 2;
                   const x = placementRadius * Math.cos(angle);
                   const y = placementRadius * Math.sin(angle);
                   const soundInfo = availableSounds[soundName as AmbientSoundName];

                  return (
                    <button
                      key={soundName}
                      // Use handleSoundSelect which calls the hook's selectSound
                      onClick={() => handleSoundSelect(soundName as AmbientSoundName)}
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
                      style={{ /* Style remains the same */
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

            {/* Vinyl Button */}
            <div
              ref={vinylButtonRef}
              className={`relative z-20 cursor-pointer group ${
                isPlaying ? "animate-spin-slow" : "" // Use hook's isPlaying
              }`}
              onClick={toggleSelector}
              // A11y attributes remain the same
               aria-label={ isSelectorOpen ? "Close sound selector" : "Open ambient sound selector" }
               aria-haspopup="true"
               aria-expanded={isSelectorOpen}
               role="button"
               tabIndex={0}
               onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSelector()}
            >
                {/* Decorative borders remain */}
                <div className="absolute inset-0 rounded-full border border-gray-200/80 dark:border-gray-600/50 -m-3 pointer-events-none group-hover:border-gray-300/80 dark:group-hover:border-gray-500/60 transition-colors" aria-hidden="true" />
                <div className="absolute inset-0 rounded-full border border-gray-200/70 dark:border-gray-600/40 -m-6 pointer-events-none group-hover:border-gray-300/70 dark:group-hover:border-gray-500/50 transition-colors delay-75" aria-hidden="true" />
                <div className="absolute inset-0 rounded-full border border-gray-200/60 dark:border-gray-600/30 -m-9 pointer-events-none group-hover:border-gray-300/60 dark:group-hover:border-gray-500/40 transition-colors delay-150" aria-hidden="true" />
                <div className="absolute inset-0 rounded-full border border-gray-200/50 dark:border-gray-600/20 -m-12 pointer-events-none group-hover:border-gray-300/50 dark:group-hover:border-gray-500/30 transition-colors delay-200" aria-hidden="true" />
                <div className="absolute inset-0 rounded-full border border-gray-200/40 dark:border-gray-600/10 -m-15 pointer-events-none group-hover:border-gray-300/40 dark:group-hover:border-gray-500/20 transition-colors delay-300" aria-hidden="true" />
                {/* Central vinyl icon */}
                <div className={`relative bg-white dark:bg-zinc-700 p-2.5 rounded-full border-2 border-gray-300 dark:border-zinc-600 shadow-md group-hover:shadow-lg transition-all ${ isSelectorOpen ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}`}>
                    <IconVinyl size={32} className="text-primary-black dark:text-gray-200" />
                </div>
            </div>

             {/* Music Notes Animation (uses hook's isPlaying) */}
             {showNotes && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  {/* Notes definitions remain */}
                  <div className="absolute text-blue-500 dark:text-blue-400 animate-float-note1" style={{ position: 'absolute', top: '10%', left: '45%' }} aria-hidden="true"><IconMusic size={16} /></div>
                  <div className="absolute text-blue-500 dark:text-blue-400 animate-float-note2" style={{ position: 'absolute', top: '10%', left: '50%' }} aria-hidden="true"><IconMusic size={14} /></div>
                  <div className="absolute text-blue-500 dark:text-blue-400 animate-float-note3" style={{ position: 'absolute', top: '10%', left: '55%' }} aria-hidden="true"><IconMusic size={15} /></div>
                  <div className="absolute text-blue-500 dark:text-blue-400 animate-float-note4" style={{ position: 'absolute', top: '10%', left: '48%' }} aria-hidden="true"><IconMusic size={13} /></div>
                </div>
            )}
          </div>

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause} // Uses the toggle function connected to the hook
            className={`mt-4 p-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-full transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:bg-gray-200 dark:hover:bg-zinc-600 disabled:hover:bg-gray-100 dark:disabled:hover:bg-zinc-700`}
            disabled={!currentSound || currentSound === 'None'} // Disable if no sound selected or 'None'
            aria-label={
              isPlaying ? "Pause ambient sound" : "Play ambient sound" // Use hook's isPlaying
            }
            aria-pressed={isPlaying} // Use hook's isPlaying
          >
            {/* Icon changes based on hook's isPlaying */}
            {isPlaying ? (
              <IconPlayerPause size={20} />
            ) : (
              <IconPlayerPlay size={20} />
            )}
          </button>
        </div>
      </div>

       {/* Preload links can remain if desired */}
       <div style={{ display: 'none' }} aria-hidden="true">
           {Object.values(availableSounds).filter(s => s.src).map((sound) => (
               <link key={sound.src} rel="preload" href={sound.src} as="audio" />
           ))}
       </div>
    </div>
  );
};

export default Ambient;