"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getMyOrderById, type OrderDetailResponse } from "@/lib/online-orders";
import {
  ChevronLeft,
  CreditCard,
  MapPin,
  Package,
  ReceiptText,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function money(currency: string, value: unknown) {
  const s = typeof value === "string" ? value : String(value ?? "");
  const n = Number(s);
  if (Number.isFinite(n)) return `${currency} ${n.toFixed(2)}`;
  return `${currency} ${s}`;
}

function dateLabel(iso: unknown) {
  if (typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function badgeVariant(
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

type AnyObj = Record<string, unknown>;

export default function OrderDetailComponent({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OrderDetailResponse | null>(null);

  useEffect(() => {
    if (!isAuthenticated) router.push("/login");
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await getMyOrderById(String(id));
        setData(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load order");
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [id, isAuthenticated]);

  const order = (data?.order ?? {}) as AnyObj;
  const items = (data?.items ?? []) as AnyObj[];
  const payments = (data?.payments ?? []) as AnyObj[];
  const address = (data?.address ?? null) as AnyObj | null;
  const delivery = (data?.delivery ?? null) as AnyObj | null;
  const statusLogs = (data?.statusLogs ?? []) as AnyObj[];

  const currency = (order.currency as string) || "PKR";

  const totals = useMemo(() => {
    return [
      { label: "Subtotal", value: order.subtotal },
      { label: "Discount", value: order.discountAmount },
      { label: "Delivery fee", value: order.deliveryFee },
      { label: "Tax", value: order.taxAmount },
    ];
  }, [order]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen">
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-bold">Order Details</h1>
            {order.orderNumber != null ? (
              <p className="text-sm text-muted-foreground font-mono">
                {String(order.orderNumber)}
              </p>
            ) : null}
          </div>
          <div className="ml-auto flex gap-2">
            {order.status ? (
              <Badge
                variant={badgeVariant(String(order.status))}
                className="rounded-full"
              >
                {String(order.status)}
              </Badge>
            ) : null}
            {order.paymentStatus ? (
              <Badge variant="outline" className="rounded-full">
                {String(order.paymentStatus)}
              </Badge>
            ) : null}
          </div>
        </div>

        {error ? (
          <Card className="mb-6">
            <CardContent className="p-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        ) : !data ? null : (
          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Placed</span>
                  <span>{dateLabel(order.createdAt)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Type</span>
                  <span>{String(order.orderType ?? "")}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Source</span>
                  <span>{String(order.orderSource ?? "")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items.</p>
                ) : (
                  items.map((it, idx) => {
                    const mods = (it.modifiers ?? []) as AnyObj[];
                    return (
                      <div key={String(it.id ?? idx)} className="space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium">
                              {String(it.itemNameSnapshot ?? "Item")}
                              {it.quantity ? (
                                <span className="text-muted-foreground">
                                  {" "}
                                  × {String(it.quantity)}
                                </span>
                              ) : null}
                            </p>
                            {mods.length ? (
                              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                                {mods.map((m, i) => (
                                  <div key={String(m.id ?? i)}>
                                    +{" "}
                                    {String(
                                      m.modifierNameSnapshot ?? "Modifier",
                                    )}
                                    {m.quantity
                                      ? ` × ${String(m.quantity)}`
                                      : ""}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {it.specialInstructions ? (
                              <p className="text-xs text-muted-foreground mt-2">
                                Notes: {String(it.specialInstructions)}
                              </p>
                            ) : null}
                          </div>
                          <div className="text-sm font-semibold shrink-0">
                            {money(currency, it.lineTotal)}
                          </div>
                        </div>
                        {idx < items.length - 1 ? <Separator /> : null}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-primary" />
                  Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {totals.map((t) => (
                  <div key={t.label} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{t.label}</span>
                    <span>{money(currency, t.value ?? "0")}</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex justify-between gap-4 text-base font-semibold">
                  <span>Total</span>
                  <span>{money(currency, order.total ?? "0")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Delivery / Address */}
            {delivery || address ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Delivery
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {delivery?.status ? (
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Status</span>
                      <span>{String(delivery.status)}</span>
                    </div>
                  ) : null}

                  {address ? (
                    <>
                      <Separator className="my-2" />
                      <div className="space-y-1">
                        <p className="font-medium">
                          {String(address.label ?? "Address")}
                        </p>
                        <p className="text-muted-foreground">
                          {[
                            address.addressLine1,
                            address.addressLine2,
                            address.area,
                            address.city,
                            address.state,
                            address.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {address.phone ? (
                          <p className="text-muted-foreground">
                            Phone: {String(address.phone)}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            {/* Payments */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {payments.length === 0 ? (
                  <p className="text-muted-foreground">No payments recorded.</p>
                ) : (
                  payments.map((p, idx) => (
                    <div key={String(p.id ?? idx)} className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          {String(p.paymentMethod ?? "payment")} •{" "}
                          {String(p.status ?? "")}
                        </span>
                        <span className="font-semibold">
                          {money(currency, p.amount ?? "0")}
                        </span>
                      </div>
                      {Array.isArray(p.refunds) && p.refunds.length ? (
                        <div className="text-xs text-muted-foreground">
                          Refunds: {p.refunds.length}
                        </div>
                      ) : null}
                      {idx < payments.length - 1 ? (
                        <Separator className="my-2" />
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Timeline */}
            {statusLogs.length ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {statusLogs.map((l, idx) => (
                    <div
                      key={String(l.id ?? idx)}
                      className="flex items-start justify-between gap-4"
                    >
                      <div>
                        <p className="font-medium">
                          {String(l.toStatus ?? l.status ?? "Status")}
                        </p>
                        {l.note ? (
                          <p className="text-muted-foreground">
                            {String(l.note)}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {dateLabel(l.changedAt)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
