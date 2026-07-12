"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_USER_SETTINGS,
  SETTINGS_STORAGE_KEY,
  type UserSettings,
} from "@/lib/settings-preferences";

type SettingsStore = {
  hydrated: boolean;
  resetSettings: () => void;
  settings: UserSettings;
  setHydrated: (hydrated: boolean) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      hydrated: false,
      settings: DEFAULT_USER_SETTINGS,
      resetSettings: () => set({ settings: DEFAULT_USER_SETTINGS }),
      setHydrated: (hydrated) => set({ hydrated }),
      updateSettings: (settings) =>
        set((state) => ({
          settings: {
            ...state.settings,
            ...settings,
          },
        })),
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
      partialize: (state) => ({
        settings: state.settings,
      }),
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
