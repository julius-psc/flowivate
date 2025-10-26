import { create } from "zustand";

export type LumoEvent =
  | "TASK_COMPLETED"
  | "POMO_FINISHED"
  | "JOURNAL_SAVED"
  | "BOOK_LOGGED"
  | null;

export type AppCommand = "START_BREAK" | "START_TIMER" | null;

interface GlobalStoreState {
  lumoEvent: LumoEvent;
  triggerLumoEvent: (event: LumoEvent) => void;
  clearLumoEvent: () => void;

  appCommand: AppCommand;
  triggerAppCommand: (command: AppCommand) => void;
  clearAppCommand: () => void;
}

export const useGlobalStore = create<GlobalStoreState>((set) => ({
    lumoEvent: null,
    triggerLumoEvent: (event: LumoEvent): void => set({ lumoEvent: event }),
    clearLumoEvent: (): void => set({ lumoEvent: null }),

    appCommand: null,
    triggerAppCommand: (command: AppCommand): void => set({ appCommand: command }),
    clearAppCommand: (): void => set({ appCommand: null }),
}));