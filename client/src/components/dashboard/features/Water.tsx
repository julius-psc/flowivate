import React, { useState } from 'react';
import { IconCirclePlus, IconCircleMinus, IconDropletFilled } from '@tabler/icons-react';

const Water: React.FC = () => {
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

  const remainingWater = dailyGoal - waterAmount;
  const percentage = (waterAmount / dailyGoal) * 100;

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleDecrement}
          className="w-12 h-12 flex items-center justify-center text-primary-blue hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={waterAmount === 0}
        >
          <IconCircleMinus className="w-8 h-8" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <IconDropletFilled className="w-6 h-6 text-primary-blue" />
            <h2 className="text-3xl font-bold text-gray-800">{waterAmount}ml</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">Water Consumed</p>
        </div>

        <button
          onClick={handleIncrement}
          className="w-12 h-12 flex items-center justify-center text-primary-blue hover:text-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={waterAmount >= dailyGoal}
        >
          <IconCirclePlus className="w-8 h-8" />
        </button>
      </div>

      <p className="text-center text-gray-600 mb-4">
        {remainingWater > 0
          ? `${remainingWater}ml left to reach your goal`
          : "You've reached your daily goal! 🎉"}
      </p>

      {/* Modern progress bar instead of icons */}
      <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-blue rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {/* Water level indicators */}
      <div className="flex justify-between mt-2 px-1 text-xs text-gray-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index}>{index * 25}%</span>
        ))}
      </div>
    </div>
  );
};

export default Water;