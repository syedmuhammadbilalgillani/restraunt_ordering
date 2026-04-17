"use client";

import { Location } from "@/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface LocationState {
  selectedLocation: Location | null;
  hasHydrated: boolean;
  setSelectedLocation: (location: Location) => void;
  clearSelectedLocation: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      selectedLocation: null,
      hasHydrated: false,
      setSelectedLocation: (location) => set({ selectedLocation: location }),
      clearSelectedLocation: () => set({ selectedLocation: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "next_location",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedLocation: state.selectedLocation }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);