'use client';

import React from 'react';
import { usePomodoroContext } from './PomodoroContext';

export const MiniPomo: React.FC = () => {
  const { formatTime, isActive, pause, mode } = usePomodoroContext();
  if (!isActive) return null;

  const modeLabel =
    mode === "focus"
      ? "Focusing"
      : mode === "longBreak"
        ? "Long break"
        : "Short break";
  const isBreak = mode !== "focus";
  const colorClass = isBreak
    ? "bg-emerald-500 text-white shadow-emerald-500/20"
    : "bg-primary text-white shadow-primary/20";

  return (
    <button
      type="button"
      className={`fixed top-14 left-1/2 z-50 -translate-x-1/2 inline-flex items-center rounded-2xl px-3 py-2 shadow-lg select-none transition-transform hover:scale-[1.02] ${colorClass}`}
      onClick={pause}
      title="Pause timer"
      aria-label={`Pause ${modeLabel.toLowerCase()} timer`}
    >
      <span className="flex flex-col items-start leading-none">
        <span className="text-sm font-semibold tabular-nums">{formatTime()}</span>
        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-white/80">
          {modeLabel}
        </span>
      </span>
    </button>
  );
};
export default MiniPomo;
