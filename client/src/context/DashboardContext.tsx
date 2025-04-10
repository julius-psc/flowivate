"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { FeatureKey } from '@/components/dashboard/features/featureMap'; // Adjust path if needed

interface DashboardContextType {
  selectedFeatures: FeatureKey[];
  addFeature: (featureKey: FeatureKey) => void;
  removeFeature: (featureKey: FeatureKey) => void; // We might need this later
  isFeatureSelected: (featureKey: FeatureKey) => boolean;
}

// Create the context with a default value (or undefined)
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Create a provider component
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);

  const addFeature = useCallback((featureKey: FeatureKey) => {
    setSelectedFeatures((prevFeatures) => {
      // Avoid adding duplicates
      if (prevFeatures.includes(featureKey)) {
        return prevFeatures;
      }
      return [...prevFeatures, featureKey];
    });
  }, []);

  const removeFeature = useCallback((featureKey: FeatureKey) => {
    setSelectedFeatures((prevFeatures) =>
      prevFeatures.filter((key) => key !== featureKey)
    );
  }, []);

  const isFeatureSelected = useCallback((featureKey: FeatureKey) => {
      return selectedFeatures.includes(featureKey);
  }, [selectedFeatures]);

  const value = {
      selectedFeatures,
      addFeature,
      removeFeature,
      isFeatureSelected
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Create a custom hook for easy context usage
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};