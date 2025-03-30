import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { IconDropletFilled } from '@tabler/icons-react';

const Water = () => {
  const [waterAmount, setWaterAmount] = useState(0);
  const dailyGoal = 2000; // 2L daily goal
  const increment = 250; // 250ml increments

  const handleIncrement = () => {
    if (waterAmount < dailyGoal) {
      setWaterAmount(prev => Math.min(prev + increment, dailyGoal));
    }
  };

  const handleDecrement = () => {
    if (waterAmount > 0) {
      setWaterAmount(prev => Math.max(prev - increment, 0));
    }
  };

  const handleSave = () => {
    // Here you could add logic to save the water amount
    // For now, it just logs to console as a placeholder
    console.log(`Saved water amount: ${waterAmount}ml`);
  };

  const percentage = (waterAmount / dailyGoal) * 100;
  const remainingWater = dailyGoal - waterAmount;

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg w-full h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <IconDropletFilled className="w-6 h-6 fill-primary-blue" />
          <div>
            <span className="text-2xl font-bold text-gray-800 dark:text-gray-100">{waterAmount}</span>
            <span className="text-lg text-gray-500 dark:text-gray-400 ml-1">/ {dailyGoal}ml</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {remainingWater > 0
            ? `${remainingWater}ml left`
            : "Goal complete!"}
        </p>
      </div>

      {/* Simplified horizontal water visualization with integrated controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleDecrement}
          disabled={waterAmount === 0}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary-white dark:bg-gray-700 text-primary-blue disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-blue-100 dark:hover:bg-gray-600"
        >
          <Minus size={18} />
        </button>
        
        <div className="relative h-12 flex-grow bg-blue-50 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Water fill */}
          <div 
            className="absolute h-full top-0 left-0 transition-all duration-500 ease-out rounded-r-full"
            style={{ 
              width: `${percentage}%`, 
              background: 'linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)'
            }}
          />
          
          {/* Water level marks */}
          <div className="absolute inset-0 flex justify-between items-center px-6 pointer-events-none">
            {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
              <div 
                key={index} 
                className="h-3 w-px bg-blue-100 dark:bg-gray-600"
              />
            ))}
          </div>
        </div>
        
        <button
          onClick={handleIncrement}
          disabled={waterAmount >= dailyGoal}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary-white dark:bg-gray-700 text-primary-blue disabled:opacity-30 disabled:cursor-not-allowed transition-colors hover:bg-blue-100 dark:hover:bg-gray-600"
        >
          <Plus size={18} />
        </button>
      </div>
      
      {/* Water amount indicators */}
      <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
        <span>0</span>
        <span>1L</span>
        <span>2L</span>
      </div>

      {/* Save Button */}
      <div className="flex justify-center items-center mt-4">
        <button
          onClick={handleSave}
          className="w-full max-w-[180px] bg-primary-blue dark:bg-primary-blue text-white text-sm py-2 px-4 rounded-md hover:bg-blue-700 dark:hover:bg-blue-500 transition-all duration-200 shadow-md"
        >
          Save
        </button>
      </div>
    </div>
  );
};

export default Water;