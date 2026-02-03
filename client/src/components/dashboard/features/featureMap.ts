import React from "react";

// Import all your feature components
import Tasks from "./tasks/Tasks";
import Pomodoro from "./pomodoro/Pomodoro";
import Ambient from "./Ambient";
import Mood from "./Mood";
import Assistant from "./ai/Assistant";
import Meditation from "./Meditation";
import Water from "./Water";
import Books from "./books/Books";
import Sleep from "./Sleep";
import Affirmations from "./Affirmations";
import DeepWork from "./DeepWork";
import Journal from "./journal/Journal";

// Define the type for the keys of our feature map
export type FeatureKey =
  | "Tasks"
  | "Pomodoro"
  | "Ambient"
  | "Mood"
  | "Assistant"
  | "Meditation"
  | "Water"
  | "Books"
  | "Affirmations"
  | "Sleep"
  | "Journal"
  | "DeepWork";

// Define the structure for each feature entry
type FeatureEntry = {
  component: React.FC;
  isPro?: boolean; // Optional: if undefined or false → free
};

// Define the feature map with isPro directly here
export const featureComponents: Record<FeatureKey, FeatureEntry> = {
  Tasks: { component: Tasks },
  Pomodoro: { component: Pomodoro },
  Ambient: { component: Ambient, isPro: true },
  Mood: { component: Mood, isPro: true },
  Assistant: { component: Assistant, isPro: true },
  Meditation: { component: Meditation },
  Water: { component: Water },
  Books: { component: Books },
  Sleep: { component: Sleep, isPro: true },
  Affirmations: { component: Affirmations },
  Journal: { component: Journal },
  DeepWork: { component: DeepWork, isPro: true },
};

// Optional: Get an array of available feature keys if needed elsewhere
export const availableFeatureKeys = Object.keys(featureComponents) as FeatureKey[];