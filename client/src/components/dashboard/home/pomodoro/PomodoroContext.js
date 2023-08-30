import React, { createContext, useContext, useState, useEffect } from 'react';

const PomodoroContext = createContext();

export const usePomodoroContext = () => useContext(PomodoroContext);

export const PomodoroProvider = ({ children }) => {
  const [time, setTime] = useState(1500);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(true); // Set initial state to true
  const [pauseAfterCycle, setPauseAfterCycle] = useState(false);

  useEffect(() => {
    if (isRunning && time > 0) {
      const timerId = setInterval(() => {
        setTime(prevTime => prevTime - 1);
      }, 1000);
      return () => clearInterval(timerId);
    } else if (time === 0) {
      setPauseAfterCycle(true); // Pause after completing a cycle
      const nextIsBreak = !isBreak;
      setIsBreak(nextIsBreak);
      setTime(nextIsBreak ? 1500 : 300); // Toggle between work and break
    }
  }, [isRunning, time, isBreak]);

  useEffect(() => {
    if (pauseAfterCycle) {
      setIsRunning(false);
      setPauseAfterCycle(false);
    }
  }, [pauseAfterCycle]);

  const toggleRunning = () => {
    setIsRunning(prevIsRunning => !prevIsRunning);
  };

  const restartTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTime(1500);
  };

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const contextValue = {
    time,
    isRunning,
    isBreak,
    toggleRunning,
    restartTimer,
    formatTime,
  };

  return (
    <PomodoroContext.Provider value={contextValue}>
      {children}
    </PomodoroContext.Provider>
  );
};
