import React, { useState, useEffect, useRef } from 'react';
import { IconVinyl, IconMusic } from '@tabler/icons-react';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

const Ambient: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Map sound names to their static file paths in /public
  const soundMap = {
    'Airplane': '/assets/audio/ambient-airplane.mp3',
    'Brown Noise': '/assets/audio/ambient-brown.mp3',
    'City': '/assets/audio/ambient-city.mp3',
    'Deep Water': '/assets/audio/ambient-deepwater.mp3',
    'Fireplace': '/assets/audio/ambient-fireplace.mp3',
    'Forest': '/assets/audio/ambient-forest.mp3',
    'Library': '/assets/audio/ambient-library.mp3',
    'Ocean Waves': '/assets/audio/ambient-ocean.mp3',
    'Rain': '/assets/audio/ambient-rain.mp3',
    'Summer': '/assets/audio/ambient-summer.mp3',
    'Thunderstorm': '/assets/audio/ambient-thunderstorm.mp3',
  };

  const ambientSounds = Object.keys(soundMap);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.onerror = () => {
      console.error('Error loading audio');
      setIsPlaying(false);
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
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Playback error:', error);
          setIsPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSound]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSoundSelect = (sound: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;

      const soundSrc = soundMap[sound as keyof typeof soundMap];
      if (!soundSrc) {
        console.error(`No source found for ${sound}`);
        return;
      }

      audioRef.current.src = soundSrc;
      audioRef.current.loop = true;

      setCurrentSound(sound);
      setIsPlaying(true);
    }
    setIsDropdownOpen(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
      <p className="absolute top-4 right-4 bg-primary-white dark:bg-gray-700 text-primary-black dark:text-gray-200 font-medium opacity-60 px-3 mb-6 rounded-md">
        Ambient sounds
      </p>

      <div className="relative flex items-center justify-center">
        <div
          className={`relative cursor-pointer ${isPlaying ? 'spin-slow' : ''}`}
          onClick={toggleDropdown}
        >
          <div className="absolute inset-0 rounded-full border border-gray-200/80 dark:border-gray-600/80 -m-4" />
          <div className="absolute inset-0 rounded-full border border-gray-200/70 dark:border-gray-600/70 -m-8" />
          <div className="absolute inset-0 rounded-full border border-gray-200/60 dark:border-gray-600/60 -m-12" />
          <div className="absolute inset-0 rounded-full border border-gray-200/50 dark:border-gray-600/50 -m-16" />
          <div className="absolute inset-0 rounded-full border border-gray-200/40 dark:border-gray-600/40 -m-20" />
          <div className="bg-primary-white dark:bg-gray-700 p-2 rounded-full border-2 border-gray-300 dark:border-gray-600">
            <IconVinyl size={36} className="text-primary-black dark:text-gray-200 opacity-70" />
          </div>
        </div>

        {isPlaying && (
          <>
            <IconMusic
              size={16}
              className="absolute text-gray-400 dark:text-gray-500 animate-note1"
              style={{ top: '-20px', left: '50px' }}
            />
            <IconMusic
              size={12}
              className="absolute text-gray-400 dark:text-gray-500 animate-note2"
              style={{ top: '-30px', right: '50px' }}
            />
            <IconMusic
              size={14}
              className="absolute text-gray-400 dark:text-gray-500 animate-note3"
              style={{ top: '-10px', right: '60px' }}
            />
          </>
        )}
      </div>

      {isDropdownOpen && (
        <div className="absolute top-16 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 border border-gray-100 dark:border-gray-700">
          <ul className="py-1 max-h-40 overflow-y-auto">
            {ambientSounds.map((sound) => (
              <li
                key={sound}
                className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => handleSoundSelect(sound)}
              >
                {sound}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={togglePlayPause}
        className="absolute bottom-2 p-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        disabled={!currentSound}
      >
        {isPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
      </button>
    </div>
  );
};

export default Ambient;