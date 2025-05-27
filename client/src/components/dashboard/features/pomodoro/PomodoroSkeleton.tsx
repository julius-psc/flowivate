'use client';

import React from 'react';

export const PomodoroSkeleton: React.FC = () => (
  <div className="p-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl border border-slate-200/50 dark:border-zinc-800/50 flex flex-col h-full animate-pulse">
    <div className="flex justify-between items-center mb-4 flex-shrink-0">
      <div className="h-3 w-24 bg-gray-200 dark:bg-zinc-700 rounded"></div>
    </div>
    <div className="flex flex-col space-y-6 flex-1">
      <div className="grid grid-cols-3 gap-2">
        <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
        <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
        <div className="h-8 bg-gray-200 dark:bg-zinc-700 rounded-lg"></div>
      </div>
      <div className="flex flex-col items-center space-y-6 flex-1 justify-center">
        <div className="h-10 w-32 bg-gray-200 dark:bg-zinc-700 rounded mb-2"></div>
        <div className="w-full h-2 bg-gray-200 dark:bg-zinc-700 rounded-full"></div>
        <div className="mt-3 flex items-center">
          <div className="h-3 w-20 bg-gray-200 dark:bg-zinc-700 rounded mr-2"></div>
          <div className="flex space-x-1.5">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-gray-300 dark:bg-zinc-600 rounded-full"
              />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center w-full space-x-4 pt-4">
          <div className="w-9 h-9 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
          <div className="w-20 h-9 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
          <div className="w-9 h-9 bg-gray-300 dark:bg-zinc-600 rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);