


import React, { useEffect, useRef } from 'react';
import { usePomodoroContext } from '../../home/pomodoro/PomodoroContext';
import './MiniPomo.css';

const MiniPomo = () => {
  const { formatTime, isRunning } = usePomodoroContext();

  const intervalRef = useRef(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        if (isRunning) {
          intervalRef.current = setInterval(() => {
            // Update the PomodoroContext state here
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  return isRunning ? (
    <div className="mini-pomo">
      <h2>{formatTime()}</h2>
    </div>
  ) : null;
};

export default MiniPomo;
