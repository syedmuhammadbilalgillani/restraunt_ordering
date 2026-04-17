"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { setCustomerLocation } from "@/lib/iron-session/location/location.actions";
import type { Location } from "@/types";

type Props = {
  locations: Location[];
  requireSelection: boolean;
  defaultLocation?: string | null;
};

export function LocationPickerDialog({
  locations,
  requireSelection,
  defaultLocation = null,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(requireSelection);
  const [pending, setPending] = useState<Location | null>(
    defaultLocation
      ? (locations.find((l) => l.id === defaultLocation) ?? null)
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (requireSelection) {
      setTimeout(() => {
        setOpen(true);
      }, 100);
    }
  }, [requireSelection]);

  if (locations.length <= 1) return null;

  const onContinue = () => {
    if (!pending) return;
    setError(null);
    startTransition(async () => {
      const res = await setCustomerLocation(pending);
      if (!res.success) {
        setError(res.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Select your location</DialogTitle>
          <DialogDescription>
            Choose a branch to continue. Your choice is saved for return visits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="location-picker">Location</Label>
            <select
              id="location-picker"
              value={pending?.id ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                setPending(
                  id ? (locations.find((l) => l.id === id) ?? null) : null,
                );
              }}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            className="w-full"
            onClick={onContinue}
            disabled={!pending || isPending}
          >
            {isPending ? "Saving…" : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
