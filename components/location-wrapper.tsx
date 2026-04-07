"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLocationStore } from "@/store/location-store";
import { Location } from "@/types";
import { useEffect, useMemo, useState } from "react";

type LocationWrapperProps = {
  locations: Location[];
  children: React.ReactNode;
};

export function LocationWrapper({ locations, children }: LocationWrapperProps) {
  console.log(locations);
  const {
    selectedLocation,
    hasHydrated,
    setSelectedLocation,
    clearSelectedLocation,
  } = useLocationStore();
  const [pendingId, setPendingId] = useState("");

  const validSelectedLocation = useMemo(() => {
    if (!selectedLocation) return null;
    return locations.find((location) => location.id === selectedLocation.id) ?? null;
  }, [locations, selectedLocation]);

  useEffect(() => {
    if (!hasHydrated) return;

    if (locations.length === 0) {
      clearSelectedLocation();
      return;
    }

    if (locations.length === 1) {
      const [onlyLocation] = locations;
      if (!validSelectedLocation || validSelectedLocation.id !== onlyLocation.id) {
        setSelectedLocation(onlyLocation);
      }
      return;
    }
  }, [
    clearSelectedLocation,
    hasHydrated,
    locations,
    setSelectedLocation,
    validSelectedLocation,
  ]);

  const mustSelectLocation =
    hasHydrated && locations.length > 1 && !validSelectedLocation;
  const canRenderApp =
    hasHydrated && (locations.length <= 1 || Boolean(validSelectedLocation));

  const handleConfirm = () => {
    const next = locations.find((location) => location.id === pendingId);
    if (next) {
      setSelectedLocation(next);
    }
  };

  return (
    <>
      {canRenderApp && !mustSelectLocation ? children : null}

      <Dialog open={mustSelectLocation}>
        <DialogContent
          showCloseButton={false}
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Select your location</DialogTitle>
            <DialogDescription>
              Choose one location to continue. This selection is saved in your
              browser for the next app launch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label htmlFor="location-select" className="text-sm font-medium">
              Location
            </label>
            <select
              id="location-select"
              value={pendingId}
              onChange={(event) => setPendingId(event.target.value)}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>

            <Button className="w-full" onClick={handleConfirm} disabled={!pendingId}>
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
