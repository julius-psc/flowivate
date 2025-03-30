'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { IconWind, IconChevronLeft } from '@tabler/icons-react';

// Separate component for the breath message to avoid re-rendering
const BreathMessage = React.memo(({ phase }: { phase: string }) => {
  const phaseMessages: { [key: string]: string } = {
    'inhale': 'Breathe in...',
    'hold-inhale': 'Hold after inhale...',
    'exhale': 'Breathe out...',
    'hold-exhale': 'Hold after exhale...'
  };

  return <p className="text-sm font-medium text-primary-black dark:text-white">{phaseMessages[phase] || 'Breathing...'}</p>;
});

BreathMessage.displayName = 'BreathMessage';

const Meditation = () => {
  const [isMeditating, setIsMeditating] = useState(false);
  const [selectedTime, setSelectedTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<string>('inhale');
  const [breathProgress, setBreathProgress] = useState(0);
  const [shouldScale, setShouldScale] = useState(true);

  // Use refs to maintain state across re-renders without triggering useEffect
  const currentCycleTimeRef = useRef(0);
  const currentPhaseRef = useRef<string>('inhale');

  // More complex meditation times with specific breathing patterns
  const meditationTimes = useMemo(() => [
    { 
      label: 'Quick Reset', 
      seconds: 60, // 1 minute
      pattern: [
        { phase: 'inhale', duration: 4 },
        { phase: 'exhale', duration: 4 }
      ]
    },
    { 
      label: 'Short Break', 
      seconds: 180, // 3 minutes
      pattern: [
        { phase: 'inhale', duration: 4 },
        { phase: 'hold-inhale', duration: 4 },
        { phase: 'exhale', duration: 4 },
        { phase: 'hold-exhale', duration: 4 }
      ]
    },
    { 
      label: 'Deep Calm', 
      seconds: 600, // 10 minutes
      pattern: [
        { phase: 'inhale', duration: 4 },
        { phase: 'exhale', duration: 6 }
      ]
    },
  ], []);

  // Memoize the breath pattern to avoid unnecessary recalculations
  const breathPattern = useMemo(() => {
    if (!selectedTime) return meditationTimes[0].pattern;
    return meditationTimes.find((t) => t.seconds === selectedTime)?.pattern || meditationTimes[0].pattern;
  }, [selectedTime, meditationTimes]);

  // Memoize the start meditation function
  const startMeditation = useCallback((seconds: number) => {
    setSelectedTime(seconds);
    setTimeLeft(seconds);
    setIsMeditating(true);
    setBreathPhase('inhale');
    setBreathProgress(0);
    setShouldScale(true);
    
    // Reset refs
    currentCycleTimeRef.current = 0;
    currentPhaseRef.current = 'inhale';
  }, []);

  // Memoize the exit session function
  const exitSession = useCallback(() => {
    setIsMeditating(false);
    setSelectedTime(null);
    setTimeLeft(0);
    setBreathProgress(0);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let breathTimer: NodeJS.Timeout;

    if (isMeditating && timeLeft > 0) {
      // Main timer for countdown
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
        // Find the current breath phase configuration
        const currentPhaseCfg = breathPattern.find(p => p.phase === currentPhaseRef.current);
        
        if (!currentPhaseCfg) return;

        // Update breath progress and phase
        currentCycleTimeRef.current++;
        
        // Calculate progress for the current phase
        const progress = currentPhaseCfg.duration > 0 
          ? Math.min(currentCycleTimeRef.current / currentPhaseCfg.duration, 1)
          : 1;
        
        // Determine breathing behavior based on phase
        if (currentPhaseRef.current === 'inhale') {
          setBreathProgress(progress);
          setShouldScale(true);
        } else if (currentPhaseRef.current === 'hold-inhale') {
          // During inhale hold, maintain the fully expanded state
          setBreathProgress(1);
          setShouldScale(true);
        } else if (currentPhaseRef.current === 'exhale') {
          setBreathProgress(1 - progress);
          setShouldScale(true);
        } else if (currentPhaseRef.current === 'hold-exhale') {
          // During exhale hold, maintain the fully contracted state
          setBreathProgress(0);
          setShouldScale(false);
        }
        
        // Check if current phase is complete
        if (currentCycleTimeRef.current >= currentPhaseCfg.duration) {
          // Move to next phase in the pattern
          const currentIndex = breathPattern.findIndex(p => p.phase === currentPhaseRef.current);
          const nextIndex = (currentIndex + 1) % breathPattern.length;
          
          currentPhaseRef.current = breathPattern[nextIndex].phase;
          currentCycleTimeRef.current = 0;
          setBreathPhase(currentPhaseRef.current);
        }
      }, 1000);
    }

    // Stop meditation when time runs out
    if (timeLeft === 0 && isMeditating) {
      exitSession();
    }

    return () => {
      clearInterval(timer);
      clearInterval(breathTimer);
    };
  }, [isMeditating, timeLeft, breathPattern, exitSession]); 

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex flex-col items-center bg-white dark:bg-gray-800 rounded-lg p-4">
      {!isMeditating ? (
        <div className="flex flex-col items-center gap-6 py-8 w-full">
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center w-12 h-12">
              <div className="absolute w-12 h-12 rounded-full bg-primary-white dark:bg-gray-700" />
              <IconWind className="w-6 h-6 text-primary-black dark:text-white z-10" />
            </div>
            <h3 className="text-lg font-medium text-primary-black dark:text-white">Mindful Breathing</h3>
            <p className="text-xs text-primary-black dark:text-gray-300 opacity-70 px-2">
              Choose a duration to begin your meditation
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            {meditationTimes.map((time) => (
              <button
                key={time.label}
                onClick={() => startMeditation(time.seconds)}
                className="w-full max-w-[180px] px-3 py-2 bg-primary-black dark:bg-gray-700 text-white dark:text-gray-200 rounded-lg cursor-pointer transition-colors text-sm hover:bg-gray-800 dark:hover:bg-gray-600"
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-between  ">
          <button
            onClick={exitSession}
            className="self-start p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <IconChevronLeft className="w-5 h-5 text-primary-black dark:text-white" />
          </button>
          
          <div className="flex-1 flex items-center justify-center">
            <div 
              className="relative flex items-center justify-center transition-transform duration-1000 ease-in-out"
              style={{
                transform: shouldScale && breathProgress !== undefined 
                  ? `scale(${1 + breathProgress * 0.5})` 
                  : 'scale(1)', // Scales from 1 to 1.5
                width: '80px',
                height: '80px',
              }}
            >
              <div 
                className="absolute rounded-full bg-blue-100 dark:bg-blue-900 opacity-50 transition-all duration-1000 ease-in-out"
                style={{
                  width: '100%',
                  height: '100%',
                  transform: shouldScale && breathProgress !== undefined 
                    ? `scale(${1 + breathProgress * 0.5})` 
                    : 'scale(1)',
                }}
              />
              <IconWind className="w-6 h-6 text-blue-500 dark:text-blue-300 z-10" />
            </div>
          </div>
          
          <div className="text-center pb-4 space-y-2">
            <BreathMessage phase={breathPhase} />
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(timeLeft)}</p>
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