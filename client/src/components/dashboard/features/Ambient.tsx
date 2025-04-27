import React, { useState, useEffect, useRef } from 'react';
// Using specific icons for clarity
import { IconVinyl, IconMusic, IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

// Define sound data with unique emojis
// NOTE: Ensure these audio paths are correct relative to your public/assets folder
const soundData = {
  'Airplane': { src: '/assets/audio/ambient-airplane.mp3', emoji: '✈️' },
  'Brown Noise': { src: '/assets/audio/ambient-brown.mp3', emoji: '🟫' },
  'City': { src: '/assets/audio/ambient-city.mp3', emoji: '🏙️' },
  'Deep Water': { src: '/assets/audio/ambient-deepwater.mp3', emoji: '💧' },
  'Fireplace': { src: '/assets/audio/ambient-fireplace.mp3', emoji: '🔥' },
  'Forest': { src: '/assets/audio/ambient-forest.mp3', emoji: '🌲' },
  'Library': { src: '/assets/audio/ambient-library.mp3', emoji: '📚' },
  'Ocean Waves': { src: '/assets/audio/ambient-ocean.mp3', emoji: '🌊' },
  'Rain': { src: '/assets/audio/ambient-rain.mp3', emoji: '🌧️' },
  'Summer': { src: '/assets/audio/ambient-summer.mp3', emoji: '☀️' },
  'Thunderstorm': { src: '/assets/audio/ambient-thunderstorm.mp3', emoji: '⛈️' },
};

const ambientSoundNames = Object.keys(soundData);

const Ambient: React.FC = () => {
  // --- State ---
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  // --- Refs ---
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectorContainerRef = useRef<HTMLDivElement>(null); // Ref for the container holding vinyl + options
  const vinylButtonRef = useRef<HTMLDivElement>(null); // Ref specifically for the vinyl button

  // --- Effects ---

  // Initialize and cleanup audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true; // Loop the ambient sound
    audioRef.current.onerror = () => {
      console.error(`Error loading audio source: ${audioRef.current?.src}`);
      // Handle error state, e.g., show a message to the user
      setIsPlaying(false);
      setCurrentSound(null); // Reset sound selection on error
    };
    // Cleanup function to pause audio and release resources
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null; // Help garbage collection
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handle audio playback based on isPlaying and currentSound state
  useEffect(() => {
    if (audioRef.current && currentSound) {
      const soundInfo = soundData[currentSound as keyof typeof soundData];
      const expectedSrc = soundInfo?.src;

      // Check if the source needs updating
      if (expectedSrc && !audioRef.current.src.endsWith(expectedSrc)) {
        // console.log(`Setting audio source to: ${expectedSrc}`);
        audioRef.current.src = expectedSrc;
        // Reset time only if source changes while paused, or when starting new sound
         if (!isPlaying) {
             audioRef.current.currentTime = 0;
         }
      }

      // Play or pause based on state
      if (isPlaying) {
        // Attempt to play, handling potential errors
        audioRef.current.play().catch(error => {
          console.error('Audio playback failed:', error);
          // Optionally update UI to reflect playback failure
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    } else if (audioRef.current) {
      // Ensure audio is paused if no sound is selected
      audioRef.current.pause();
    }
  }, [isPlaying, currentSound]); // Re-run effect when isPlaying or currentSound changes

  // Handle clicks outside the selector to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close if selector is open and the click is outside the selector's container
      if (
        isSelectorOpen &&
        selectorContainerRef.current &&
        !selectorContainerRef.current.contains(event.target as Node)
      ) {
        setIsSelectorOpen(false);
      }
    };
    // Add listener on mount
    document.addEventListener('mousedown', handleClickOutside);
    // Remove listener on cleanup
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSelectorOpen]); // Re-run effect when isSelectorOpen changes

  // Delayed display of notes to ensure proper animation sequencing
  useEffect(() => {
    if (isPlaying) {
      // Small delay before showing notes to ensure CSS animations start fresh
      const timer = setTimeout(() => {
        setShowNotes(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setShowNotes(false);
    }
  }, [isPlaying]);

  // --- Handlers ---

  // Toggle play/pause state
  const togglePlayPause = (event?: React.MouseEvent) => {
    event?.stopPropagation(); // Prevent event bubbling
    if (!currentSound) return; // Do nothing if no sound is selected
    setIsPlaying(prevIsPlaying => !prevIsPlaying);
  };

  // Toggle the visibility of the sound selector
  const toggleSelector = () => {
    setIsSelectorOpen(prevIsSelectorOpen => !prevIsSelectorOpen);
  };

  // Handle selection of a new sound
  const handleSoundSelect = (soundName: string) => {
    const soundInfo = soundData[soundName as keyof typeof soundData];
    if (!soundInfo || !audioRef.current) return; // Exit if sound data or audio element is missing

    if (soundName !== currentSound) {
      // If selecting a *new* sound:
      setCurrentSound(soundName); // Update the current sound state
      // Source is set in the useEffect hook based on currentSound
      setIsPlaying(true); // Start playing the new sound immediately
    } else {
      // If selecting the *same* sound:
      togglePlayPause(); // Just toggle play/pause
    }
    setIsSelectorOpen(false); // Close the selector after selection
  };

  // --- Layout Calculations ---
  const innerRadius = 70; // Slightly smaller inner radius
  const outerRadius = 130; // Slightly smaller outer radius
  const totalItems = ambientSoundNames.length;
  const angleStep = (2 * Math.PI) / totalItems; // Angle between each button
  const buttonSize = 48; // Smaller buttons
  const placementRadius = (innerRadius + outerRadius) / 2; // Adjusted placement radius

  // --- Render ---
  return (
    <div className="relative p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full overflow-hidden">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
      <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">AMBIENT</h1>
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate" aria-live="polite">
          {currentSound || 'Select Sound'}
        </span>
      </div>

      {/* Central Interactive Area */}
      <div className="relative flex flex-grow flex-col items-center justify-center min-h-0 pt-16 pb-16"> {/* Adjusted padding */}

        {/* Container for Vinyl, Circles, Selector, and Play/Pause Button */}
        <div ref={selectorContainerRef} className="relative flex flex-col items-center justify-center">

          {/* Vinyl Icon, Concentric Circles, and Sound Selector */}
          <div className="relative flex items-center justify-center">

            {/* Circular Sound Selector Options (Appears when isSelectorOpen is true) */}
            {isSelectorOpen && (
              <div
                className="absolute z-30 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ width: `${outerRadius * 2}px`, height: `${outerRadius * 2}px` }}
                aria-label="Ambient sound options"
                role="menu"
              >
                {ambientSoundNames.map((soundName, index) => {
                  const angle = index * angleStep - Math.PI / 2; // Calculate angle for positioning
                  const x = placementRadius * Math.cos(angle);
                  const y = placementRadius * Math.sin(angle);
                  const soundInfo = soundData[soundName as keyof typeof soundData];

                  return (
                    <button
                      key={soundName}
                      onClick={() => handleSoundSelect(soundName)}
                      title={soundName} // Tooltip on hover
                      className={`absolute flex items-center justify-center transition-all duration-150 ease-in-out pointer-events-auto
                                 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm
                                 text-secondary-black dark:text-secondary-white
                                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
                                 /* ** Removed hover ring effect to prevent movement ** */
                                 ${currentSound === soundName
                                    ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg' // Highlight active sound
                                    : 'ring-1 ring-gray-300 dark:ring-zinc-700 shadow-md' // Base ring and shadow, NO hover ring change
                                  }
                                `}
                      style={{
                        width: `${buttonSize}px`,
                        height: `${buttonSize}px`,
                        borderRadius: '50%',
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      }}
                      aria-label={`Select ${soundName} sound`}
                      aria-checked={currentSound === soundName}
                      role="menuitemradio"
                    >
                      <div className="text-center">
                        <div className="text-lg" aria-hidden="true">{soundInfo.emoji}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Vinyl Icon Button & Concentric Circles */}
            <div
              ref={vinylButtonRef}
              className={`relative z-20 cursor-pointer group ${isPlaying ? 'animate-spin-slow' : ''}`}
              onClick={toggleSelector}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleSelector()}
              aria-label={isSelectorOpen ? "Close sound selector" : "Open ambient sound selector"}
              aria-haspopup="true"
              aria-expanded={isSelectorOpen}
              role="button"
              tabIndex={0}
            >
              {/* Concentric Circles (Decorative) */}
              <div className="absolute inset-0 rounded-full border border-gray-200/80 dark:border-gray-600/50 -m-3 pointer-events-none group-hover:border-gray-300/80 dark:group-hover:border-gray-500/60 transition-colors" aria-hidden="true" />
              <div className="absolute inset-0 rounded-full border border-gray-200/70 dark:border-gray-600/40 -m-6 pointer-events-none group-hover:border-gray-300/70 dark:group-hover:border-gray-500/50 transition-colors delay-75" aria-hidden="true" />
              <div className="absolute inset-0 rounded-full border border-gray-200/60 dark:border-gray-600/30 -m-9 pointer-events-none group-hover:border-gray-300/60 dark:group-hover:border-gray-500/40 transition-colors delay-150" aria-hidden="true" />
              <div className="absolute inset-0 rounded-full border border-gray-200/50 dark:border-gray-600/20 -m-12 pointer-events-none group-hover:border-gray-300/50 dark:group-hover:border-gray-500/30 transition-colors delay-200" aria-hidden="true" />
              <div className="absolute inset-0 rounded-full border border-gray-200/40 dark:border-gray-600/10 -m-15 pointer-events-none group-hover:border-gray-300/40 dark:group-hover:border-gray-500/20 transition-colors delay-300" aria-hidden="true" />

              {/* Vinyl Icon itself */}
              <div className={`relative bg-white dark:bg-zinc-700 p-2.5 rounded-full border-2 border-gray-300 dark:border-zinc-600 shadow-md group-hover:shadow-lg transition-all ${isSelectorOpen ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
                <IconVinyl size={32} className="text-primary-black dark:text-gray-200" />
              </div>
            </div>

            {/* Animated Music Notes (Appear when playing) - IMPROVED POSITIONING AND ANIMATION */}
            {showNotes && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {/* First note - Left-leaning path */}
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note1"
                  style={{
                    position: 'absolute',
                    top: '10%',  // Positioned at the top of the vinyl
                    left: '45%', // Slightly to the left
                  }}
                  aria-hidden="true"
                >
                  <IconMusic size={16} />
                </div>
                
                {/* Second note - Centered upward path */}
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note2"
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '50%', // Center aligned
                  }}
                  aria-hidden="true"
                >
                  <IconMusic size={14} />
                </div>
                
                {/* Third note - Right-leaning path */}
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note3"
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '55%', // Slightly to the right
                  }}
                  aria-hidden="true"
                >
                  <IconMusic size={15} />
                </div>
                
                {/* Fourth note - Additional left path for continuous effect */}
                <div
                  className="absolute text-blue-500 dark:text-blue-400 animate-float-note4"
                  style={{
                    position: 'absolute',
                    top: '10%',
                    left: '48%', // Between left and center
                  }}
                  aria-hidden="true"
                >
                  <IconMusic size={13} />
                </div>
              </div>
            )}
          </div> {/* End of Vinyl/Circles/Selector container */}

          {/* Play/Pause Button */}
          <button
            onClick={togglePlayPause}
            className={`mt-4 p-2 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-200 rounded-full transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900 focus:ring-blue-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:bg-gray-200 dark:hover:bg-zinc-600 disabled:hover:bg-gray-100 dark:disabled:hover:bg-zinc-700`}
            disabled={!currentSound}
            aria-label={isPlaying ? "Pause ambient sound" : "Play ambient sound"}
            aria-pressed={isPlaying}
          >
            {isPlaying ? <IconPlayerPause size={20} /> : <IconPlayerPlay size={20} />}
          </button>

        </div> {/* End of Container for Vinyl + Play/Pause */}
      </div> {/* End of Central Interactive Area */}

      {/* Preload audio sources */}
      <div style={{ display: 'none' }} aria-hidden="true">
        {Object.values(soundData).map(sound => (
          <link key={sound.src} rel="preload" href={sound.src} as="audio" />
        ))}
      </div>
    </div>
  );
};

export default Ambient;