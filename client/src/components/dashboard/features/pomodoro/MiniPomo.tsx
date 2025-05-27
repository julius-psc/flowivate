'use client';

import React from 'react';
import { usePomodoroContext } from './PomodoroContext';

export const MiniPomo: React.FC = () => {
  const { formatTime, isActive, pause } = usePomodoroContext();
  if (!isActive) return null;
  return (
    <div
      className="fixed top-12  left-1/2 py-1 px-3 bg-primary text-white rounded-xl select-none"
      onClick={pause}
    >
      <span className="">{formatTime()}</span>
    </div>
  );
};
export default MiniPomo;
