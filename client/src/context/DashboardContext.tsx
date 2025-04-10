"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { FeatureKey } from '@/components/dashboard/features/featureMap'; // Adjust path if needed

// Define the context type, including the new reorder function
interface DashboardContextType {
  selectedFeatures: FeatureKey[];
  addFeature: (featureKey: FeatureKey) => void;
  removeFeature: (featureKey: FeatureKey) => void;
  isFeatureSelected: (featureKey: FeatureKey) => boolean;
  reorderFeatures: (startIndex: number, endIndex: number) => void; // Added for reordering
}

// Create the context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Create the provider component
interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);

  // Add a feature (no changes)
  const addFeature = useCallback((featureKey: FeatureKey) => {
    setSelectedFeatures((prevFeatures) => {
      if (prevFeatures.includes(featureKey)) {
        return prevFeatures;
      }
      return [...prevFeatures, featureKey];
    });
  }, []);

  // Remove a feature (no changes)
  const removeFeature = useCallback((featureKey: FeatureKey) => {
    setSelectedFeatures((prevFeatures) =>
      prevFeatures.filter((key) => key !== featureKey)
    );
  }, []);

  // Check if a feature is selected (no changes)
  const isFeatureSelected = useCallback((featureKey: FeatureKey) => {
      return selectedFeatures.includes(featureKey);
  }, [selectedFeatures]);

  // --- New Function: Reorder Features ---
  const reorderFeatures = useCallback((startIndex: number, endIndex: number) => {
    setSelectedFeatures((prevFeatures) => {
      const result = Array.from(prevFeatures); // Create a new array copy
      const [removed] = result.splice(startIndex, 1); // Remove the item from the start index
      result.splice(endIndex, 0, removed); // Insert the item at the end index
      return result; // Update state with the new ordered array
    });
  }, []); // No dependencies needed as it only uses the state setter

  // Value provided by the context
  const value = {
      selectedFeatures,
      addFeature,
      removeFeature,
      isFeatureSelected,
      reorderFeatures // Include the reorder function
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook for using the context (no changes)
export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};