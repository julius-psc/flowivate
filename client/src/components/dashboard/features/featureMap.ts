import React from 'react';

// Import all your feature components
import Tasks from "./tasks/Tasks";
import Pomodoro from "./Pomodoro";
import Ambient from "./Ambient";
import Mood from "./Mood";
import Assistant from "./ai/Assistant";
import Meditation from "./Meditation";
import Water from "./Water";
import Books from "./books/Books";
import Sleep from "./Sleep";
import Affirmations from "./Affirmations";

// Define the type for the keys of our feature map
export type FeatureKey =
  | 'Tasks'
  | 'Pomodoro'
  | 'Ambient'
  | 'Mood'
  | 'Assistant'
  | 'Meditation'
  | 'Water'
  | 'Books'
  | 'Affirmations'
  | 'Sleep';

// Define the structure of the feature map
export const featureComponents: Record<FeatureKey, React.FC> = {
  Tasks,
  Pomodoro,
  Ambient,
  Mood,
  Assistant,
  Meditation,
  Water,
  Books,
  Sleep,
  Affirmations,
};


// Optional: Get an array of available feature keys if needed elsewhere
export const availableFeatureKeys = Object.keys(featureComponents) as FeatureKey[];