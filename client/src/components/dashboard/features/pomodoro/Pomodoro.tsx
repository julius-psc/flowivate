'use client';

import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { usePomodoroContext } from './PomodoroContext';
import {
  IconCup,
  IconBrain,
  IconSettings,
  IconRefresh,
  IconPlant,
  IconX,
  IconPlus,
  IconMinus,
} from '@tabler/icons-react';
import { PomodoroSkeleton } from './PomodoroSkeleton';

const Pomodoro: React.FC = () => {
  const {
    settings,
    mode,
    timeLeft,
    isActive,
    sessions,
    isLoading,
    start,
    pause,
    reset,
    switchMode,
    formatTime,
    progress,
    saveSettings,
  } = usePomodoroContext();

  const [showSettings, setShowSettings] = useState(false);
  const settingsFormRef = useRef<HTMLFormElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showSettings &&
        settingsFormRef.current &&
        !settingsFormRef.current.contains(e.target as Node)
      ) {
        const btn = document.getElementById('pomodoro-settings-toggle');
        if (!btn || !btn.contains(e.target as Node)) {
          setShowSettings(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  const handleSettingsSave = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsFormRef.current) return;
    const fd = new FormData(settingsFormRef.current);
    const newSettings = {
      focusTime: Math.max(1, Math.min(120, Number(fd.get('focusTime')))) * 60,
      shortBreakTime: Math.max(1, Math.min(30, Number(fd.get('shortBreakTime')))) * 60,
      longBreakTime: Math.max(5, Math.min(60, Number(fd.get('longBreakTime')))) * 60,
      longBreakAfter: Math.max(1, Math.min(10, Number(fd.get('longBreakAfter')))),
    };
    saveSettings(newSettings);
    setShowSettings(false);
  };

  // Tailwind classes mapped per mode
  const colors = {
    focus: {
      main: 'bg-primary',
      hover: 'hover:bg-primary/90',
      text: 'text-primary',
      ring: 'focus:ring-primary/30',
      lightBg: 'bg-primary/10',
    },
    shortBreak: {
      main: 'bg-third-red',
      hover: 'hover:bg-third-red/90',
      text: 'text-third-red',
      ring: 'focus:ring-third-red/30',
      lightBg: 'bg-third-red/10',
    },
    longBreak: {
      main: 'bg-third-green',
      hover: 'hover:bg-third-green/90',
      text: 'text-third-green',
      ring: 'focus:ring-third-green/30',
      lightBg: 'bg-third-green/10',
    },
  } as const;
  const modeColors = colors[mode];

  const icons = {
    focus: <IconBrain size={16} />,
    shortBreak: <IconCup size={16} />,
    longBreak: <IconPlant size={16} />,
  } as const;

  if (isLoading) return <PomodoroSkeleton />;

  return (
    <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-sm text-secondary-black dark:text-secondary-white opacity-40">
          FOCUS TIMER
        </h1>
      </div>

      <div className="flex flex-col space-y-6 flex-1">
        {!showSettings ? (
          <>
            {/* Mode Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(icons) as Array<keyof typeof icons>).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`py-2 text-xs font-medium transition-colors rounded-lg ${
                    mode === m
                      ? `${modeColors.lightBg} ${modeColors.text}`
                      : 'text-accent-grey-hover dark:text-secondary-white/70 hover:bg-accent-lightgrey/10 dark:hover:bg-accent-grey/10'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <span className="mr-1.5">{icons[m]}</span>
                    {m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break'}
                  </div>
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
              <div className="text-4xl font-bold text-secondary-black dark:text-secondary-white tabular-nums mb-2">
                {formatTime(timeLeft)}
              </div>
              <div className="w-full h-2 bg-accent-lightgrey/20 dark:bg-accent-grey/20 rounded-full overflow-hidden">
                <div
                  className={`${modeColors.main} h-full rounded-full transition-all duration-300 ease-linear`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center">
                <span className="text-xs text-secondary-black/60 dark:text-secondary-white/60 mr-2">
                  Session{' '}
                  {sessions % settings.longBreakAfter || settings.longBreakAfter}/
                  {settings.longBreakAfter}
                </span>
                <div className="flex space-x-1.5">
                  {Array.from({ length: Math.min(settings.longBreakAfter, 8) }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                        i < sessions % settings.longBreakAfter ||
                        (sessions > 0 && sessions % settings.longBreakAfter === 0)
                          ? modeColors.main
                          : 'bg-accent-lightgrey/30 dark:bg-accent-grey/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={reset}
                  aria-label="Reset Timer"
                  className="p-2 text-accent-grey-hover dark:text-accent-grey hover:text-secondary-black dark:hover:text-secondary-white bg-accent-lightgrey/10 dark:bg-accent-grey/10 hover:bg-accent-lightgrey/20 dark:hover:bg-accent-grey/20 transition-colors rounded-full focus:outline-none"
                >
                  <IconRefresh size={18} />
                </button>
                <button
                  onClick={isActive ? pause : start}
                  aria-label={isActive ? 'Pause Timer' : 'Start Timer'}
                  className={`px-6 py-2 text-secondary-white ${modeColors.main} ${modeColors.hover} rounded-full transition-colors focus:outline-none focus:ring-1 ${modeColors.ring}`}
                >
                  {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                  id="pomodoro-settings-toggle"
                  onClick={() => setShowSettings(true)}
                  aria-label="Open Settings"
                  className="p-2 text-accent-grey-hover dark:text-accent-grey hover:text-secondary-black dark:hover:text-secondary-white bg-accent-lightgrey/10 dark:bg-accent-grey/10 hover:bg-accent-lightgrey/20 dark:hover:bg-accent-grey/20 transition-colors rounded-full focus:outline-none"
                >
                  <IconSettings size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Settings Form */
          <form
            ref={settingsFormRef}
            onSubmit={handleSettingsSave}
            className="w-full h-full flex flex-col animate-fade"
          >
            <div className="flex justify-between items-center border-b border-accent-lightgrey/20 dark:border-accent-grey/20 pb-3 mb-4">
              <h3 className="text-base font-medium text-secondary-black dark:text-secondary-white">
                Timer Settings
              </h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-accent-grey-hover dark:text-accent-grey hover:text-secondary-black dark:hover:text-secondary-white rounded-full p-1 hover:bg-accent-lightgrey/10 dark:hover:bg-accent-grey/10"
              >
                <IconX size={16} />
              </button>
            </div>
            <div className="space-y-5 flex-1 overflow-y-auto pr-1">
              {[
                {
                  name: 'focusTime',
                  label: 'Focus Duration (minutes)',
                  value: settings.focusTime / 60,
                  min: 1,
                  max: 120,
                },
                {
                  name: 'shortBreakTime',
                  label: 'Short Break (minutes)',
                  value: settings.shortBreakTime / 60,
                  min: 1,
                  max: 30,
                },
                {
                  name: 'longBreakTime',
                  label: 'Long Break (minutes)',
                  value: settings.longBreakTime / 60,
                  min: 5,
                  max: 60,
                },
                {
                  name: 'longBreakAfter',
                  label: 'Sessions Before Long Break',
                  value: settings.longBreakAfter,
                  min: 1,
                  max: 10,
                },
              ].map((field) => (
                <div key={field.name} className="flex flex-col">
                  <label
                    htmlFor={field.name}
                    className="text-xs font-medium text-secondary-black dark:text-secondary-white mb-2"
                  >
                    {field.label}
                  </label>
                  <div className="flex items-center justify-between bg-accent-lightgrey/10 dark:bg-accent-grey/10 rounded-lg p-3">
                    <button
                      type="button"
                      onClick={() => {
                        const inp = document.getElementById(
                          field.name
                        ) as HTMLInputElement | null;
                        inp?.stepDown();
                      }}
                      className="p-1 rounded-full bg-accent-lightgrey/20 dark:bg-accent-grey/20 text-secondary-black dark:text-secondary-white hover:bg-accent-lightgrey/30 dark:hover:bg-accent-grey/30"
                    >
                      <IconMinus size={16} />
                    </button>
                    <input
                      id={field.name}
                      name={field.name}
                      type="number"
                      defaultValue={field.value}
                      min={field.min}
                      max={field.max}
                      step="1"
                      className="w-16 text-center bg-transparent text-secondary-black dark:text-secondary-white font-medium text-lg focus:outline-none appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const inp = document.getElementById(
                          field.name
                        ) as HTMLInputElement | null;
                        inp?.stepUp();
                      }}
                      className="p-1 rounded-full bg-accent-lightgrey/20 dark:bg-accent-grey/20 text-secondary-black dark:text-secondary-white hover:bg-accent-lightgrey/30 dark:hover:bg-accent-grey/30"
                    >
                      <IconPlus size={16} />
                    </button>
                  </div>
                  <div className="flex justify-between text-xs text-accent-grey-hover dark:text-accent-grey mt-1 px-1">
                    <span>Min: {field.min}</span>
                    <span>Max: {field.max}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-accent-lightgrey/20 dark:border-accent-grey/20 mt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-xs font-medium text-accent-grey-hover dark:text-accent-grey bg-accent-lightgrey/10 dark:bg-accent-grey/10 rounded-lg hover:bg-accent-lightgrey/20 dark:hover:bg-accent-grey/20 transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-secondary-white bg-primary hover:bg-primary/90 rounded-lg transition-colors focus:outline-none"
              >
                Apply Settings
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Pomodoro;