"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { autoSelectSingleLocation } from "@/lib/iron-session/location/location.actions";

export function AutoSelectLocation({ shouldRun }: { shouldRun: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!shouldRun) return;

    let alive = true;

    (async () => {
      const res = await autoSelectSingleLocation();
      if (!alive) return;
      if (res.ok && res.changed) router.refresh();
    })();

    return () => {
      alive = false;
    };
  }, [shouldRun, router]);

  return null;
}