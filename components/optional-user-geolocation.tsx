"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  clearUserCurrentGeolocation,
  saveUserCurrentGeolocation,
} from "@/lib/iron-session/user-geo.actions";

type Props = {
  hasUserSavedGeo: boolean;
};

export function OptionalUserGeolocation({ hasUserSavedGeo }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(hasUserSavedGeo);

  useEffect(() => {
    setSaved(hasUserSavedGeo);
  }, [hasUserSavedGeo]);

  const requestAndSave = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Location is not supported in this browser.");
      return;
    }

    startTransition(() => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const res = await saveUserCurrentGeolocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (!res.success) {
            toast.error(res.error);
            return;
          }
          setSaved(true);
          toast.success("Approximate position saved.");
          router.refresh();
        },
        (err) => {
          if (err.code === 1) {
            toast.message("Location skipped", {
              description: "You can enable it later in your browser settings.",
            });
            return;
          }
          toast.error(err.message || "Could not read your location.");
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
      );
    });
  };

  const clearSaved = () => {
    startTransition(async () => {
      await clearUserCurrentGeolocation();
      setSaved(false);
      toast.success("Saved position removed.");
      router.refresh();
    });
  };

  return (
    <div className="border-b bg-muted/30 px-4 py-2 text-center text-xs text-muted-foreground">
      <span className="mr-2 inline-block align-middle max-sm:block max-sm:mb-2">
        Optional: share your approximate position for nearby offers or delivery
        estimates.
      </span>
      {saved ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={clearSaved}
        >
          Remove saved position
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 text-xs"
          disabled={isPending}
          onClick={requestAndSave}
        >
          {isPending ? "Requesting…" : "Use my current location"}
        </Button>
      )}
    </div>
  );
}
