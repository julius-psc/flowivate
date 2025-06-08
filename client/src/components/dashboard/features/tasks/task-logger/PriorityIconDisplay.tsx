"use client";

import React from "react";
import { priorityLevels } from "./priorityLevels";

interface PriorityIconDisplayProps {
  level: number;
}

const PriorityIconDisplay: React.FC<PriorityIconDisplayProps> = ({ level }) => {
  const config = priorityLevels.find((p) => p.level === level);
  const DisplayIcon = config?.icon || priorityLevels[0].icon;
  const displayColor =
    level !== 0 && config?.color
      ? config.color
      : "text-gray-400 dark:text-gray-600 opacity-50";

  return (
    <DisplayIcon
      size={16}
      className={`${displayColor} transition-colors flex-shrink-0`}
    />
  );
};

export default PriorityIconDisplay;