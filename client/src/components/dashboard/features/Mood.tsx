import React, { useState } from "react";
import {
  IconMoodSmileDizzy,
  IconMoodCry,
  IconMoodHappy,
  IconMoodTongueWink,
  IconMoodSad,
  IconMoodEmpty,
  IconMoodAngry,
  IconChevronLeft,
} from "@tabler/icons-react";

const moodIcons = [
  {
    icon: IconMoodSmileDizzy,
    value: "dizzy",
    color: "bg-[#186922]",
    textColor: "text-[#186922] dark:text-[#2ea13a]",
  },
  {
    icon: IconMoodHappy,
    value: "happy",
    color: "bg-[#46AE3A]",
    textColor: "text-[#46AE3A] dark:text-[#6cd45e]",
  },
  {
    icon: IconMoodTongueWink,
    value: "playful",
    color: "bg-[#75DB74]",
    textColor: "text-[#75DB74] dark:text-[#9cea9c]",
  },
  {
    icon: IconMoodEmpty,
    value: "neutral",
    color: "bg-[#FF9B19]",
    textColor: "text-[#FF9B19] dark:text-[#ffbc5c]",
  },
  {
    icon: IconMoodSad,
    value: "sad",
    color: "bg-[#FF7449]",
    textColor: "text-[#FF7449] dark:text-[#ff9a76]",
  },
  {
    icon: IconMoodCry,
    value: "cry",
    color: "bg-[#FF5151]",
    textColor: "text-[#FF5151] dark:text-[#ff7b7b]",
  },
  {
    icon: IconMoodAngry,
    value: "angry",
    color: "bg-[#f12828]",
    textColor: "text-[#f12828] dark:text-[#f85c5c]",
  },
];

const MoodInsights: React.FC<{
  moodHistory: string[];
  onBack: () => void;
}> = ({ moodHistory, onBack }) => {
  const grid = Array(28)
    .fill(null)
    .map((_, index) =>
      moodHistory[index]
        ? moodIcons.find((m) => m.value === moodHistory[index])?.color
        : "bg-gray-200 dark:bg-gray-700"
    );

  const totalLogged = moodHistory.length > 28 ? 28 : moodHistory.length;
  const positiveMoods = moodHistory
    .slice(0, 28)
    .filter((mood) => mood === "dizzy" || mood === "happy").length;
  const mentalHealthPercentage =
    totalLogged > 0 ? Math.round((positiveMoods / totalLogged) * 100) : 0;

  // Get current date
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Get next month
  const nextMonthDate = new Date(currentDate);
  nextMonthDate.setMonth(currentDate.getMonth() + 1);
  const nextMonth = nextMonthDate.toLocaleString('default', { month: 'long' });
  const nextYear = nextMonthDate.getFullYear();

  return (
    <div className="bg-white dark:bg-gray-800 text-primary-black dark:text-gray-200 rounded-lg w-96 h-68 p-4 flex flex-col">
      <div className="flex items-center mb-4">
        <button onClick={onBack} className="mr-2">
          <IconChevronLeft size={24} className="text-gray-800 dark:text-gray-200" />
        </button>
        <h2 className="text-lg font-semibold">My Mood Insights</h2>
      </div>
      <div className="mt-1">
        <div className="mb-2">
          <span className="font-medium text-primary-black dark:text-gray-300 text-sm opacity-60">
            {`${currentMonth} ${currentYear}`}
          </span>
        </div>
      </div>

      <div className="flex flex-1">
        <div className="grid grid-cols-7 gap-x-4 gap-y-3 mr-4">
          {grid.map((color, index) => (
            <div key={index} className={`w-4 h-4 rounded-full ${color}`} />
          ))}
        </div>

        <div className="ml-4">
          <div className="text-3xl font-extrabold">{mentalHealthPercentage}%</div>
          <div className="text-sm mt-2">
            {mentalHealthPercentage >= 70
              ? "Congratulations! You are mentally healthy this month"
              : "Keep tracking your mood!"}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <span className="font-medium text-primary-black dark:text-gray-300 text-sm opacity-60">
          {`${nextMonth} ${nextYear}`}
        </span>
        <div className="text-sm text-primary-black dark:text-gray-400 opacity-60">
          No data yet.
        </div>
      </div>
    </div>
  );
};

