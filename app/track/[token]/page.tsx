"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { trackDelivery } from "@/lib/tracking";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof trackDelivery>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await trackDelivery(String(token));
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Tracking failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen">
      <div className="container py-10 max-w-xl space-y-4">
        <h1 className="font-display text-3xl font-bold">Track delivery</h1>

        {loading ? (
          <Card><CardContent className="p-6"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64 mt-2" /></CardContent></Card>
        ) : error ? (
          <Card><CardContent className="p-6 text-sm text-destructive">{error}</CardContent></Card>
        ) : data ? (
          <Card>
            <CardContent className="p-6 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{data.delivery.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ETA</span>
                <span>{data.delivery.estimatedMinutes ? `${data.delivery.estimatedMinutes} min` : "—"}</span>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                Last update:{" "}
                {data.latestLocation?.recordedAt
                  ? new Date(data.latestLocation.recordedAt).toLocaleString()
                  : "—"}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}