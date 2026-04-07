"use client";

import { decrypt, encrypt } from "@/lib/secureStorage";
import { Location } from "@/types";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

interface LocationState {
  selectedLocation: Location | null;
  hasHydrated: boolean;
  setSelectedLocation: (location: Location) => void;
  clearSelectedLocation: () => void;
  setHasHydrated: (value: boolean) => void;
}

const LOCATION_STORAGE_SECRET = process.env.NEXT_PUBLIC_STORAGE_SECRET || "";

const encryptedLocationStorage: StateStorage = {
  getItem: async (name) => {
    const encryptedValue = localStorage.getItem(name);
    if (!encryptedValue) return null;

    try {
      return await decrypt(encryptedValue, LOCATION_STORAGE_SECRET);
    } catch {
      localStorage.removeItem(name);
      return null;
    }
  },
  setItem: async (name, value) => {
    const encryptedValue = await encrypt(value, LOCATION_STORAGE_SECRET);
    localStorage.setItem(name, encryptedValue);
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

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
      storage: createJSONStorage(() => encryptedLocationStorage),
      partialize: (state) => ({ selectedLocation: state.selectedLocation }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
