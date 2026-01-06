"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { FeatureKey } from '@/components/dashboard/features/featureMap';

interface DashboardContextType {
  selectedFeatures: FeatureKey[];
  addFeature: (featureKey: FeatureKey) => void;
  removeFeature: (featureKey: FeatureKey) => void;
  isFeatureSelected: (featureKey: FeatureKey) => boolean;
  reorderFeatures: (startIndex: number, endIndex: number) => void;
  isLoading: boolean;
  highlightedFeature: FeatureKey | null;
  highlightFeature: (featureKey: FeatureKey) => void;
  triggerDeepWork: boolean;
  startDeepWork: () => void;
  clearDeepWorkTrigger: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

interface DashboardProviderProps {
  children: ReactNode;
}

export const DashboardProvider: React.FC<DashboardProviderProps> = ({ children }) => {
  const [selectedFeatures, setSelectedFeatures] = useState<FeatureKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedFeature, setHighlightedFeature] = useState<FeatureKey | null>(null);
  const [triggerDeepWork, setTriggerDeepWork] = useState(false);

  const highlightFeature = useCallback((featureKey: FeatureKey) => {
    setHighlightedFeature(featureKey);
    setTimeout(() => setHighlightedFeature(null), 4000); // Clear after 4 seconds
  }, []);

  const startDeepWork = useCallback(() => {
    setTriggerDeepWork(true);
  }, []);

  const clearDeepWorkTrigger = useCallback(() => {
    setTriggerDeepWork(false);
  }, []);

  // Load layout from API when component mounts
  useEffect(() => {
    const loadLayout = async () => {
      try {
        const response = await fetch('/api/layout', {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedFeatures(data.features || []);
        } else {
          console.error('Failed to load layout:', await response.text());
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLayout();
  }, []);

  // Save layout whenever selectedFeatures changes
  useEffect(() => {
    // Skip saving during initial load
    if (isLoading) return;

    const saveLayout = async () => {
      try {
        await fetch('/api/layout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ features: selectedFeatures }),
          credentials: 'include',
        });
      } catch (error) {
        console.error('Error saving layout:', error);
      }
    };

    // Debounce the save operation to prevent too many requests
    const timeout = setTimeout(saveLayout, 500);

    return () => clearTimeout(timeout);
  }, [selectedFeatures, isLoading]);

  const addFeature = useCallback((featureKey: FeatureKey) => {
    setSelectedFeatures((prevFeatures) => {
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

  const reorderFeatures = useCallback((startIndex: number, endIndex: number) => {
    setSelectedFeatures((prevFeatures) => {
      const result = Array.from(prevFeatures);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  const value = {
    selectedFeatures,
    addFeature,
    removeFeature,
    isFeatureSelected,
    reorderFeatures,
    isLoading,
    highlightedFeature,
    highlightFeature,
    triggerDeepWork,
    startDeepWork,
    clearDeepWorkTrigger
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};