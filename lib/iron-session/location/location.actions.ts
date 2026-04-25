"use server";

import { getAllLocations } from "@/lib/api";
import type { Location } from "@/types";
import { persistCustomerLocation } from "./location-persist";
import { getSession } from "../session";

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

export async function autoSelectSingleLocation() {
  const session = await getSession();
  if (session.locationId) return { ok: true as const, changed: false as const };
  const locations = (await getAllLocations()) || [];
  if (locations.length !== 1) return { ok: true as const, changed: false as const };
  const ok = await persistCustomerLocation(locations[0]);
  return { ok: ok as true, changed: ok as boolean };
}