'use client';

import { useState } from 'react';

export default function Sleep() {
  const [sleepHours, setSleepHours] = useState(7);
  const [weeklySleep, setWeeklySleep] = useState<(number | null)[]>([null, null, null, null, null, null, null]);

  const handleIncrement = () => {
    if (sleepHours < 12) setSleepHours(sleepHours + 1);
  };

  const handleDecrement = () => {
    if (sleepHours > 1) setSleepHours(sleepHours - 1);
  };

  const handleSave = () => {
    const newWeeklySleep = [...weeklySleep];
    newWeeklySleep[6] = sleepHours;
    setWeeklySleep(newWeeklySleep);
  };

  const getBarHeight = (hours: number | null) => {
    if (hours === null) return 'h-2 w-2 rounded-full';
    if (hours <= 4) return 'h-4 w-3 rounded-lg';
    if (hours <= 7) return 'h-8 w-3 rounded-lg';
    return 'h-12 w-3 rounded-lg';
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg h-full w-full">
      <h2 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200 tracking-tight">Sleep</h2>
      
      {/* Controls */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <button
          onClick={handleDecrement}
          className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
        >
          <span className="text-lg text-gray-700 dark:text-gray-300">-</span>
        </button>
        <div className="text-2xl font-bold text-gray-900 dark:text-white w-8 text-center rounded-md py-1">
          {sleepHours}
        </div>
        <button
          onClick={handleIncrement}
          className="w-6 h-6 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 hover:shadow-md"
        >
          <span className="text-lg text-gray-700 dark:text-gray-300">+</span>
        </button>
      </div>

      <div className="flex justify-center items-center my-2">
        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full max-w-[180px] bg-primary-blue dark:bg-primary-blue text-white text-sm py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-all duration-200 shadow-md"
        >
          Save
        </button>
      </div>

      {/* Bar Chart */}
      <div className="flex justify-between items-center h-12 mt-3 gap-1">
        {weeklySleep.map((hours, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className={`bg-primary-blue dark:bg-primary-blue transform transition-all duration-300 ease-in-out ${
                getBarHeight(hours)
              } ${hours === null ? 'opacity-20' : 'opacity-100'}`}
            ></div>
          </div>
        ))}
      </div>

      {/* Day Labels */}
      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1 font-medium gap-1">
        <span className="flex-1 text-center">M</span>
        <span className="flex-1 text-center">T</span>
        <span className="flex-1 text-center">W</span>
        <span className="flex-1 text-center">T</span>
        <span className="flex-1 text-center">F</span>
        <span className="flex-1 text-center">S</span>
        <span className="flex-1 text-center">S</span>
      </div>
    </div>
  );
}