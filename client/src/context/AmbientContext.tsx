"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

interface SoundInfo {
    src: string;
    emoji: string;
}

// Centralized sound data configuration
export const soundData: Record<string, SoundInfo> = {
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
    None: { src: "", emoji: "🚫" },
};

export const ambientSoundNames = Object.keys(soundData);
export type AmbientSoundName = keyof typeof soundData;

interface AmbientContextType {
    isPlaying: boolean;
    currentSound: AmbientSoundName | null;
    availableSounds: typeof soundData;
    selectSound: (soundName: AmbientSoundName) => void;
    playSound: () => void;
    pauseSound: () => void;
    stopSound: () => void;
    volume: number;
    setVolume: (volume: number) => void;
}

const AmbientContext = createContext<AmbientContextType | undefined>(undefined);

export const AmbientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSound, setCurrentSound] = useState<AmbientSoundName | null>(null);
    const [volume, setVolumeState] = useState<number>(0.5);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastSoundRef = useRef<AmbientSoundName | null>(null);

    // Initialize audio element once
    useEffect(() => {
        // Only on client
        if (typeof window === "undefined") return;

        audioRef.current = new Audio();
        audioRef.current.loop = true;

        const handleError = () => {
            const audioEl = audioRef.current;
            if (!audioEl) return;
            const err = audioEl.error;
            if (err && err.code === err.MEDIA_ERR_ABORTED) {
                console.warn('Audio fetch aborted by user.');
                return;
            }
            console.error(`Error loading audio: ${audioEl.src}`);
            toast.error(`Failed to load: ${audioEl.src || 'N/A'}.`);
            setIsPlaying(false);
            setCurrentSound(null);
        };

        audioRef.current.addEventListener('error', handleError);

        return () => {
            const audioEl = audioRef.current;
            if (audioEl) {
                audioEl.pause();
                audioEl.removeAttribute('src');
                audioEl.load();
                audioEl.removeEventListener('error', handleError);
            }
            audioRef.current = null;
        };
    }, []);

    // Handle play/pause and source switching
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (!currentSound || currentSound === 'None') {
            if (!audio.paused) audio.pause();
            lastSoundRef.current = currentSound;
            return;
        }

        if (lastSoundRef.current !== currentSound) {
            const info = soundData[currentSound];
            audio.src = info.src;
            audio.load();
            lastSoundRef.current = currentSound;
        }

        if (isPlaying) {
            audio.play().catch((e) => {
                console.error('Play failed:', e);
                if (e && e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
                    toast.error(`Playback error: ${e.message}`);
                }
                setIsPlaying(false);
            });
        } else {
            if (!audio.paused) audio.pause();
        }
    }, [currentSound, isPlaying]);

    // Update volume
    useEffect(() => {
        const audio = audioRef.current;
        if (audio) audio.volume = volume;
    }, [volume]);

    const selectSound = useCallback((soundName: AmbientSoundName) => {
        if (soundName === 'None') {
            setCurrentSound('None');
            setIsPlaying(false);
        } else if (soundName !== currentSound) {
            setCurrentSound(soundName);
            setIsPlaying(true);
        } else {
            setIsPlaying((p) => !p);
        }
    }, [currentSound]);

    const playSound = useCallback(() => {
        if (currentSound && currentSound !== 'None') {
            setIsPlaying(true);
        } else {
            toast.info('Please select a sound first.');
        }
    }, [currentSound]);

    const pauseSound = useCallback(() => setIsPlaying(false), []);
    const stopSound = useCallback(() => {
        setCurrentSound(null);
        setIsPlaying(false);
    }, []);
    const setVolume = useCallback((v: number) => setVolumeState(v), []);

    const value = {
        isPlaying,
        currentSound,
        availableSounds: soundData,
        selectSound,
        playSound,
        pauseSound,
        stopSound,
        volume,
        setVolume,
    };

    return (
        <AmbientContext.Provider value={value}>
            {children}
        </AmbientContext.Provider>
    );
};

export const useAmbientContext = (): AmbientContextType => {
    const context = useContext(AmbientContext);
    if (!context) {
        throw new Error("useAmbientContext must be used within an AmbientProvider");
    }
    return context;
};
