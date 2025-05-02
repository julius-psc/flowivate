import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner"; // Assuming you use 'sonner' for toasts

// Define the structure for sound data
interface SoundInfo {
  src: string;
  emoji: string;
}

// Centralized sound data configuration
// IMPORTANT: Ensure these paths EXACTLY match the files in your `/public/assets/audio/` directory (case-sensitive!)
const soundData: Record<string, SoundInfo> = {
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
  // Add a 'None' option to represent no sound selected or stop
  None: { src: "", emoji: "🚫" },
};

// Export sound names and create a type for them
export const ambientSoundNames = Object.keys(soundData);
export type AmbientSoundName = keyof typeof soundData;

// Define the interface for the hook's return value
export interface AmbientSoundHook {
  isPlaying: boolean;
  currentSound: AmbientSoundName | null;
  availableSounds: typeof soundData;
  selectSound: (soundName: AmbientSoundName) => void;
  playSound: () => void;
  pauseSound: () => void;
  stopSound: () => void; // Added for explicit stopping
}

// The custom hook implementation
export const useAmbientSound = (): AmbientSoundHook => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSound, setCurrentSound] = useState<AmbientSoundName | null>(null);
  // Ref to hold the HTMLAudioElement instance
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect for initializing and cleaning up the Audio element
  useEffect(() => {
    console.log("Initializing Audio element...");
    audioRef.current = new Audio();
    audioRef.current.loop = true; // Set audio to loop

    // --- Updated onerror Handler ---
    audioRef.current.onerror = () => {
      // Capture the ref value immediately in case it changes (e.g., during cleanup)
      const currentAudioElement = audioRef.current;
      console.log("onerror triggered. audioRef.current at time of trigger:", currentAudioElement);

      if (!currentAudioElement) {
        // If the element is null, it means cleanup likely ran before this handler could fully execute.
        // This is the most likely reason for seeing 'undefined' in the original error log.
        console.warn("Audio onerror handler executed after audio element cleanup. Source cannot be determined.");
        // Avoid state updates here if the component might already be unmounted.
        // toast.error("Failed to load audio (element cleaned up).");
        return; // Exit early, can't get source info
      }

      // If the element exists, log the source it *tried* to load.
      // This will help identify if it was an empty string, a wrong path, etc.
      console.error(`Error loading audio source: ${currentAudioElement.src}`);
      toast.error(`Failed to load: ${currentAudioElement.src || 'N/A'}. Check path & network.`);

      // Reset playback state.
      // Note: Be cautious setting state in async callbacks like onerror, especially
      // if the component might unmount. A more robust solution might involve an isMounted ref check.
      setIsPlaying(false);
      setCurrentSound(null); // Resetting helps prevent trying to play the broken sound again.
    };

    // --- Cleanup function ---
    // Runs when the component using the hook unmounts
    return () => {
      console.log("Cleaning up Audio element...");
      if (audioRef.current) {
        audioRef.current.pause(); // Stop playback
        audioRef.current.removeAttribute('src'); // More robust way to clear source
        audioRef.current.load(); // Abort loading/playback
        audioRef.current.onerror = null; // Remove the error handler
        audioRef.current = null; // Release the reference
        console.log("Audio element cleaned up successfully.");
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount

  // Effect to handle source changes and play/pause commands
  useEffect(() => {
    const audio = audioRef.current;

    // If no audio element exists, or no sound is selected ('None' or null), ensure paused.
    if (!audio || !currentSound || currentSound === 'None') {
      if (audio?.src) { // Only pause if it was potentially playing something
          console.log("Pausing audio (no sound selected or 'None').");
          audio.pause();
      }
      return; // Exit early
    }

    // Get the details for the currently selected sound
    const soundInfo = soundData[currentSound];
    const expectedSrc = soundInfo?.src;

    // Should not happen if soundData is correct, but good safeguard
    if (!expectedSrc) {
        console.warn(`No source found for selected sound: ${currentSound}`);
        if(audio.src) audio.pause();
        return;
    }

    // Check if the source needs to be updated
    // Comparing full URLs is more reliable than endsWith if the base URL could change
    const currentFullSrc = audio.src;
    const expectedFullSrc = new URL(expectedSrc, window.location.origin).href; // Resolve relative URL

    if (currentFullSrc !== expectedFullSrc) {
      console.log(`Setting audio source to: ${expectedSrc} (Full: ${expectedFullSrc})`);
      audio.src = expectedSrc; // Set the new source
      // Reset time only if source changes *and* we are not intending to play immediately
      // If isPlaying is true, play() below will handle starting from the beginning or resuming
      // If isPlaying is false, resetting time ensures it starts fresh next time play is called
       if (!isPlaying) {
           // audio.currentTime = 0; // Might cause issues if changed while loading, handled by play() or load() implicitly
           audio.load(); // Explicitly load new source
       }
    }

    // Handle play/pause based on isPlaying state
    if (isPlaying) {
      console.log(`Attempting to play: ${currentSound} (Source: ${audio.src})`);
      // Play the audio. Modern browsers return a Promise.
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Playback started successfully
          console.log(`Playback started for: ${currentSound}`);
        }).catch((error) => {
          // Playback failed - often due to user interaction needed or load errors
          console.error(`Audio playback failed for ${currentSound}:`, error);
          // Don't automatically show toast here, onerror handles load errors.
          // This catch handles errors like "play() request interrupted" or needing user gesture.
          if (error.name === 'NotAllowedError') {
            toast.info("Click the play button to start audio.");
          } else if (error.name !== 'AbortError') { // Ignore AbortError from changing src/pausing quickly
            toast.error(`Playback error: ${error.message}`);
          }
          setIsPlaying(false); // Reset state on playback error
        });
      }
    } else {
      console.log(`Pausing audio (Source: ${audio.src})`);
      audio.pause();
    }
  }, [isPlaying, currentSound]); // Re-run when play state or selected sound changes

  // --- Control Functions ---

  const selectSound = useCallback((soundName: AmbientSoundName) => {
    console.log(`Selecting sound: ${soundName}`);
    const audio = audioRef.current;

    if (soundName === 'None') {
      if (currentSound !== 'None') { // Only change state if it wasn't already None
        setCurrentSound('None');
        setIsPlaying(false); // Stop playing if 'None' is selected
        if (audio) {
          audio.pause(); // Ensure paused
          if (audio.src) {
             audio.removeAttribute('src'); // Clear source
             audio.load(); // Reset
          }
        }
      }
    } else if (soundName !== currentSound) {
      // New sound selected
      setCurrentSound(soundName);
      // If it wasn't playing before, set to play. If it was, it will continue playing (useEffect handles src change).
      setIsPlaying(true); // Automatically play the new sound
    } else {
      // Same sound clicked again - toggle play/pause
      setIsPlaying((prev) => !prev);
    }
  }, [currentSound]); // Dependency: currentSound

  const playSound = useCallback(() => {
    // Play only if a valid sound (not None or null) is selected
    if (currentSound && currentSound !== 'None') {
      console.log("playSound called manually");
      setIsPlaying(true);
    } else {
      console.log("playSound ignored: no valid sound selected.");
      toast.info("Please select a sound first.");
    }
  }, [currentSound]); // Dependency: currentSound

  const pauseSound = useCallback(() => {
    console.log("pauseSound called manually");
    setIsPlaying(false);
  }, []); // No dependencies needed

  const stopSound = useCallback(() => {
    console.log("stopSound called");
    setCurrentSound(null); // Go back to initial state
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.src) {
         audioRef.current.removeAttribute('src');
         audioRef.current.load();
      }
    }
  }, []); // No dependencies needed

  // Return the state and control functions
  return {
    isPlaying,
    currentSound,
    availableSounds: soundData,
    selectSound,
    playSound,
    pauseSound,
    stopSound,
  };
};