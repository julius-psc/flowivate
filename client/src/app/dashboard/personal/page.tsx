"use client";

import React from 'react';
import { useDashboard } from '../../../context/DashboardContext'; 
import { availableFeatureKeys, FeatureKey } from '../../../components/dashboard/features/featureMap';
import { IconPlus, IconCheck } from '@tabler/icons-react'; // Example icons

export default function Personal() {
  const { addFeature, isFeatureSelected } = useDashboard();

  return (
    <div className="p-4">
       <h2 className="text-2xl font-semibold mb-4 dark:text-primary-white">Add Features to Dashboard</h2>
       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Iterate over the available feature keys */}
        {availableFeatureKeys.map((key: FeatureKey) => {
          const isSelected = isFeatureSelected(key);
          // Optional: Get the component if you want to show a preview
          // const FeatureComponent = featureComponents[key];

          return (
            <div
              key={key}
              className="p-4 border border-gray-200 dark:border-gray-800/50 bg-white dark:bg-bg-dark rounded-lg flex flex-col items-center justify-between"
            >
              <h3 className="text-lg font-medium mb-2 dark:text-gray-100">{key}</h3>
              {/* You could render a small preview of the component here if desired */}
              {/* <div className="w-full h-24 mb-3 border dark:border-gray-700 rounded flex items-center justify-center text-gray-400">Preview Area</div> */}

              <button
                onClick={() => addFeature(key)}
                disabled={isSelected}
                className={`mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isSelected
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white'
                }`}
              >
                {isSelected ? (
                  <>
                    <IconCheck size={16} /> Added
                  </>
                ) : (
                  <>
                    <IconPlus size={16} /> Add to Dashboard
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}