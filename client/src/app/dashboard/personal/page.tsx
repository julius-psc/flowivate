"use client";

import React from "react";
import { useDashboard } from "../../../context/DashboardContext";
import { FeatureKey } from "../../../components/dashboard/features/featureMap";
import { IconPlus, IconCheck } from "@tabler/icons-react";

// Define feature categories
const featureCategories: Record<string, FeatureKey[]> = {
  "Productivity": ["Tasks", "Pomodoro"],
  "Wellness": ["Meditation", "Water", "Sleep", "Mood"],
  "Environment": ["Ambient"],
  "Tools": ["Assistant", "Books"],
};

export default function Personal() {
  const { addFeature, isFeatureSelected } = useDashboard();

  return (
    <div className="min-h-screen p-6">
      <h2 className="text-2xl font-semibold mb-8 text-gray-900 dark:text-gray-100">
        Tailor Your Dashboard
      </h2>

      {/* Render features by category */}
      {Object.entries(featureCategories).map(([category, features]) => (
        <div key={category} className="mb-8">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {features.map((key: FeatureKey) => {
              const isSelected = isFeatureSelected(key);

              return (
                <div
                  key={key}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                >
                  {/* Feature Icon Placeholder */}
                  <div className="w-10 h-10 mb-3 bg-blue-500 dark:bg-blue-600 rounded-md flex items-center justify-center text-white font-medium">
                    {key[0].toUpperCase()}
                  </div>

                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {key}
                  </h4>
                  <button
                    onClick={() => addFeature(key)}
                    disabled={isSelected}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                      isSelected
                        ? "bg-gray-100 dark:bg-gray-800 text-green-600 dark:text-green-500 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                        : "bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700"
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <IconCheck size={16} /> Added
                      </>
                    ) : (
                      <>
                        <IconPlus size={16} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}