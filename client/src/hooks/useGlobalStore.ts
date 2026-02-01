import { create } from "zustand";

export type LumoEvent =
  | "TASK_COMPLETED"
  | "POMO_FINISHED"
  | "JOURNAL_SAVED"
  | "BOOK_LOGGED"
  | "TASK_LIST_COMPLETED"
  | null;

export type AppCommand = "START_BREAK" | "START_TIMER" | null;

export interface MoodEntry {
  mood: string;
  timestamp: Date;
}

interface GlobalStoreState {
  lumoEvent: LumoEvent;
  triggerLumoEvent: (event: LumoEvent) => void;
  clearLumoEvent: () => void;

  appCommand: AppCommand;
  triggerAppCommand: (command: AppCommand) => void;
  clearAppCommand: () => void;

  moodHistory: MoodEntry[] | null;
  setMoodHistory: (history: MoodEntry[]) => void;
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
  lumoEvent: null,
  triggerLumoEvent: (event: LumoEvent): void => set({ lumoEvent: event }),
  clearLumoEvent: (): void => set({ lumoEvent: null }),

  appCommand: null,
  triggerAppCommand: (command: AppCommand): void => set({ appCommand: command }),
  clearAppCommand: (): void => set({ appCommand: null }),

  moodHistory: null,
  setMoodHistory: (history: MoodEntry[]): void => set({ moodHistory: history }),
}));