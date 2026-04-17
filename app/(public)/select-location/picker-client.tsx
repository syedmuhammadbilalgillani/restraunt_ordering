"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Location } from "@/types";
import { useLocationStore } from "@/store/location-store";

export function LocationPickerClient({
  locations,
  returnTo,
}: {
  locations: Location[];
  returnTo: string;
}) {
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setSelectedLocation } = useLocationStore();
  const submit = async () => {
    setLoading(true);
    const selectedLocation = locations.find((l) => l.id === locationId);
    if (selectedLocation) {
      setSelectedLocation(selectedLocation);
    }
    const res = await fetch("/api/set-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId, returnTo }),
    });

    if (res.ok) {
      router.replace(returnTo);
      router.refresh(); // ensures server components see cookie immediately
      return;
    }

    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <select
        value={locationId}
        onChange={(e) => setLocationId(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Select a location</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <button
        onClick={submit}
        disabled={!locationId || loading}
        className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}
