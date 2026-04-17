"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listMyOrders, type OrdersListResponse } from "@/lib/online-orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

type StatusFilter =
  | "all"
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

function formatMoney(currency: string, value: string) {
  const n = Number(value);
  if (Number.isFinite(n)) return `${currency} ${n.toFixed(2)}`;
  return `${currency} ${value}`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const s = status?.toLowerCase?.() ?? "";
  if (["delivered"].includes(s)) return "default";
  if (["cancelled"].includes(s)) return "destructive";
  if (
    ["pending", "confirmed", "preparing", "ready", "out_for_delivery"].includes(
      s,
    )
  )
    return "secondary";
  return "outline";
}

function paymentBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  const s = status?.toLowerCase?.() ?? "";
  if (["paid", "captured", "success"].includes(s)) return "default";
  if (["failed"].includes(s)) return "destructive";
  if (["unpaid", "pending"].includes(s)) return "secondary";
  return "outline";
}

export default function OrdersPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [rows, setRows] = useState<OrdersListResponse["data"]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const filters = useMemo(
    () =>
      [
        { id: "all", label: "All" },
        { id: "pending", label: "Pending" },
        { id: "preparing", label: "Preparing" },
        { id: "delivered", label: "Delivered" },
        { id: "cancelled", label: "Cancelled" },
      ] as const,
    [],
  );

  async function loadFirstPage() {
    setLoading(true);
    setError(null);
    try {
      const res = await listMyOrders({
        limit: 20,
        status: filter === "all" ? undefined : filter,
      });
      setRows(res.data ?? []);
      setNextCursor(res.nextCursor ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
      setRows([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const res = await listMyOrders({
        limit: 20,
        cursor: nextCursor,
        status: filter === "all" ? undefined : filter,
      });
      setRows((prev) => [...prev, ...(res.data ?? [])]);
      setNextCursor(res.nextCursor ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more orders");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    // if (!isAuthenticated) return;
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold">My Orders</h1>
            <p className="text-sm text-muted-foreground">
              Track your recent orders and history
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? "default" : "outline"}
              className="rounded-xl"
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {error ? (
          <Card className="mb-6">
            <CardContent className="p-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {/* Loading */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-56" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <PackageSearch className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display text-xl font-bold mb-1">
                No orders yet
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Once you place an order, it’ll show up here.
              </p>
              <Button asChild className="rounded-xl">
                <Link href="/menu">Browse Menu</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {rows.map((o) => (
                <Link key={o.id} href={`/orders/${o.id}`}>
                  <Card className="hover:shadow-md transition-all hover:bg-accent/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-mono text-sm">{o.orderNumber}</p>
                            <Badge
                              variant={statusBadgeVariant(o.status)}
                              className="rounded-full"
                            >
                              {o.status}
                            </Badge>
                            <Badge
                              variant={paymentBadgeVariant(o.paymentStatus)}
                              className="rounded-full"
                            >
                              {o.paymentStatus}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">
                            {o.orderType} • {formatDate(o.createdAt)}
                          </p>
                        </div>

                        <div className={cn("text-right shrink-0")}>
                          <div className="font-semibold">
                            {formatMoney(o.currency, o.total)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center justify-end gap-1 mt-1">
                            View <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              {nextCursor ? (
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load more"}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  You’ve reached the end.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
