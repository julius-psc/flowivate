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

// How many seconds before the end to start crossfading into the next loop
const CROSSFADE_DURATION = 2.5;

export const AmbientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSound, setCurrentSound] = useState<AmbientSoundName | null>(null);
    const [volume, setVolumeState] = useState<number>(0.5);

    // Two audio elements: A is active, B is standby (swap on each loop)
    const audioA = useRef<HTMLAudioElement | null>(null);
    const audioB = useRef<HTMLAudioElement | null>(null);
    const activeSlot = useRef<"A" | "B">("A");

    // Crossfade RAF tracking
    const crossfadeRafRef = useRef<number | null>(null);
    const isCrossfadingRef = useRef(false);

    // Stable refs for use inside callbacks/event listeners
    const volumeRef = useRef(volume);
    const isPlayingRef = useRef(isPlaying);
    const currentSoundRef = useRef(currentSound);
    const lastLoadedSoundRef = useRef<AmbientSoundName | null>(null);

    useEffect(() => { volumeRef.current = volume; }, [volume]);
    useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
    useEffect(() => { currentSoundRef.current = currentSound; }, [currentSound]);

    const getActive = useCallback((): HTMLAudioElement | null =>
        activeSlot.current === "A" ? audioA.current : audioB.current, []);

    const getStandby = useCallback((): HTMLAudioElement | null =>
        activeSlot.current === "A" ? audioB.current : audioA.current, []);

    // Cancel any running crossfade and restore clean state
    const cancelCrossfade = useCallback(() => {
        if (crossfadeRafRef.current !== null) {
            cancelAnimationFrame(crossfadeRafRef.current);
            crossfadeRafRef.current = null;
        }
        isCrossfadingRef.current = false;

        const active = activeSlot.current === "A" ? audioA.current : audioB.current;
        const standby = activeSlot.current === "A" ? audioB.current : audioA.current;
        if (active) active.volume = volumeRef.current;
        if (standby) {
            standby.volume = 0;
            if (!standby.paused) standby.pause();
        }
    }, []);

    // Start crossfading from the current active slot into standby
    const doStartCrossfade = useCallback((fromSlot: "A" | "B") => {
        if (isCrossfadingRef.current) return;

        const sound = currentSoundRef.current;
        if (!sound || sound === "None") return;
        const src = soundData[sound]?.src;
        if (!src) return;

        const toSlot: "A" | "B" = fromSlot === "A" ? "B" : "A";
        const fromAudio = fromSlot === "A" ? audioA.current : audioB.current;
        const toAudio = toSlot === "A" ? audioA.current : audioB.current;
        if (!fromAudio || !toAudio) return;

        isCrossfadingRef.current = true;

        // Prepare the standby audio (same sound, from the top)
        toAudio.src = src;
        toAudio.currentTime = 0;
        toAudio.volume = 0;
        toAudio.play().catch(() => { isCrossfadingRef.current = false; });

        const targetVol = volumeRef.current;
        const startTs = performance.now();
        const durationMs = CROSSFADE_DURATION * 1000;

        const tick = (now: number) => {
            const raw = Math.min((now - startTs) / durationMs, 1);
            // Ease in-out quad
            const t = raw < 0.5 ? 2 * raw * raw : -1 + (4 - 2 * raw) * raw;

            if (fromAudio) fromAudio.volume = targetVol * (1 - t);
            if (toAudio) toAudio.volume = targetVol * t;

            if (raw < 1) {
                crossfadeRafRef.current = requestAnimationFrame(tick);
            } else {
                // Crossfade complete — standby is now the active slot
                fromAudio.pause();
                fromAudio.currentTime = 0;
                activeSlot.current = toSlot;
                isCrossfadingRef.current = false;
                crossfadeRafRef.current = null;
            }
        };

        crossfadeRafRef.current = requestAnimationFrame(tick);
    }, []);

    // Initialize both audio elements once on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const a = new Audio();
        const b = new Audio();
        audioA.current = a;
        audioB.current = b;

        const makeErrorHandler = (audio: HTMLAudioElement) => () => {
            const err = audio.error;
            if (err?.code === err?.MEDIA_ERR_ABORTED) return;
            console.error("Audio error:", audio.src);
            toast.error("Failed to load audio.");
            setIsPlaying(false);
            setCurrentSound(null);
        };

        const errA = makeErrorHandler(a);
        const errB = makeErrorHandler(b);
        a.addEventListener("error", errA);
        b.addEventListener("error", errB);

        // Timeupdate: fire crossfade when approaching the end of the current loop
        const handleTimeUpdate = () => {
            if (!isPlayingRef.current || isCrossfadingRef.current) return;
            const active = activeSlot.current === "A" ? audioA.current : audioB.current;
            if (!active || !active.duration || isNaN(active.duration) || active.duration === Infinity) return;

            const timeLeft = active.duration - active.currentTime;
            // Don't crossfade more than 40% of the file (for very short clips)
            const effectiveCrossfade = Math.min(CROSSFADE_DURATION, active.duration * 0.4);

            if (timeLeft > 0 && timeLeft <= effectiveCrossfade) {
                doStartCrossfade(activeSlot.current);
            }
        };

        a.addEventListener("timeupdate", handleTimeUpdate);
        b.addEventListener("timeupdate", handleTimeUpdate);

        return () => {
            cancelCrossfade();
            a.removeEventListener("error", errA);
            b.removeEventListener("error", errB);
            a.removeEventListener("timeupdate", handleTimeUpdate);
            b.removeEventListener("timeupdate", handleTimeUpdate);
            [a, b].forEach((audio) => {
                audio.pause();
                audio.removeAttribute("src");
                audio.load();
            });
            audioA.current = null;
            audioB.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // React to currentSound / isPlaying changes
    useEffect(() => {
        if (!currentSound || currentSound === "None") {
            cancelCrossfade();
            const active = activeSlot.current === "A" ? audioA.current : audioB.current;
            if (active && !active.paused) active.pause();
            lastLoadedSoundRef.current = currentSound as AmbientSoundName;
            return;
        }

        if (lastLoadedSoundRef.current !== currentSound) {
            cancelCrossfade();
            // Reset to slot A and load the new sound into both elements
            activeSlot.current = "A";
            const info = soundData[currentSound];
            if (audioA.current) {
                audioA.current.src = info.src;
                audioA.current.load();
                audioA.current.volume = volume;
            }
            // Pre-load standby with the same src so it's ready for crossfade
            if (audioB.current) {
                audioB.current.src = info.src;
                audioB.current.load();
                audioB.current.volume = 0;
            }
            lastLoadedSoundRef.current = currentSound;
        }

        const active = activeSlot.current === "A" ? audioA.current : audioB.current;
        if (!active) return;

        if (isPlaying) {
            active.volume = volume;
            active.play().catch((e) => {
                if (e?.name !== "AbortError" && e?.name !== "NotAllowedError") {
                    toast.error(`Playback error: ${e?.message}`);
                }
                setIsPlaying(false);
            });
        } else {
            cancelCrossfade();
            if (!active.paused) active.pause();
        }
    }, [currentSound, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

    // Keep volume in sync on all audio elements (outside of crossfade)
    useEffect(() => {
        volumeRef.current = volume;
        if (isCrossfadingRef.current) return; // let the RAF handle volumes during crossfade
        if (audioA.current) audioA.current.volume = activeSlot.current === "A" ? volume : 0;
        if (audioB.current) audioB.current.volume = activeSlot.current === "B" ? volume : 0;
    }, [volume]);

    const selectSound = useCallback((soundName: AmbientSoundName) => {
        if (soundName === "None") {
            setCurrentSound("None");
            setIsPlaying(false);
        } else if (soundName !== currentSound) {
            setCurrentSound(soundName);
            setIsPlaying(true);
        } else {
            setIsPlaying((p) => !p);
        }
    }, [currentSound]);

    const playSound = useCallback(() => {
        if (currentSound && currentSound !== "None") {
            setIsPlaying(true);
        } else {
            toast.info("Please select a sound first.");
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
