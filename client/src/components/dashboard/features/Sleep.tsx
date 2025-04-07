'use client';

import { useState, } from 'react';

export default function Sleep() {
  const [sleepHours, setSleepHours] = useState(8);
  const [weeklySleep, setWeeklySleep] = useState<number[]>([0,0,0,0,0,0,0]);
  const [loading, ] = useState(false);

  const handleIncrement = () => {
    if (sleepHours < 12) setSleepHours(sleepHours + 1);
  };

  const handleDecrement = () => {
    if (sleepHours > 0) setSleepHours(sleepHours - 1);
  };

  const handleSave = () => {
    const newWeeklySleep = [...weeklySleep];
    newWeeklySleep[6] = sleepHours; // Update the last day with current value
    setWeeklySleep(newWeeklySleep);
    // You would add your API call here
  };

  // Function to determine the height and color class for sleep bars
  const getSleepBarStyle = (value: number | null) => {
    if (!value) return { height: '10px', colorClass: 'bg-primary-black-dark' }; // no-sleep equivalent
    
    if (value >= 8) return { height: '70px', colorClass: 'bg-primary-blue' }; // optimal-sleep
    if (value >= 4) return { height: '40px', colorClass: 'bg-primary-blue' }; // decent-sleep
    if (value >= 1) return { height: '20px', colorClass: 'bg-primary-blue' }; // little-sleep
    
    return { height: '10px', colorClass: 'bg-gray-500' }; // no-sleep
  };

  return (
    <div className="bg-white border border-gray-200 dark:bg-bg-dark rounded-lg p-6 h-full w-full">
      {/* Header with controls */}
      <div className="">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-normal text-gray-800 dark:text-gray-100">
          How much did you sleep  ?
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
            My sleep
          </span>
        </div>
      </div>
        
        {/* Sleep Counter Controls */}
        <div className="flex items-center justify-center">
          <button 
            onClick={handleDecrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer"
          >
            -
          </button>
          <p className="text-primary-black dark:text-primary-white font-medium text-2xl mx-1.5 my-1">
            {sleepHours}
          </p>
          <button 
            onClick={handleIncrement}
            className="text-primary-blue text-2xl font-bold bg-transparent border-none cursor-pointer"
          >
            +
          </button>
        </div>
      
      </div>
      
      {/* Sleep Graph */}
      <div className="h-20 flex justify-around items-center mx-24 pb-5">
        {loading ? (
          <p className="text-white">Loading sleep data...</p>
        ) : (
          weeklySleep.map((value, index) => {
            const { height, colorClass } = getSleepBarStyle(value);
            
            return value === 0 ? (
              // No sleep - render a circle
              <div 
                key={index}
                className={`h-2.5 w-2.5 rounded-full ${colorClass}`}
              ></div>
            ) : (
              // Sleep - render a rounded bar
              <div 
                key={index}
                className={`w-2 rounded-lg ${colorClass}`}
                style={{ height }}
              ></div>
            );
          })
        )}
      </div>
      <div className="flex justify-center">
        <button
            className="dark:bg-primary-black-dark text-primary-black dark:text-primary-white mx-2.5 px-6 py-2 rounded-full text-sm font-normal transition-colors duration-200"
            onClick={handleSave}
          >
            Log sleep
          </button>
      </div>
    </div>
  );
}