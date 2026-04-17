"use server";

import { getAllLocations } from "@/lib/api";
import type { Location } from "@/types";
import { persistCustomerLocation } from "./location-persist";

export async function setCustomerLocation(location: Location) {
  if (!location?.id?.trim()) {
    return { success: false as const, error: "location required" };
  }

  const locations = await getAllLocations();
  const canonical = locations?.find((l) => l.id === location.id.trim());

  const toSave: Location = canonical
    ? { ...canonical, ...location, id: canonical.id }
    : location;

  const ok = await persistCustomerLocation(toSave);
  if (!ok) return { success: false as const, error: "Invalid location" };
  return { success: true as const };
}