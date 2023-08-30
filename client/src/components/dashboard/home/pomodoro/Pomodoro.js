


import React, { useEffect, useRef } from 'react';
import { usePomodoroContext } from './PomodoroContext';
import './Pomodoro.css';

import playIcon from '../../../../assets/images/dashboard/home/pomodoro/pomodoro-play-btn.svg';
import pauseIcon from '../../../../assets/images/dashboard/home/pomodoro/pomodoro-pause-btn.svg';
import restartIcon from '../../../../assets/images/dashboard/home/pomodoro/pomodoro-restart-btn.svg';

const Pomodoro = () => {
  const intervalRef = useRef(null);
  const {
    toggleRunning,
    restartTimer,
    formatTime,
    isRunning,
  } = usePomodoroContext();

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

  return (
    <div className="pomodoro">
      <h1>{formatTime()}</h1>
      <div>
        <button onClick={toggleRunning}>
          <img
            alt="Pomodoro button"
            src={isRunning ? pauseIcon : playIcon}
          />
        </button>
        <button onClick={restartTimer}>
          <img alt="Pomodoro restart button" src={restartIcon} />
        </button>
      </div>
    </div>
  );
};

export default Pomodoro;
