"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listMyRedemptions } from "@/lib/redemptions";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, TicketPercent } from "lucide-react";

export default function MyRedemptionsPage() {
  const { isAuthenticated, bootstrap } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Awaited<ReturnType<typeof listMyRedemptions>>["redemptions"]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { bootstrap().catch(() => {}); }, [bootstrap]);
  useEffect(() => { if (!isAuthenticated) router.push("/login"); }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listMyRedemptions({ limit: 20 });
        setRows(res.redemptions ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load redemptions");
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-3xl font-bold">My Savings</h1>
        </div>

        {error ? (
          <Card className="mb-4">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64 mt-2" /></CardContent></Card>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <TicketPercent className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">No coupon savings yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm">{r.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.redeemedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Saved {r.amountSaved}</p>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link href={`/orders/${r.orderId}`}>View order</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}