const MoodPicker: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [showInsights, setShowInsights] = useState(false);
  const [moodHistory, setMoodHistory] = useState<string[]>([]);

  const handleMoodClick = (value: string, index: number) => {
    setSelectedMood(value);
    const angle = (180 / (moodIcons.length - 1)) * index;
    setRotation(90 - angle);
  };

  const handleLogMood = () => {
    if (selectedMood) {
      setMoodHistory((prev) => [...prev, selectedMood]);
      setShowInsights(true);
      setSelectedMood(null);
      setRotation(0);
    }
  };

  const handleBack = () => {
    setShowInsights(false);
  };

  if (showInsights) {
    return <MoodInsights moodHistory={moodHistory} onBack={handleBack} />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-2">
      <div className="flex justify-between mt-2 relative">
        <h2 className="text-lg font-semibold text-gray-900 pl-2 dark:text-gray-200">
          How do you feel today?
        </h2>
        <p className="bg-primary-white dark:bg-gray-700 text-primary-black dark:text-gray-200 font-medium opacity-60 mr-1 px-2 rounded-md">
          My mood
        </p>
      </div>

      <div className="relative w-full h-48">
        <div className="absolute w-full h-48 overflow-hidden bottom-0">
          <div
            className="absolute rounded-full border-gray-800 dark:border-gray-200 border-6 bg-transparent inner-circle transition-all duration-300 ease-in-out"
            style={{
              width: "180px",
              height: "180px",
              left: "50%",
              bottom: "-88px",
              transform: `translateX(-50%) rotate(${rotation}deg)`,
              zIndex: 0,
            }}
          />
        </div>

        <div className="relative w-full h-full">
          {moodIcons.map((mood, index) => {
            const IconComponent = mood.icon;
            const isSelected = selectedMood === mood.value;
            const size = 56;

            const radius = 140;
            const verticalScale = 0.8;
            const angle = (180 / (moodIcons.length - 1)) * index;
            const angleRad = (angle * Math.PI) / 180;

            const x = radius * Math.cos(angleRad);
            let y = radius * Math.sin(angleRad) * verticalScale;

            const maxAngle = 90;
            const distanceFromCenter = Math.abs(angle - maxAngle) / maxAngle;
            const downwardAdjustment =
              24 * distanceFromCenter * distanceFromCenter;
            y -= downwardAdjustment;

            return (
              <div
                key={index}
                className="cursor-pointer absolute transition-all duration-200 ease-in-out"
                style={{
                  left: `calc(50% + ${x}px)`,
                  bottom: `${y}px`,
                  transform: "translateX(-50%)",
                  zIndex: isSelected ? 10 : 1,
                }}
                onClick={() => handleMoodClick(mood.value, index)}
              >
                <IconComponent
                  size={size}
                  className={`${mood.textColor} transition-all duration-200 ease-in-out`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .inner-circle::before {
          content: "";
          position: absolute;
          top: -16px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 12px solid #242a31;
          z-index: 1;
        }

        @media (prefers-color-scheme: dark) {
          .inner-circle::before {
            border-bottom: 12px solid #e5e7eb;
          }
        }
      `}</style>
      <div className="flex justify-center items-center">
        <button
          className="cursor-pointer bg-primary-black dark:bg-gray-700 text-primary-white dark:text-gray-200 font-semibold px-3 py-1 mb-2 rounded-2xl disabled:opacity-50"
          onClick={handleLogMood}
          disabled={!selectedMood}
        >
          Log mood
        </button>
      </div>
    </div>
  );
};

export default MoodPicker;