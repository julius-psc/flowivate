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
    console.log(`Saved water amount: ${waterAmount}ml`);
  };

  const percentage = Math.min((waterAmount / dailyGoal) * 100, 100);
  const remainingWater = dailyGoal - waterAmount;

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-bg-dark rounded-lg w-full max-w-md mx-auto border border-gray-200 dark:border-gray-700">
      {/* Header with water icon and amount */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <IconDropletFilled className="w-10 h-10 text-primary-blue dark:text-primary-blue" />
          <div className="absolute -bottom-1 -right-1 bg-primary-blue dark:bg-primary-blue text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            +
          </div>
        </div>
        <div className="text-center">
          <span className="text-3xl font-bold text-gray-800 dark:text-white">{waterAmount}</span>
          <span className="text-lg text-gray-500 dark:text-gray-300 ml-1">/ {dailyGoal}ml</span>
        </div>
        <p className={`mt-2 text-sm font-medium ${remainingWater > 0 ? 'text-gray-500 dark:text-gray-400' : 'text-green-500 dark:text-green-400'}`}>
          {remainingWater > 0 ? `${remainingWater}ml remaining` : "Goal achieved! 🎉"}
        </p>
      </div>

      {/* Water progress bar with controls */}
      <div className="w-full mb-6">
        {/* Water level indicators */}
        <div className="flex justify-between mb-1 text-xs text-gray-400 dark:text-gray-500">
          <span>0</span>
          <span>1L</span>
          <span>2L</span>
        </div>
        
        {/* Interactive progress bar */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleDecrement}
            disabled={waterAmount === 0}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
          >
            <Minus size={20} strokeWidth={2.5} />
          </button>
          
          <div className="relative h-6 flex-grow bg-blue-50 dark:bg-gray-700 rounded-full overflow-hidden">
            {/* Water fill with animated wave effect */}
            <div 
              className="absolute h-full top-0 left-0 transition-all duration-700 ease-out rounded-r-full"
              style={{ 
                width: `${percentage}%`, 
                background: 'linear-gradient(90deg, rgba(147,197,253,0.8) 0%, rgba(59,130,246,0.9) 100%)',
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white to-transparent opacity-30"></div>
            </div>
            
            {/* Water level marks */}
            <div className="absolute inset-0 flex justify-between items-center px-4 pointer-events-none">
              {[1, 2, 3, 4, 5, 6, 7].map((_, index) => (
                <div 
                  key={index} 
                  className="h-3 w-px bg-blue-200 dark:bg-gray-600"
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={handleIncrement}
            disabled={waterAmount >= dailyGoal}
            className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 text-blue-500 dark:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 hover:bg-blue-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Save Button with pulse animation when goal is reached */}
      <button
        onClick={handleSave}
        disabled={waterAmount === 0}
        className={`w-full py-3 px-6 rounded-xl bg-primary-blue dark:bg-primary-blue text-white font-medium transition-all duration-300 hover:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
          waterAmount >= dailyGoal ? 'animate-pulse' : ''
        }`}
      >
        {waterAmount >= dailyGoal ? 'Well Done! Save' : 'Save Water Intake'}
      </button>
    </div>
  );
};

export default Water;