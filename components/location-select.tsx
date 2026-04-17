"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocationStore } from "@/store/location-store";
import { Location } from "@/types";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

type LocationSelectProps = {
  locations: Location[];
  compact?: boolean;
};

export function LocationSelect({
  locations,
  compact = false,
}: LocationSelectProps) {
  const { selectedLocation, hasHydrated, setSelectedLocation } =
    useLocationStore();
  const router = useRouter();
  console.log(selectedLocation, "selectedLocation");
  const activeLocation = useMemo(() => {
    if (!selectedLocation) return null;
    return (
      locations.find((location) => location.id === selectedLocation.id) ?? null
    );
  }, [locations, selectedLocation]);

  if (!hasHydrated || locations.length <= 1) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={compact ? "gap-2 max-w-44" : "gap-2 max-w-56"}
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate text-sm">
            {activeLocation?.name ?? "Select location"}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {locations &&
          locations?.map((location) => {
            const isActive = activeLocation?.id === location.id;
            return (
              <DropdownMenuItem
                key={location.id}
                onClick={async () => {
                  setSelectedLocation(location);
                
                  await fetch("/api/set-location", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ locationId: location.id, returnTo: window.location.pathname }),
                  });
                
                  router.refresh();
                }}
                className="flex items-center justify-between"
              >
                <span>{location.name}</span>
                {isActive ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
